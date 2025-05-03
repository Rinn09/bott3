const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nghi_viec')
    .setDescription('Nghỉ việc hiện tại'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let user = await User.findOne({ userId, guildId });

    if (!user || !user.job || !user.job.name) {
      return interaction.reply({ content: '❌ Bạn hiện không có công việc nào để nghỉ.' });
    }

    const oldJob = user.job.name;
    user.job = null;

    await user.save();
    return interaction.reply({ content: `✅ Bạn đã nghỉ làm **${oldJob}**.` });
  }
};
