const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const Job = require('../../models/Job');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nhan_viec')
    .setDescription('Nhận việc mới')
    .addStringOption(option =>
      option.setName('cong_viec')
        .setDescription('Tên công việc muốn nhận')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const jobName = interaction.options.getString('cong_viec');

    const job = await Job.findOne({ name: jobName });
    if (!job) {
      return interaction.reply({ content: '❌ Công việc không tồn tại.' });
    }

    let user = await User.findOne({ userId, guildId });
    if (!user) {
      user = await User.create({ userId, guildId, balance: 0, bank: 0, xp: 0, level: 0, cooldowns: {}, job: null, totalEarned: 0, totalSpent: 0 });
    }

    if (user.job?.name) {
      return interaction.reply({ content: `❌ Bạn đang làm công việc **${user.job.name}**. Hãy nghỉ việc trước khi xin việc mới bằng lệnh \`/resign\`.` });
    }

    if (user.xp < job.xpRequired) {
      return interaction.reply({ content: `❌ Bạn cần ít nhất ${job.xpRequired} XP để làm công việc này.` });
    }

    const now = new Date();
    user.job = {
      name: job.name,
      tier: job.tier,
      lastSalary: now,
      hiredAt: now
    };

    await user.save();
    return interaction.reply({ content: `✅ Bạn đã được nhận vào công việc **${job.name}** (Tier ${job.tier}) với mức lương ${job.salary.toLocaleString()} VNĐ!` });
  }
};
