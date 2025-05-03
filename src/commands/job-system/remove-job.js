const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Job = require('../../models/Job');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-job')
    .setDescription('Xóa một công việc khỏi hệ thống.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Tên công việc muốn xóa')
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    const existingJob = await Job.findOne({ name });
    if (!existingJob) {
      return interaction.reply({ content: '❌ Công việc không tồn tại để xóa!', ephemeral: true });
    }
      
    await existingJob.deleteOne();
    return interaction.reply({ content: `✅ Công việc **${name}** đã được xóa thành công!`, ephemeral: false });
  }
};