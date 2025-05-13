const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Xem bảng xếp hạng cấp độ của server'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const top = await User.find({ guildId }).sort({ level: -1, xp: -1 }).limit(10);

    if (!top.length) {
      return interaction.reply('❌ Không có dữ liệu xếp hạng.');
    }

    const embed = {
      title: '📈 Bảng xếp hạng cấp độ',
      color: 0x00BFFF,
      description: top.map((u, i) =>
        `\`#${i + 1}\` <@${u.userId}> - Cấp ${u.level} (${u.xp} XP)`
      ).join('\n'),
      timestamp: new Date()
    };

    return interaction.reply({ embeds: [embed] });
  }
};
