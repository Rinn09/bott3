const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xem_nghe')
    .setDescription('Hiển thị nghề chính hiện tại của bạn.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    let user = await User.findOne({ userId, guildId });
    if (!user || !user.mainJob || !user.mainJob.name) {
      return interaction.reply({ content: '❌ Bạn chưa chọn nghề chính nào.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Nghề Chính Hiện Tại')
      .setColor(0x00AE86)
      .addFields(
        { name: 'Nghề', value: user.mainJob.name, inline: true },
        { name: 'Cấp nghề', value: `${user.mainJob.level}`, inline: true },
        { name: 'XP', value: `${user.mainJob.xp}`, inline: true },
        { name: 'Ngày nhận việc', value: `<t:${Math.floor(new Date(user.mainJob.hiredAt).getTime()/1000)}:F>`, inline: false }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};