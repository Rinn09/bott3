// src/commands/monetary_system/balance.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js"); // Thêm EmbedBuilder nếu chưa có
const User = require("../../models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("so_du")
    .setDescription("Xem số dư tài khoản.")
    .addUserOption(
      (
        option, // Thêm option để xem số dư người khác
      ) =>
        option
          .setName("user")
          .setDescription("Người dùng bạn muốn xem số dư (mặc định là bạn).")
          .setRequired(false),
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user; // Lấy người dùng mục tiêu
    const guildId = interaction.guild.id;

    // Không cho xem số dư của bot khác (trừ bot của mình nếu muốn)
    if (targetUser.bot && targetUser.id !== interaction.client.user.id) {
      return interaction.reply({
        content: "❌ Không thể xem số dư của bot khác.",
        ephemeral: true,
      });
    }

    let userData = await User.findOne({ userId: targetUser.id, guildId });
    if (!userData) {
      // Nếu xem của người khác mà họ chưa có data, thông báo thay vì tạo mới
      if (targetUser.id !== interaction.user.id) {
        return interaction.reply({
          content: `ℹ️ Người dùng ${targetUser.tag} chưa có dữ liệu tài khoản trong server này.`,
          ephemeral: true,
        });
      }
      // Nếu xem của chính mình mà chưa có, tạo mới
      userData = await User.create({ userId: targetUser.id, guildId });
    }

    const fields = [
      {
        name: "💰 Ví tiền",
        value: `${(userData.balance || 0).toLocaleString()} VNĐ`,
        inline: true,
      },
      {
        name: "🏦 Ngân hàng",
        value: `${(userData.bank || 0).toLocaleString()} VNĐ`,
        inline: true,
      },
      {
        name: "🛢️ Castrol",
        value: `${(userData.castrolBalance || 0).toLocaleString()}`,
        inline: true,
      }, // << THÊM DÒNG NÀY
      {
        name: "📊 Tổng Tài Sản (Tiền)",
        value: `${((userData.balance || 0) + (userData.bank || 0)).toLocaleString()} VNĐ`,
        inline: false,
      },
    ];

    const embed = new EmbedBuilder()
      .setColor(0x00ae86)
      .setTitle(`💳 Thông Tin Tài Khoản của ${targetUser.username}`)
      .addFields(fields)
      .setFooter({ text: `ID: ${targetUser.id}` })
      .setTimestamp();

    if (targetUser.avatarURL()) {
      embed.setThumbnail(targetUser.avatarURL());
    }

    return interaction.reply({
      embeds: [embed],
      ephemeral: targetUser.id !== interaction.user.id,
    });
  },
};
