const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const { getLevelXp } = require("../../utils/levelUtil"); // Đảm bảo đường dẫn này đúng
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Xem thông tin cấp độ, phần thưởng và bảng xếp hạng.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("Xem cấp độ và kinh nghiệm của bạn hoặc người khác.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người dùng bạn muốn xem cấp độ.")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rewards")
        .setDescription("Xem thông tin về phần thưởng khi lên cấp."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rank")
        .setDescription("Xem bảng xếp hạng cấp độ của server."),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    try {
      if (subcommand === "view") {
        const targetUser =
          interaction.options.getUser("user") || interaction.user;
        let user = await User.findOne({ userId: targetUser.id, guildId });

        if (!user) {
          if (targetUser.id === interaction.user.id) {
            // Nếu là chính mình và chưa có data
            user = await User.create({ userId: targetUser.id, guildId });
          } else {
            // Nếu là người khác và chưa có data
            return interaction.editReply(
              `ℹ️ Người dùng ${targetUser.tag} chưa có dữ liệu cấp độ trong server này.`,
            );
          }
        }

        const xpNeeded = getLevelXp(user.level); // Giả sử getLevelXp được định nghĩa đúng
        const embed = new EmbedBuilder()
          .setTitle(`📊 Thông tin cấp độ của ${targetUser.username}`)
          .setColor(0x3498db)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { name: "Cấp độ", value: `${user.level}`, inline: true },
            {
              name: "XP Hiện tại",
              value: `${user.xp.toLocaleString()} / ${xpNeeded.toLocaleString()}`,
              inline: true,
            },
            {
              name: "Tổng XP cần để lên cấp",
              value: `${xpNeeded.toLocaleString()}`,
              inline: true,
            },
          )
          .setFooter({ text: `ID: ${targetUser.id}` })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "rewards") {
        const embed = new EmbedBuilder()
          .setTitle("🎁 Phần Thưởng và Lợi Ích Theo Cấp Độ")
          .setColor(0x9b59b6)
          .setDescription(
            "🆙 Cấp độ càng cao, bạn càng nhận được nhiều lợi ích và phần thưởng hấp dẫn!\n\n" +
              "• **Tiền thưởng lên cấp:** Mỗi khi lên cấp, bạn sẽ nhận được một khoản tiền thưởng. Số tiền này tăng dần theo cấp độ của bạn (`1000 VNĐ * cấp độ mới`).\n" +
              "• **Mở khóa Việc Làm Phụ (Side Jobs):** Đạt được một lượng XP nhất định sẽ cho phép bạn ứng tuyển vào các việc làm phụ có yêu cầu XP cao hơn, mang lại thu nhập tốt hơn.\n" +
              "• **Mở khóa Nghề Chính (Main Jobs):** Một số nghề chính có thể yêu cầu bạn đạt một cấp độ hoặc lượng XP nhất định trước khi có thể tham gia.\n" +
              "• **Lợi ích Gacha (Có thể):** Trong tương lai, cấp độ cao có thể mang lại một số ưu đãi nhỏ trong hệ thống Gacha (ví dụ: tăng nhẹ tỷ lệ may mắn, giảm giá roll).\n" +
              "• **Role Đặc Biệt (Có thể):** Đạt các mốc cấp độ quan trọng có thể được nhận các role danh hiệu đặc biệt trên server.\n" +
              "• **Lãi suất Ngân Hàng (Có thể):** Cấp độ cao hơn có thể được hưởng lãi suất gửi tiết kiệm ngân hàng tốt hơn.\n\n" +
              "Hãy tích cực tương tác để tăng cấp và khám phá thêm nhiều phần thưởng nhé!",
          )
          .setTimestamp()
          .setFooter({ text: "Chi tiết phần thưởng có thể thay đổi." });
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "rank") {
        const topUsers = await User.find({ guildId })
          .sort({ level: -1, xp: -1 }) // Sắp xếp theo level giảm dần, sau đó là XP giảm dần
          .limit(10);

        if (!topUsers.length) {
          return interaction.editReply(
            "❌ Hiện tại chưa có dữ liệu xếp hạng cấp độ nào trong server.",
          );
        }

        const embed = new EmbedBuilder()
          .setTitle("🏆 Bảng Xếp Hạng Cấp Độ Server")
          .setColor(0x00bfff) // Màu xanh dương sáng
          .setTimestamp();

        let rankDescription = "";
        for (let i = 0; i < topUsers.length; i++) {
          const userEntry = topUsers[i];
          const member = await interaction.guild.members
            .fetch(userEntry.userId)
            .catch(() => null);
          const userName = member
            ? member.user.tag
            : `Người dùng (ID: ${userEntry.userId})`;
          const xpForNextLevel = getLevelXp(userEntry.level);
          rankDescription += `\`#${i + 1}\` **${userName}** - Cấp ${userEntry.level} (${userEntry.xp.toLocaleString()}/${xpForNextLevel.toLocaleString()} XP)\n`;
        }
        embed.setDescription(rankDescription);

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /level ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      const errorMessage = "❌ Đã xảy ra lỗi khi xử lý lệnh cấp độ.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for level:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for level:", e));
      }
    }
  },
};
