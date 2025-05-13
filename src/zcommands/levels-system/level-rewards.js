const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-rewards')
    .setDescription('Xem phần thưởng và lợi ích theo cấp độ'),

  async execute(interaction) {
    return interaction.reply({
      embeds: [{
        title: '🎁 Phần thưởng theo cấp độ',
        color: 0x9B59B6,
        description: [
          '🆙 Cấp độ càng cao, phần thưởng càng lớn!',
          '• Mỗi khi lên cấp: +1000 VNĐ * cấp',
          '• Mở khóa việc làm (job) theo XP',
          '• Tương lai: lãi suất ngân hàng, role thưởng...'
        ].join('\n'),
        timestamp: new Date()
      }]
    });
  }
};
