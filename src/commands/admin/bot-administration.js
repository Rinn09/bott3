const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");
const User = require("../../models/User"); // Cho reset-user và market-tax-fund
const Logger = require("../../utils/logger");
const path = require("path");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bot-admin")
    .setDescription("[Admin/Owner] Các lệnh quản trị bot và server nâng cao.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Quyền chung, sẽ check OWNER_ID cho lệnh cụ thể
    .addSubcommand((subcommand) =>
      subcommand
        .setName("change-prefix")
        .setDescription(
          "Thay đổi prefix của bot cho tin nhắn lệnh (nếu prefix handler được dùng).",
        )
        .addStringOption((option) =>
          option
            .setName("new_prefix")
            .setDescription("Prefix mới (tối đa 5 ký tự).")
            .setRequired(true)
            .setMaxLength(5),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("disable-command")
        .setDescription(
          "Vô hiệu hóa một slash command trong một kênh hoặc toàn server.",
        )
        .addStringOption((option) =>
          option
            .setName("command_name")
            .setDescription("Tên của slash command cần vô hiệu hóa.")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription(
              "Kênh cụ thể (để trống nếu muốn vô hiệu hóa toàn server).",
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enable-command")
        .setDescription("Kích hoạt lại một slash command đã bị vô hiệu hóa.")
        .addStringOption((option) =>
          option
            .setName("command_name")
            .setDescription("Tên của slash command cần kích hoạt.")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription(
              "Kênh cụ thể (để trống nếu muốn kích hoạt toàn server).",
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("refresh-commands")
        .setDescription(
          "[OWNER ONLY] Xóa và đăng ký lại tất cả slash commands global.",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset-user-data")
        .setDescription(
          "[OWNER ONLY] Reset TOÀN BỘ dữ liệu của một người dùng về mặc định.",
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người dùng cần reset dữ liệu.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription(
          "Xem tình trạng cấu hình các tính năng của bot trong server.",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("market-tax-fund")
        .setDescription(
          "Xem tổng số tiền thuế chợ đã thu được vào quỹ bot của server này.",
        ),
    ),

  async execute(interaction, client) {
    // Nhận client để dùng cho refresh-commands
    const subcommand = interaction.options.getSubcommand();
    const adminUser = interaction.user;
    const guildId = interaction.guild.id;

    // --- Check OWNER_ID cho các lệnh nhạy cảm ---
    if (subcommand === "refresh-commands" || subcommand === "reset-user-data") {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({
          content: "❌ Lệnh này chỉ dành cho Chủ sở hữu Bot (OWNER_ID).",
          ephemeral: true,
        });
      }
    }
    // --------------------------------------------

    // Defer reply cho các lệnh có thể mất thời gian
    if (
      [
        "refresh-commands",
        "reset-user-data",
        "disable-command",
        "enable-command",
        "status",
        "market-tax-fund",
      ].includes(subcommand)
    ) {
      await interaction.deferReply({ ephemeral: true });
    }

    try {
      if (subcommand === "change-prefix") {
        const newPrefix = interaction.options.getString("new_prefix");
        if (!newPrefix || newPrefix.length > 5) {
          // Check lại phòng trường hợp MaxLength không hoạt động
          return interaction.reply({
            content: "❌ Prefix phải từ 1 đến 5 ký tự.",
            ephemeral: true,
          });
        }

        let config = await GuildConfig.findOne({ guildId });
        if (!config) {
          config = new GuildConfig({ guildId });
        }
        config.prefix = newPrefix;
        await config.save();

        // Xóa cache prefix nếu có (quan trọng cho prefixHandler)
        if (client.prefixCache) {
          // client.prefixCache được tạo trong prefixHandler
          client.prefixCache.delete(guildId);
        }

        await interaction.reply({
          content: `✅ Prefix mới của server là \`${newPrefix}\`. Các lệnh prefix (nếu có) sẽ dùng prefix này.`,
        });
        Logger.info(
          `[BotAdmin/ChangePrefix] Admin ${adminUser.tag} changed prefix to "${newPrefix}" for guild ${guildId}`,
        );
      } else if (subcommand === "disable-command") {
        const commandName = interaction.options
          .getString("command_name")
          .toLowerCase();
        const channel = interaction.options.getChannel("channel");

        const commandToDisable = client.commands.get(commandName);
        if (!commandToDisable) {
          return interaction.editReply({
            content: `❌ Không tìm thấy lệnh slash command nào tên là \`${commandName}\`.`,
          });
        }

        let config = await GuildConfig.findOne({ guildId });
        if (!config) {
          config = new GuildConfig({
            guildId,
            disabledCommands: new Map(),
            disabledChannels: new Map(),
          });
        }
        if (!config.disabledCommands) config.disabledCommands = new Map();
        if (!config.disabledChannels) config.disabledChannels = new Map();

        if (channel) {
          // Vô hiệu hóa lệnh trong một kênh cụ thể
          const currentDisabledInChannel =
            config.disabledCommands.get(commandName) || [];
          if (!currentDisabledInChannel.includes(channel.id)) {
            currentDisabledInChannel.push(channel.id);
            config.disabledCommands.set(commandName, currentDisabledInChannel);
          }
        } else {
          // Vô hiệu hóa lệnh trên toàn bộ server (cho mọi kênh)
          config.disabledCommands.set(commandName, ["all"]);
        }

        await config.save();
        await interaction.editReply(
          `✅ Đã vô hiệu hóa lệnh \`/${commandName}\` ${channel ? `trong kênh ${channel}` : "trên toàn bộ server"}.`,
        );
        Logger.info(
          `[BotAdmin/DisableCmd] Admin ${adminUser.tag} disabled /${commandName} ${channel ? `in #${channel.name}` : "globally in guild"}.`,
        );
      } else if (subcommand === "enable-command") {
        const commandName = interaction.options
          .getString("command_name")
          .toLowerCase();
        const channel = interaction.options.getChannel("channel");

        let config = await GuildConfig.findOne({ guildId });
        if (!config || !config.disabledCommands) {
          return interaction.editReply({
            content: "ℹ️ Không có lệnh nào đang bị vô hiệu hóa để kích hoạt.",
          });
        }

        if (channel) {
          // Kích hoạt lệnh trong một kênh cụ thể
          let disabledInChannels = config.disabledCommands.get(commandName);
          if (disabledInChannels) {
            disabledInChannels = disabledInChannels.filter(
              (chId) => chId !== channel.id,
            );
            if (disabledInChannels.length === 0) {
              config.disabledCommands.delete(commandName);
            } else {
              config.disabledCommands.set(commandName, disabledInChannels);
            }
          }
        } else {
          // Kích hoạt lệnh trên toàn bộ server
          config.disabledCommands.delete(commandName);
        }
        // Cũng cần xem xét disabledChannels nếu có
        if (config.disabledChannels && config.disabledChannels.get("all")) {
          config.disabledChannels.delete("all");
          Logger.info(
            `[BotAdmin/EnableCmd] Bot-wide command disable removed by ${adminUser.tag}.`,
          );
        }
        if (
          channel &&
          config.disabledChannels &&
          config.disabledChannels.get(channel.id)
        ) {
          config.disabledChannels.delete(channel.id);
          Logger.info(
            `[BotAdmin/EnableCmd] Channel-wide command disable for ${channel.name} removed by ${adminUser.tag}.`,
          );
        }

        await config.save();
        await interaction.editReply(
          `✅ Đã kích hoạt lại lệnh \`/${commandName}\` ${channel ? `trong kênh ${channel}` : "trên toàn bộ server (nếu không bị vô hiệu hóa ở cấp cao hơn)"}.`,
        );
        Logger.info(
          `[BotAdmin/EnableCmd] Admin ${adminUser.tag} enabled /${commandName} ${channel ? `in #${channel.name}` : "globally in guild"}.`,
        );
      } else if (subcommand === "refresh-commands") {
        // Logic từ refreshCommands.js (đã có sẵn trong commandHandler của bạn)
        try {
          await client.commandHandler.refreshCommands(); // Gọi hàm từ commandHandler
          await interaction.editReply(
            "✅ Đã xóa và đăng ký lại tất cả lệnh global thành công!",
          );
          Logger.info(
            `[BotAdmin/RefreshCmd] Owner ${adminUser.tag} refreshed all global commands.`,
          );
        } catch (error) {
          Logger.error(
            `[BotAdmin/RefreshCmd] Error refreshing commands: ${error.message}`,
            { stack: error.stack },
          );
          await interaction.editReply("❌ Có lỗi xảy ra khi làm mới lệnh.");
        }
      } else if (subcommand === "reset-user-data") {
        // Logic từ reset-user.js
        const targetToReset = interaction.options.getUser("user");
        if (targetToReset.bot) {
          return interaction.editReply({
            content: "❌ Không thể reset dữ liệu của bot.",
          });
        }

        // Tạo nút xác nhận (vì đây là hành động nguy hiểm)
        const confirmId = `confirm_reset_user_data_${targetToReset.id}_${interaction.id}`;
        const cancelId = `cancel_reset_user_data_${interaction.id}`;
        const confirmButton = new ButtonBuilder()
          .setCustomId(confirmId)
          .setLabel(`Reset ${targetToReset.username}`)
          .setStyle(ButtonStyle.Danger);
        const cancelButton = new ButtonBuilder()
          .setCustomId(cancelId)
          .setLabel("Hủy")
          .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(
          confirmButton,
          cancelButton,
        );

        const confirmEmbed = new EmbedBuilder()
          .setColor("Yellow")
          .setTitle("❓ Xác Nhận Reset Dữ Liệu Người Dùng")
          .setDescription(
            `Bạn có chắc chắn muốn reset **TOÀN BỘ** dữ liệu của **${targetToReset.tag}** (\`${targetToReset.id}\`) không?\n\nBao gồm:\n- Tiền (ví & ngân hàng)\n- Level & XP\n- Công việc (chính & phụ)\n- Kho đồ (Inventory)\n- Garage (Xe & Phụ tùng)\n- Điểm Castrol\n- Lượt Gacha & Pity\n- Cooldowns và các dữ liệu cá nhân khác.\n\nHành động này **KHÔNG THỂ** hoàn tác!`,
          )
          .setFooter({
            text: "Hành động này sẽ xóa sạch tiến trình của người dùng.",
          });

        const messageWithButtons = await interaction.editReply({
          embeds: [confirmEmbed],
          components: [row],
          ephemeral: true,
        }); // Ephemeral cho confirm

        const filter = (i) =>
          i.user.id === interaction.user.id &&
          i.message.id === messageWithButtons.id;
        try {
          const confirmation = await messageWithButtons.awaitMessageComponent({
            filter,
            componentType: ComponentType.Button,
            time: 60000,
          });

          if (confirmation.customId === cancelId) {
            return confirmation.update({
              content: "✅ Đã hủy thao tác reset.",
              embeds: [],
              components: [],
              ephemeral: true,
            });
          }

          if (confirmation.customId === confirmId) {
            await confirmation.deferUpdate({ ephemeral: true }); // Quan trọng: deferUpdate cho button click

            // Tìm và xóa dữ liệu người dùng
            // Cách 1: Xóa document
            // const deleteResult = await User.deleteOne({ userId: targetToReset.id, guildId: guildId });
            // if (deleteResult.deletedCount > 0) {
            //     await confirmation.editReply({ content: `✅ Đã reset thành công toàn bộ dữ liệu của **${targetToReset.tag}**! (Document đã được xóa)`, components: [], embeds: [] });
            //     Logger.info(`[BotAdmin/ResetUser] Owner ${adminUser.tag} RESET (deleted) data for ${targetToReset.tag} in guild ${guildId}`);
            // } else {
            //     await confirmation.editReply({ content: `ℹ️ Không tìm thấy dữ liệu của người dùng ${targetToReset.tag} để reset.`, components: [], embeds: [] });
            // }

            // Cách 2: Cập nhật về giá trị mặc định (giữ lại document, an toàn hơn nếu có reference)
            // Lấy lại schema User để biết các giá trị default
            const defaultUserData = {
              balance: 0,
              bank: 0,
              xp: 0,
              level: 1,
              lastDaily: null,
              cooldowns: {},
              job: null,
              mainJob: null,
              gacha: {},
              garage: { cars: [], parts: [] },
              dailyPurchases: new Map(),
              totalEarned: 0,
              totalSpent: 0,
              inventory: new Map(),
              castrolBalance: 0,
              // Xóa các trường không có default hoặc muốn xóa hẳn:
              // $unset: { someOldField: "" }
            };
            // Không bao gồm userId, guildId, createdAt, updatedAt

            const updateResult = await User.findOneAndUpdate(
              { userId: targetToReset.id, guildId: guildId },
              {
                $set: defaultUserData,
                $unset: {
                  lastDaily: "",
                  "mainJob.lastQuit": "",
                  "mainJob.hiredAt": "",
                  "mainJob.lastSalary": "",
                  "job.lastSalary": "",
                  "job.hiredAt": "",
                },
              }, // Xóa các trường Date có thể gây lỗi nếu set null
              { new: true, upsert: false }, // không tạo mới nếu chưa có
            );

            if (updateResult) {
              await confirmation.editReply({
                content: `✅ Đã reset thành công toàn bộ dữ liệu của **${targetToReset.tag}** về mặc định!`,
                components: [],
                embeds: [],
              });
              Logger.info(
                `[BotAdmin/ResetUser] Owner ${adminUser.tag} RESET (updated to default) data for ${targetToReset.tag} in guild ${guildId}`,
              );
            } else {
              await confirmation.editReply({
                content: `ℹ️ Không tìm thấy dữ liệu của người dùng ${targetToReset.tag} để reset. Họ có thể chưa tương tác với bot.`,
                components: [],
                embeds: [],
              });
            }
          }
        } catch (err) {
          // Lỗi từ awaitMessageComponent (thường là hết thời gian)
          await messageWithButtons
            .edit({
              content: "⌛ Hết thời gian xác nhận, đã hủy thao tác reset.",
              embeds: [],
              components: [],
            })
            .catch(() => {});
        }
      } else if (subcommand === "status") {
        // Logic từ status.js
        const config = await GuildConfig.findOne({ guildId });
        if (!config) {
          return interaction.editReply({
            content:
              "⚠️ Server này chưa được cấu hình bất kỳ tính năng nào dùng GuildConfig.",
          });
        }

        const check = (val) => (val ? "✅ Hoạt động" : "❌ Chưa cài đặt");
        const getChannelName = (channelId) => {
          const chan = guildId
            ? client.guilds.cache.get(guildId)?.channels.cache.get(channelId)
            : null;
          return chan ? `${chan.name} (\`${channelId}\`)` : channelId || "N/A";
        };

        const stats = config.statsChannels || {};
        const roles = config.roleMessageIds || {};

        const embed = new EmbedBuilder()
          .setColor("#00cc99")
          .setTitle(
            `📊 Tình trạng cấu hình Bot cho Server: ${interaction.guild.name}`,
          )
          .setThumbnail(interaction.guild.iconURL())
          .addFields(
            {
              name: "👋 Kênh Chào Mừng",
              value: `${check(config.welcomeChannelId)} ${config.welcomeChannelId ? getChannelName(config.welcomeChannelId) : ""}`,
              inline: false,
            },
            {
              name: "👋 Kênh Tạm Biệt",
              value: `${check(config.goodbyeChannelId)} ${config.goodbyeChannelId ? getChannelName(config.goodbyeChannelId) : ""}`,
              inline: false,
            },
            {
              name: "📜 Kênh Nội Quy",
              value: `${check(config.rulesChannelId)} ${config.rulesChannelId ? getChannelName(config.rulesChannelId) : ""}`,
              inline: false,
            },
            {
              name: "🧑 Kênh Chọn Role",
              value: `${check(config.roleChannelId)} ${config.roleChannelId ? getChannelName(config.roleChannelId) : ""}`,
              inline: false,
            },
            {
              name: "📝 Kênh Log",
              value: `${check(config.logChannelId)} ${config.logChannelId ? getChannelName(config.logChannelId) : ""}`,
              inline: false,
            },
            {
              name: "🎯 Auto Role",
              value: `${check(config.autoRoleId)} ${config.autoRoleId ? interaction.guild.roles.cache.get(config.autoRoleId)?.name || `ID: ${config.autoRoleId}` : ""}`,
              inline: false,
            },
            {
              name: "🔔 Kênh Thông Báo Lương",
              value: `${check(config.salaryNotificationChannelId)} ${config.salaryNotificationChannelId ? getChannelName(config.salaryNotificationChannelId) : ""}`,
              inline: false,
            },
            {
              name: "🛒 Kênh Thông Báo Chợ",
              value: `${check(config.marketNotificationChannelId)} ${config.marketNotificationChannelId ? getChannelName(config.marketNotificationChannelId) : ""}`,
              inline: false,
            },
            {
              name: "🌟 Kênh Giờ Vàng Gacha",
              value: `${check(config.goldenHourChannelId)} ${config.goldenHourChannelId ? getChannelName(config.goldenHourChannelId) : ""}`,
              inline: false,
            },
            {
              name: "🆔 Message ID Role Giới Tính",
              value: roles.gender || "N/A",
              inline: true,
            },
            {
              name: "🆔 Message ID Role Game",
              value: roles.game || "N/A",
              inline: true,
            },
            {
              name: "📊 Kênh Stats: Tổng Member",
              value:
                check(stats.total) +
                (stats.total ? ` (${getChannelName(stats.total)})` : ""),
              inline: false,
            },
            {
              name: "📊 Kênh Stats: Online",
              value:
                check(stats.online) +
                (stats.online ? ` (${getChannelName(stats.online)})` : ""),
              inline: false,
            },
            {
              name: "📊 Kênh Stats: Bots",
              value:
                check(stats.bots) +
                (stats.bots ? ` (${getChannelName(stats.bots)})` : ""),
              inline: false,
            },
            {
              name: "⚙️ Prefix Lệnh Tin Nhắn",
              value: `\`${config.prefix || botConfig.prefix || "!"}\``,
              inline: true,
            },
          )
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        Logger.info(
          `[BotAdmin/Status] Admin ${adminUser.tag} checked bot status for guild ${guildId}`,
        );
      } else if (subcommand === "market-tax-fund") {
        // Logic từ market-tax-fund.js
        const botUserId = client.user.id; // Lấy ID của bot
        const botData = await User.findOne({
          userId: botUserId,
          guildId: guildId,
        });

        const currentTaxFund = botData ? botData.balance : 0; // Quỹ thuế nằm trong balance của bot cho guild đó

        const embed = new EmbedBuilder()
          .setColor("#EEE8AA")
          .setTitle("🏦 Quỹ Thuế Chợ Hiện Tại")
          .setDescription(
            `Tổng số tiền thuế thu được từ các giao dịch chợ và đang được giữ trong tài khoản của bot tại server này.`,
          )
          .addFields({
            name: "💰 Số dư quỹ thuế",
            value: `${currentTaxFund.toLocaleString()} VNĐ`,
          })
          .setTimestamp()
          .setFooter({ text: `Bot: ${client.user.tag}` });

        await interaction.editReply({ embeds: [embed] });
        Logger.info(
          `[BotAdmin/TaxFund] Admin ${adminUser.tag} checked market tax fund for guild ${guildId}. Fund: ${currentTaxFund}`,
        );
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /bot-admin ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({
            content: "❌ Đã xảy ra lỗi khi thực hiện lệnh quản trị bot.",
            ephemeral: true,
          })
          .catch((e) => Logger.error("Error in followUp:", e));
      } else {
        await interaction
          .reply({
            content: "❌ Đã xảy ra lỗi khi thực hiện lệnh quản trị bot.",
            ephemeral: true,
          })
          .catch((e) => Logger.error("Error in reply:", e));
      }
    }
  },
};
