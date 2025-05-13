const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  inlineCode,
} = require("discord.js");
const User = require("../../models/User"); // Đảm bảo đường dẫn đúng
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-castrol")
    .setDescription("[Admin] Thêm hoặc trừ Castrol cho người dùng.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
        .setDescription("Lý do cho việc thay đổi (không bắt buộc).")
        .setRequired(false),
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const reason =
      interaction.options.getString("reason") || "Không có lý do cụ thể.";
    const guildId = interaction.guild.id;
    const adminUser = interaction.user;

    if (targetUser.bot) {
      return interaction.reply({
        content: "❌ Không thể chỉnh sửa Castrol của bot.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true }); // Lệnh admin nên ephemeral

    try {
      let userData = await User.findOne({
        userId: targetUser.id,
        guildId: guildId,
      });

      if (!userData) {
        // Nếu admin cố add cho user chưa có data, có thể tạo mới hoặc báo lỗi
        // Hiện tại, nếu user không tồn tại, sẽ không tạo mới mà báo lỗi ở dưới
        // userData = new User({ userId: targetUser.id, guildId: guildId, castrolBalance: 0 });
        // Logger.info(`[Add-Castrol] Created new user data for ${targetUser.tag} (${targetUser.id}) in guild ${guildId}.`);
        return interaction.editReply({
          content: `❌ Không tìm thấy dữ liệu của người dùng ${targetUser.tag}. Họ cần tương tác với bot trước.`,
        });
      }

      // Đảm bảo trường castrolBalance tồn tại và là số
      if (typeof userData.castrolBalance !== "number") {
        userData.castrolBalance = 0;
      }

      const oldCastrolBalance = userData.castrolBalance;
      let newCastrolBalance = oldCastrolBalance + amount;

      // Đảm bảo Castrol không âm (nếu bạn muốn)
      if (newCastrolBalance < 0) {
        // Hoặc throw error: throw new Error('Số dư Castrol không thể âm.');
        newCastrolBalance = 0; // Hoặc set về 0
        Logger.warn(
          `[Add-Castrol] Attempt to set negative Castrol for ${targetUser.tag}. Clamped to 0.`,
        );
      }

      userData.castrolBalance = newCastrolBalance;
      // Không cần markModified nếu gán trực tiếp cả object hoặc Mongoose đủ thông minh

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
        `[Add-Castrol] Admin ${adminUser.tag} ${amount >= 0 ? "added" : "removed"} ${Math.abs(amount)} Castrol ${amount >= 0 ? "to" : "from"} ${targetUser.tag} in guild ${guildId}. Reason: ${reason}. New Castrol balance: ${newCastrolBalance}`,
      );
    } catch (error) {
      Logger.error(
        `Lỗi lệnh /add-castrol (Target: ${targetUser.id}, Amount: ${amount}, Admin: ${adminUser.id}): ${error.message}`,
        { stack: error.stack },
      );
      await interaction.editReply({
        content: "❌ Đã xảy ra lỗi khi cố gắng cập nhật số dư Castrol.",
      });
    }
  },
};
