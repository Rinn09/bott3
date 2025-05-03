// 📁 commands/admin/add-job.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Job = require('../../models/Job'); // đảm bảo bạn có Job model
const { execute } = require('./apply');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-job')
    .setDescription('Tạo một công việc mới.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('name').setDescription('Tên công việc').setRequired(true))
    .addIntegerOption(option =>
      option.setName('tier').setDescription('Tier của công việc (1-5)').setRequired(true))
    .addIntegerOption(option =>
      option.setName('salary').setDescription('Mức lương (VNĐ)').setRequired(true))
    .addIntegerOption(option =>
      option.setName('cooldown').setDescription('Cooldown (giờ)').setRequired(true))
    .addIntegerOption(option =>
      option.setName('minxp').setDescription('XP tối thiểu để nhận công việc').setRequired(false)),

  async execute (interaction) {
    const name = interaction.options.getString('name');
    const tier = interaction.options.getInteger('tier');
    const salary = interaction.options.getInteger('salary');
    const cooldownHours = interaction.options.getInteger('cooldown');
    const minXP = interaction.options.getInteger('minxp') || 0;

    // Kiểm tra trùng tên
    const existingJob = await Job.findOne({ name: name.toLowerCase() });
    if (existingJob) {
      return interaction.reply({
        content: '❌ Một công việc với tên này đã tồn tại!',
        ephemeral: true
      });
    }

    const cooldownMs = cooldownHours * 60 * 60 * 1000;

    const job = new Job({
      name: name.toLowerCase(),
      tier,
      salary,
      cooldown: cooldownMs,
      minXP
    });

    await job.save();

    interaction.reply({
      content: `✅ Đã tạo công việc **${name}** thành công!\n• Tier: ${tier}\n• Lương: ${salary.toLocaleString()} VNĐ\n• Cooldown: ${cooldownHours}h\n• XP tối thiểu: ${minXP}`,
      ephemeral: false
    });
  }
};
