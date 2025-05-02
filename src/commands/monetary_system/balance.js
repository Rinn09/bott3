
const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Xem số tiền bạn đang có'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let userData = await User.findOne({ userId, guildId });
    if (!userData) {
      userData = await User.create({ userId, guildId });
    }

    return interaction.reply({
      embeds: [{
        title: '💰 Thông tin tài khoản',
        color: 0x00AE86,
        fields: [
          { name: 'Ví tiền', value: `${userData.balance.toLocaleString()} VNĐ`, inline: true },
          { name: 'Ngân hàng', value: `${userData.bank.toLocaleString()} VNĐ`, inline: true },
          { name: 'Tổng cộng', value: `${(userData.balance + userData.bank).toLocaleString()} VNĐ`, inline: false }
        ],
        footer: { text: `Người dùng: ${interaction.user.tag}` },
        timestamp: new Date()
      }]
    });
  }
};
