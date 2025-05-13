const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const User = require("../../models/User");
const GuildConfig = require("../../models/GuildConfig"); // Thêm import GuildConfig
const Logger = require("../../utils/logger");
const { checkLevelUp } = require("../../utils/levelUtil"); // Sử dụng lại từ add-xp

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-value")
    .setDescription(
      "[Admin] Quản lý giá trị (tiền, XP, Castrol) của người dùng.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add-money")
        .setDescription("Thêm hoặc trừ tiền (VNĐ) cho người dùng.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người dùng để chỉnh sửa số dư.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Số tiền muốn thêm (số âm để trừ).")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Lý do cho việc thay đổi (không bắt buộc)."),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add-xp")
        .setDescription("Thêm XP cho người dùng.")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Người nhận XP.")
            .setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Số XP muốn thêm.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add-castrol")
        .setDescription("Thêm hoặc trừ Castrol cho người dùng.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người dùng để chỉnh sửa số dư Castrol.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Số lượng Castrol muốn thêm (số âm để trừ).")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Lý do cho việc thay đổi (không bắt buộc)."),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const reason =
      interaction.options.getString("reason") || "Không có lý do cụ thể.";
    const guildId = interaction.guild.id;
    const adminUser = interaction.user;

    if (targetUser.bot && subcommand !== "add-xp") {
      // XP có thể add cho bot nếu logic checkLevelUp không cản
      return interaction.reply({
        content:
          "❌ Không thể chỉnh sửa giá trị của bot bằng lệnh này (trừ XP nếu được phép).",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false }); // Để false cho dễ debug, có thể đổi thành true cho lệnh admin

    try {
      let userData = await User.findOne({
        userId: targetUser.id,
        guildId: guildId,
      });

      if (!userData) {
        // Nếu người dùng chưa có dữ liệu, tạo mới (chung cho cả 3 subcommand)
        userData = new User({
          userId: targetUser.id,
          guildId: guildId,
          balance: 0,
          bank: 0,
          xp: 0,
          level: 1,
          castrolBalance: 0,
        });
        Logger.info(
          `[Admin-Value] Created new user data for ${targetUser.tag} (${targetUser.id}) in guild ${guildId} via ${subcommand}.`,
        );
      }

      // Xử lý từng subcommand
      if (subcommand === "add-money") {
        const oldBalance = userData.balance;
        const newBalance = oldBalance + amount;

        userData.balance = newBalance;
        if (amount > 0) {
          userData.totalEarned = (userData.totalEarned || 0) + amount;
        } else {
          userData.totalSpent = (userData.totalSpent || 0) + Math.abs(amount);
        }
        await userData.save();

        const embed = new EmbedBuilder()
          .setColor(amount >= 0 ? "Green" : "Red")
          .setTitle(
            amount >= 0 ? "✅ Thêm Tiền Thành Công" : "✅ Trừ Tiền Thành Công",
          )
          .setDescription(
            `Đã ${amount >= 0 ? "thêm" : "trừ"} **${Math.abs(amount).toLocaleString()} VNĐ** ${amount >= 0 ? "vào" : "từ"} ví của ${targetUser.tag}.`,
          )
          .addFields(
            {
              name: "👤 Người thực hiện",
              value: `${adminUser.tag} (\`${adminUser.id}\`)`,
              inline: true,
            },
            {
              name: "👤 Người nhận/bị trừ",
              value: `${targetUser.tag} (\`${targetUser.id}\`)`,
              inline: true,
            },
            {
              name: "💰 Số tiền",
              value: `${amount.toLocaleString()} VNĐ`,
              inline: true,
            },
            {
              name: "📊 Số dư cũ",
              value: `${oldBalance.toLocaleString()} VNĐ`,
              inline: true,
            },
            {
              name: "📊 Số dư mới",
              value: `${newBalance.toLocaleString()} VNĐ`,
              inline: true,
            },
            { name: "📝 Lý do", value: reason, inline: false },
          )
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        Logger.info(
          `[Admin-Value/Add-Money] Admin ${adminUser.tag} ${amount >= 0 ? "added" : "removed"} ${Math.abs(amount)} VND ${amount >= 0 ? "to" : "from"} ${targetUser.tag}. Reason: ${reason}. New balance: ${newBalance}`,
        );
      } else if (subcommand === "add-xp") {
        userData.xp += amount;
        const result = checkLevelUp(userData); // Giả sử checkLevelUp không cần save user bên trong nó
        await userData.save();

        await interaction.editReply(
          `✅ Đã thêm ${amount} XP cho **${targetUser.tag}**.` +
            (result.leveledUp
              ? ` 🎉 **${targetUser.tag}** đã lên ${result.levelUpCount} cấp tới cấp **${result.newLevel}** và nhận ${result.reward.toLocaleString()}đ!`
              : ""),
        );
        Logger.info(
          `[Admin-Value/Add-XP] Admin ${adminUser.tag} added ${amount} XP to ${targetUser.tag}. Leveled up: ${result.leveledUp}`,
        );
      } else if (subcommand === "add-castrol") {
        if (typeof userData.castrolBalance !== "number") {
          userData.castrolBalance = 0;
        }
        const oldCastrolBalance = userData.castrolBalance;
        let newCastrolBalance = oldCastrolBalance + amount;

        if (newCastrolBalance < 0) {
          // Đảm bảo Castrol không âm
          newCastrolBalance = 0;
          Logger.warn(
            `[Admin-Value/Add-Castrol] Attempt to set negative Castrol for ${targetUser.tag}. Clamped to 0.`,
          );
        }
        userData.castrolBalance = newCastrolBalance;
        await userData.save();

        const embed = new EmbedBuilder()
          .setColor(amount >= 0 ? "LuminousVividPink" : "DarkOrange")
          .setTitle(
            amount >= 0
              ? "✅ Thêm Castrol Thành Công"
              : "✅ Trừ Castrol Thành Công",
          )
          .setDescription(
            `Đã ${amount >= 0 ? "thêm" : "trừ"} **${Math.abs(amount).toLocaleString()} Castrol** ${amount >= 0 ? "cho" : "từ"} ${targetUser.tag}.`,
          )
          .addFields(
            {
              name: "👤 Người thực hiện",
              value: `${adminUser.tag} (\`${adminUser.id}\`)`,
              inline: true,
            },
            {
              name: "👤 Người nhận/bị trừ",
              value: `${targetUser.tag} (\`${targetUser.id}\`)`,
              inline: true,
            },
            {
              name: "💎 Số lượng",
              value: `${amount.toLocaleString()} Castrol`,
              inline: true,
            },
            {
              name: "📊 Số dư Castrol cũ",
              value: `${oldCastrolBalance.toLocaleString()}`,
              inline: true,
            },
            {
              name: "📊 Số dư Castrol mới",
              value: `${newCastrolBalance.toLocaleString()}`,
              inline: true,
            },
            { name: "📝 Lý do", value: reason, inline: false },
          )
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        Logger.info(
          `[Admin-Value/Add-Castrol] Admin ${adminUser.tag} ${amount >= 0 ? "added" : "removed"} ${Math.abs(amount)} Castrol ${amount >= 0 ? "to" : "from"} ${targetUser.tag}. Reason: ${reason}. New Castrol balance: ${newCastrolBalance}`,
        );
      }
    } catch (error) {
      Logger.error(
        `Lỗi lệnh /admin-value ${subcommand} (Target: ${targetUser.id}, Amount: ${amount}, Admin: ${adminUser.id}): ${error.message}`,
        { stack: error.stack },
      );
      await interaction.editReply({
        content: "❌ Đã xảy ra lỗi khi cố gắng cập nhật giá trị người dùng.",
      });
    }
  },
};
