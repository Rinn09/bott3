const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const { getLevelXp } = require('../../utils/levelUtil');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Xem cấp độ và kinh nghiệm của bạn'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let user = await User.findOne({ userId, guildId });
    if (!user) user = await User.create({ userId, guildId });

    const xpNeeded = getLevelXp(user.level);

    return interaction.reply({
      embeds: [{
        title: '📊 Thông tin cấp độ',
        color: 0x3498DB,
        fields: [
          { name: 'Cấp độ', value: `${user.level}`, inline: true },
          { name: 'XP hiện tại', value: `${user.xp} / ${xpNeeded}`, inline: true }
        ],
        footer: { text: interaction.user.tag },
        timestamp: new Date()
      }]
    });
  }
};
