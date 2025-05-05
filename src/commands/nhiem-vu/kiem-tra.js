const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const MainJob = require('../../models/MainJob');
// Import đủ các hàm cần thiết
const { handleJobLevelUp, getRequiredXPForLevel, calculateSalaryForJobLevel } = require('../../utils/jobUtil');
const Logger = require('../../utils/logger');

const TASK_ID = 'kiemTra'; // Phải khớp taskId trong seed
const JOB_NAME = 'công nhân'; // Phải khớp tên nghề trong seed (chữ thường)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiem-tra') // Tên lệnh
    .setDescription('Thực hiện công việc kiểm tra chất lượng để nhận lương và XP.'), // Mô tả lệnh

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    await interaction.deferReply({ ephemeral: false });

    try {
      const user = await User.findOne({ userId, guildId });
      const jobData = await MainJob.findOne({ name: JOB_NAME });

      // --- Kiểm tra user và nghề ---
      if (!user) return interaction.editReply('Không tìm thấy dữ liệu của bạn.');
      if (!jobData) return interaction.editReply(`❌ Hệ thống chưa định nghĩa nghề ${JOB_NAME}.`);
      if (!user.mainJob || !user.mainJob.name || user.mainJob.name.trim().toLowerCase() !== JOB_NAME) {
        return interaction.editReply({ content: `❌ Lệnh này chỉ dành cho **${jobData.name}**.` });
      }

      // --- Tìm thông tin task ---
      const task = jobData.tasks?.find(t => t.taskId === TASK_ID);
      if (!task) return interaction.editReply(`❌ Không tìm thấy nhiệm vụ ${TASK_ID} cho nghề ${jobData.name}.`);

      // --- Lấy thông số task và tính lương ---
      const cooldownTime = task.cooldown || 10800000; // Lấy cooldown từ task
      const xpGain = task.xp || 60; // Lấy XP từ task
      const salaryEarned = await calculateSalaryForJobLevel(JOB_NAME, user.mainJob.level); // Tính lương theo cấp

      // --- Kiểm tra cooldown ---
      const now = Date.now();
      const lastUsed = user.mainJob.taskCooldowns?.get(TASK_ID) || 0;
      if (now - lastUsed < cooldownTime) {
        const remaining = cooldownTime - (now - lastUsed);
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        return interaction.editReply({ content: `⏳ Bạn cần nghỉ ngơi thêm **${h} giờ ${m} phút** trước khi dạy buổi tiếp theo.` });
      }

      // --- Cập nhật dữ liệu user ---
      if (!user.mainJob.taskCooldowns) user.mainJob.taskCooldowns = new Map();
      user.mainJob.taskCooldowns.set(TASK_ID, now);
      user.mainJob.xp = (user.mainJob.xp || 0) + xpGain;
      user.balance = (user.balance || 0) + salaryEarned;
      user.totalEarned = (user.totalEarned || 0) + salaryEarned;

      const leveledUp = await handleJobLevelUp(user);
      await user.save();

      // --- Tạo Embed phản hồi ---
      const requiredXP = getRequiredXPForLevel(user.mainJob.level);
      const embed = new EmbedBuilder()
        .setTitle(`🧑‍🏫 ${task.name} thành công!`) // Thay đổi emoji và tiêu đề
        .setColor('Green') // Thay đổi màu
        .setDescription(
          `Bạn đã hoàn thành công việc kiểm tra chất lượng.\n` +
          `+✨ **${xpGain} XP**\n` +
          (salaryEarned > 0 ? `+💰 **${salaryEarned.toLocaleString()} VNĐ** (Lương theo cấp độ)\n` : '') +
          `📊 XP hiện tại: **${user.mainJob.xp}/${requiredXP}**`
        );

      if (leveledUp) {
        const newSalary = await calculateSalaryForJobLevel(JOB_NAME, user.mainJob.level);
        embed.addFields({ name: '📈 Thăng cấp!', value: `Bạn đã đạt cấp **${user.mainJob.level}**! Lương mới: **${newSalary.toLocaleString()} VNĐ**` });
      }

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Lỗi lệnh ${TASK_ID}: ${error.message}`, { stack: error.stack });
      if (interaction.deferred || interaction.replied) {
         await interaction.editReply({ content: `❌ Có lỗi xảy ra khi thực hiện nhiệm vụ ${task?.name || TASK_ID}.` });
      } else {
         await interaction.reply({ content: `❌ Có lỗi xảy ra khi thực hiện nhiệm vụ ${task?.name || TASK_ID}.`, ephemeral: true});
      }
    }
  }
};