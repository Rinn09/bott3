const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const Job = require('../../models/Job');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nhan_luong')
    .setDescription('Nhận lương từ công việc hiện tại'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const user = await User.findOne({ userId, guildId });
    if (!user || !user.job || !user.job.name) {
      return interaction.reply({ content: '❌ Bạn hiện không có công việc nào để nhận lương.' });
    }

    const job = await Job.findOne({ name: user.job.name });
    if (!job) {
      return interaction.reply({ content: '⚠️ Công việc của bạn không còn tồn tại. Hãy dùng `/nghi_viec` để nghỉ việc.' });
    }

    const now = Date.now();
    const last = user.job.lastSalary?.getTime() || 0;
    const timePassed = now - last;

    // Auto fire nếu AFK hơn 48h không nhận lương
    const maxDelay = 48 * 60 * 60 * 1000; // 48 giờ
    if (timePassed >= maxDelay) {
      user.job = null;
      await user.save();
      return interaction.reply({ content: '⏰ Bạn đã bị sa thải do không nhận lương trong 48 giờ.' });
    }

    // Chưa đủ cooldown
    if (timePassed < job.cooldown) {
      const nextIn = job.cooldown - timePassed;
      const hours = Math.floor(nextIn / (1000 * 60 * 60));
      const mins = Math.floor((nextIn % (1000 * 60 * 60)) / (1000 * 60));
      return interaction.reply({ content: `⏳ Bạn cần chờ thêm **${hours}h ${mins}p** để nhận lương tiếp theo.` });
    }

    // Đủ điều kiện → trả lương
    user.balance += job.salary;
    user.totalEarned += job.salary;
    user.job.lastSalary = new Date();

    await user.save();

    return interaction.reply({
      content: `💸 Bạn đã nhận **${job.salary.toLocaleString()} VNĐ** từ công việc **${job.name}**. Hẹn gặp lại sau!`
    });
  }
};
