const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Logger = require("../../utils/logger"); // Giả sử bạn có logger

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moderation")
    .setDescription("[Admin] Các lệnh quản lý và kiểm duyệt thành viên/kênh.")
    // Quyền mặc định cho lệnh cha, các subcommand sẽ có thể yêu cầu quyền cụ thể hơn nếu cần
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ban")
        .setDescription("Cấm một thành viên khỏi server.")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("Thành viên cần cấm.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Lý do cấm (không bắt buộc)."),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unban")
        .setDescription("Gỡ cấm một người dùng khỏi server.")
        .addStringOption((option) =>
          option
            .setName("user_id")
            .setDescription("ID của người dùng cần gỡ cấm.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Lý do gỡ cấm (không bắt buộc)."),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Đuổi một thành viên khỏi server.")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("Thành viên cần đuổi.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Lý do đuổi (không bắt buộc)."),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mute")
        .setDescription("Tắt tiếng thành viên (text hoặc voice).")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("Thành viên cần tắt tiếng.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Kiểu tắt tiếng.")
            .setRequired(true)
            .addChoices(
              { name: "Text", value: "text" },
              { name: "Voice", value: "voice" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Lý do tắt tiếng (không bắt buộc)."),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unmute")
        .setDescription("Bỏ tắt tiếng thành viên (text hoặc voice).")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("Thành viên cần bỏ tắt tiếng.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Kiểu bỏ tắt tiếng.")
            .setRequired(true)
            .addChoices(
              { name: "Text", value: "text" },
              { name: "Voice", value: "voice" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Lý do bỏ tắt tiếng (không bắt buộc)."),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Xóa một số lượng tin nhắn trong kênh hiện tại.")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Số lượng tin nhắn cần xóa (1-100).")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100),
        ),
    ) // Quyền riêng cho clear
    .addSubcommand((subcommand) =>
      subcommand
        .setName("listbans")
        .setDescription("Hiển thị danh sách người dùng đã bị cấm khỏi server."),
    ), // Quyền riêng cho listbans

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const adminUser = interaction.user;

    // await interaction.deferReply({ ephemeral: true }); // Đa số lệnh mod nên ephemeral

    try {
      if (subcommand === "ban") {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = interaction.options.getMember("target");
        const reason =
          interaction.options.getString("reason") || "Không có lý do cụ thể.";

        if (!targetMember) {
          return interaction.editReply({
            content: "❌ Không tìm thấy thành viên này.",
          });
        }
        if (!targetMember.bannable) {
          return interaction.editReply({
            content:
              "❌ Tôi không thể cấm thành viên này. Có thể họ có quyền cao hơn tôi hoặc là chủ server.",
          });
        }

        await targetMember.ban({ reason: `Bởi ${adminUser.tag}: ${reason}` });
        await interaction.editReply({
          content: `🔨 Đã cấm thành công ${targetMember.user.tag}. Lý do: ${reason}`,
        });
        Logger.info(
          `[Moderation/Ban] Admin ${adminUser.tag} banned ${targetMember.user.tag}. Reason: ${reason}`,
        );
      } else if (subcommand === "unban") {
        await interaction.deferReply({ ephemeral: false }); // unban có thể public
        const userIdToUnban = interaction.options.getString("user_id");
        const reason =
          interaction.options.getString("reason") || "Không có lý do cụ thể.";

        try {
          await interaction.guild.members.unban(
            userIdToUnban,
            `Bởi ${adminUser.tag}: ${reason}`,
          );
          await interaction.editReply({
            content: `✅ Đã gỡ cấm thành công người dùng có ID: \`${userIdToUnban}\`.`,
          });
          Logger.info(
            `[Moderation/Unban] Admin ${adminUser.tag} unbanned user ID ${userIdToUnban}. Reason: ${reason}`,
          );
        } catch (err) {
          Logger.error(
            `[Moderation/Unban] Error unbanning ${userIdToUnban}: ${err.message}`,
          );
          await interaction.editReply({
            content:
              "❌ Không thể gỡ cấm. Vui lòng kiểm tra lại ID hoặc người dùng này có thể chưa bị cấm.",
          });
        }
      } else if (subcommand === "kick") {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = interaction.options.getMember("target");
        const reason =
          interaction.options.getString("reason") || "Không có lý do cụ thể.";

        if (!targetMember) {
          return interaction.editReply({
            content: "❌ Không tìm thấy thành viên này.",
          });
        }
        if (!targetMember.kickable) {
          return interaction.editReply({
            content:
              "❌ Tôi không thể đuổi thành viên này. Có thể họ có quyền cao hơn tôi hoặc là chủ server.",
          });
        }

        await targetMember.kick(`Bởi ${adminUser.tag}: ${reason}`);
        await interaction.editReply({
          content: `👢 Đã đuổi thành công ${targetMember.user.tag}. Lý do: ${reason}`,
        });
        Logger.info(
          `[Moderation/Kick] Admin ${adminUser.tag} kicked ${targetMember.user.tag}. Reason: ${reason}`,
        );
      } else if (subcommand === "mute") {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = interaction.options.getMember("target");
        const type = interaction.options.getString("type");
        const reason =
          interaction.options.getString("reason") || "Không có lý do cụ thể.";

        if (!targetMember) {
          return interaction.editReply({
            content: "❌ Không tìm thấy thành viên này.",
          });
        }
        if (targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.editReply({
            content: "❌ Không thể mute Quản trị viên.",
            ephemeral: true,
          });
        }

        if (type === "text") {
          // Logic mute text (sử dụng timeout của Discord)
          try {
            await targetMember.timeout(
              28 * 24 * 60 * 60 * 1000,
              `Bởi ${adminUser.tag}: ${reason}`,
            ); // Timeout 28 ngày (max)
            await interaction.editReply({
              content: `🔇 Đã mute **text** (timeout) ${targetMember.user.tag}. Lý do: ${reason}`,
            });
            Logger.info(
              `[Moderation/Mute] Admin ${adminUser.tag} text-muted (timeout) ${targetMember.user.tag}. Reason: ${reason}`,
            );
          } catch (err) {
            Logger.error(
              `[Moderation/Mute] Error text-muting ${targetMember.user.tag}: ${err.message}`,
            );
            await interaction.editReply({
              content: "❌ Có lỗi xảy ra khi cố gắng mute text thành viên này.",
            });
          }
        } else if (type === "voice") {
          if (!targetMember.voice.channel) {
            return interaction.editReply({
              content: "❌ Thành viên này không ở trong kênh thoại nào.",
            });
          }
          try {
            await targetMember.voice.setMute(
              true,
              `Bởi ${adminUser.tag}: ${reason}`,
            );
            await interaction.editReply({
              content: `🔇 Đã mute **voice** ${targetMember.user.tag}. Lý do: ${reason}`,
            });
            Logger.info(
              `[Moderation/Mute] Admin ${adminUser.tag} voice-muted ${targetMember.user.tag}. Reason: ${reason}`,
            );
          } catch (err) {
            Logger.error(
              `[Moderation/Mute] Error voice-muting ${targetMember.user.tag}: ${err.message}`,
            );
            await interaction.editReply({
              content:
                "❌ Có lỗi xảy ra khi cố gắng mute voice thành viên này.",
            });
          }
        }
      } else if (subcommand === "unmute") {
        await interaction.deferReply({ ephemeral: true });
        const targetMember = interaction.options.getMember("target");
        const type = interaction.options.getString("type");
        const reason =
          interaction.options.getString("reason") || "Không có lý do cụ thể.";

        if (!targetMember) {
          return interaction.editReply({
            content: "❌ Không tìm thấy thành viên này.",
          });
        }

        if (type === "text") {
          try {
            await targetMember.timeout(null, `Bởi ${adminUser.tag}: ${reason}`); // Gỡ timeout
            await interaction.editReply({
              content: `🔈 Đã unmute **text** (gỡ timeout) ${targetMember.user.tag}. Lý do: ${reason}`,
            });
            Logger.info(
              `[Moderation/Unmute] Admin ${adminUser.tag} unmuted (timeout) ${targetMember.user.tag}. Reason: ${reason}`,
            );
          } catch (err) {
            Logger.error(
              `[Moderation/Unmute] Error unmuting (timeout) ${targetMember.user.tag}: ${err.message}`,
            );
            await interaction.editReply({
              content:
                "❌ Có lỗi xảy ra khi cố gắng unmute text thành viên này.",
            });
          }
        } else if (type === "voice") {
          if (!targetMember.voice.channel) {
            // Vẫn cho unmute voice ngay cả khi họ không ở trong kênh, để gỡ trạng thái mute server
            try {
              await targetMember.voice.setMute(
                false,
                `Bởi ${adminUser.tag}: ${reason}`,
              );
              await interaction.editReply({
                content: `🔈 Đã bỏ server mute **voice** cho ${targetMember.user.tag}. Lý do: ${reason}`,
              });
              Logger.info(
                `[Moderation/Unmute] Admin ${adminUser.tag} server voice-unmuted ${targetMember.user.tag}. Reason: ${reason}`,
              );
            } catch (err) {
              Logger.error(
                `[Moderation/Unmute] Error server voice-unmuting ${targetMember.user.tag}: ${err.message}`,
              );
              await interaction.editReply({
                content:
                  "❌ Có lỗi xảy ra khi cố gắng bỏ server mute voice cho thành viên này.",
              });
            }
            return;
          }
          try {
            await targetMember.voice.setMute(
              false,
              `Bởi ${adminUser.tag}: ${reason}`,
            );
            await interaction.editReply({
              content: `🔈 Đã unmute **voice** ${targetMember.user.tag}. Lý do: ${reason}`,
            });
            Logger.info(
              `[Moderation/Unmute] Admin ${adminUser.tag} voice-unmuted ${targetMember.user.tag}. Reason: ${reason}`,
            );
          } catch (err) {
            Logger.error(
              `[Moderation/Unmute] Error voice-unmuting ${targetMember.user.tag}: ${err.message}`,
            );
            await interaction.editReply({
              content:
                "❌ Có lỗi xảy ra khi cố gắng unmute voice thành viên này.",
            });
          }
        }
      } else if (subcommand === "clear") {
        // deferReply cho clear nên là ephemeral=true vì chỉ admin cần thấy kết quả, hoặc false nếu muốn thông báo công khai
        await interaction.deferReply({ ephemeral: true });
        const amount = interaction.options.getInteger("amount");
        if (
          !interaction.channel.isTextBased() ||
          interaction.channel.isDMBased()
        ) {
          return interaction.editReply({
            content: "❌ Lệnh này chỉ có thể dùng trong kênh text của server.",
          });
        }

        try {
          const messages = await interaction.channel.bulkDelete(amount, true); // true để lọc tin nhắn cũ hơn 14 ngày
          await interaction.editReply({
            content: `✅ Đã xóa thành công ${messages.size} tin nhắn.`,
          });
          Logger.info(
            `[Moderation/Clear] Admin ${adminUser.tag} cleared ${messages.size} messages in channel ${interaction.channel.name} (${interaction.channel.id}).`,
          );
        } catch (err) {
          Logger.error(
            `[Moderation/Clear] Error clearing messages: ${err.message}`,
          );
          await interaction.editReply({
            content:
              "❌ Có lỗi xảy ra khi xóa tin nhắn. Có thể do tin nhắn quá cũ hoặc tôi không có quyền.",
          });
        }
      } else if (subcommand === "listbans") {
        await interaction.deferReply({ ephemeral: false }); // Danh sách ban có thể public
        const bans = await interaction.guild.bans.fetch();

        if (!bans.size) {
          return interaction.editReply({
            content: "✅ Server này không có ai đang bị cấm.",
          });
        }

        const embed = new EmbedBuilder()
          .setColor("#ff4444")
          .setTitle(`🚫 Danh sách ${bans.size} người dùng bị cấm`)
          .setDescription(
            bans
              .map(
                (b) =>
                  `- **${b.user.tag}** (\`${b.user.id}\`)${b.reason ? ` • Lý do: ${b.reason.substring(0, 100)}${b.reason.length > 100 ? "..." : ""}` : ""}`,
              )
              .join("\n")
              .slice(0, 4000),
            // Giới hạn độ dài lý do để embed không quá dài
          )
          .setFooter({ text: `Server: ${interaction.guild.name}` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        Logger.info(
          `[Moderation/ListBans] Admin ${adminUser.tag} listed bans.`,
        );
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /moderation ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      // Kiểm tra xem đã defer/reply chưa trước khi cố gắng edit/reply lại
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({
            content: "❌ Đã xảy ra lỗi khi thực hiện lệnh kiểm duyệt.",
            ephemeral: true,
          })
          .catch((e) => Logger.error("Error in followUp:", e));
      } else {
        await interaction
          .reply({
            content: "❌ Đã xảy ra lỗi khi thực hiện lệnh kiểm duyệt.",
            ephemeral: true,
          })
          .catch((e) => Logger.error("Error in reply:", e));
      }
    }
  },
};
