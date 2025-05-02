const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top-money')
    .setDescription('Hiển thị bảng xếp hạng người giàu nhất trong server'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const users = await User.find({ guildId }).sort({ 
      $expr: { $add: ['$balance', '$bank'] } 
    }).limit(10);

    if (!users.length) {
      return interaction.reply('❌ Không có dữ liệu nào để hiển thị.');
    }

    const embed = {
      title: '💸 Top 10 người giàu nhất',
      color: 0xFFD700,
      description: users.map((user, i) => {
        const total = user.balance + user.bank;
        return `\`#${i + 1}\` <@${user.userId}> – **${total.toLocaleString()} VNĐ**`;
      }).join('\n'),
      footer: { text: 'Tổng cộng = Ví tiền + Ngân hàng' },
      timestamp: new Date()
    };

    return interaction.reply({ embeds: [embed] });
  }
};
