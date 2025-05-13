const { EmbedBuilder } = require("discord.js");
const User = require("../models/User"); // User model
const MainJob = require("../models/MainJob"); // MainJob model
const {
  handleJobLevelUp,
  getRequiredXPForLevel,
  calculateSalaryForJobLevel,
} = require("../utils/jobUtil");
const Logger = require("../utils/logger");

// Helper function (nếu có, ví dụ formatDuration từ view-main-job)
function formatDuration(ms) {
  if (ms <= 0) return "Sẵn sàng";
  let durationString = "";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  ms %= 24 * 60 * 60 * 1000;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  ms %= 60 * 60 * 1000;
  const minutes = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds = Math.floor(ms / 1000);

  if (days > 0) durationString += `${days} ngày `;
  if (hours > 0) durationString += `${hours} giờ `;
  if (minutes > 0) durationString += `${minutes} phút `;
  if (seconds > 0 || durationString === "") durationString += `${seconds} giây`; // Hiển thị giây nếu là 0 phút
  return durationString.trim() || "Ngay bây giờ";
}

module.exports = {
  taskId: "tuoiCay", // ID của task này, phải khớp với định nghĩa trong MainJob model
  jobName: "nông dân", // Nghề yêu cầu cho task này (chữ thường)
  async executeTask(interaction, user, jobDefinition, taskDefinition) {
    // user: Document User đã được fetch
    // jobDefinition: Document MainJob của nghề người dùng đang làm
    // taskDefinition: Object task cụ thể từ jobDefinition.tasks

    const {
      name: taskName,
      xp: taskXp,
      reward: taskBaseReward,
      cooldown: taskCooldown,
    } = taskDefinition;
    const guildId = interaction.guild.id;

    const cooldownTimeMs = taskCooldown || 5 * 60 * 1000; // Default 5 phút nếu không có
    const xpGain = taskXp || 20; // Default 20 XP
    let moneyEarned = taskBaseReward || 0;

    // Nếu task không có reward cố định (reward = 0), thì tính lương theo cấp độ nghề
    // Điều chỉnh logic này nếu có nhiều task trong một nghề tính lương theo level
    if (
      moneyEarned === 0 &&
      jobDefinition.salaryByLevel &&
      jobDefinition.salaryByLevel.size > 0
    ) {
      // Kiểm tra xem task này có phải là task chính để nhận lương theo level không
      const primarySalaryTask = jobDefinition.tasks.find(
        (t) => t.reward === 0 && t.taskId === taskDefinition.taskId,
      ); // Hoặc một cờ 'isPrimarySalaryTask' trong định nghĩa task
      if (primarySalaryTask) {
        moneyEarned = await calculateSalaryForJobLevel(
          jobDefinition.name,
          user.mainJob.level,
        );
      }
    }

    const now = Date.now();
    const lastUsedTimestamp = user.mainJob.taskCooldowns?.get(this.taskId) || 0;

    if (now - lastUsedTimestamp < cooldownTimeMs) {
      const remaining = cooldownTimeMs - (now - lastUsedTimestamp);
      return interaction.editReply({
        content: `⏳ Hãy đợi **${formatDuration(remaining)}** nữa để thực hiện **${taskName}**.`,
      });
    }

    if (!user.mainJob.taskCooldowns) user.mainJob.taskCooldowns = new Map();
    user.mainJob.taskCooldowns.set(this.taskId, now);

    user.mainJob.xp = (user.mainJob.xp || 0) + xpGain;
    if (moneyEarned > 0) {
      user.balance = (user.balance || 0) + moneyEarned;
      user.totalEarned = (user.totalEarned || 0) + moneyEarned;
    }

    const leveledUp = await handleJobLevelUp(user);
    await user.save(); // Lưu user sau khi đã cập nhật

    const requiredXPForNextLevel = getRequiredXPForLevel(user.mainJob.level);
    const taskEmbed = new EmbedBuilder()
      .setTitle(`🚿 ${taskName} thành công!`) // Emoji và title có thể thay đổi theo task
      .setColor("#97FFFF") // Màu có thể thay đổi theo task
      .setDescription(
        `Bạn đã hoàn thành nhiệm vụ **${taskName}** của nghề **${jobDefinition.name.charAt(0).toUpperCase() + jobDefinition.name.slice(1)}**.\n\n` +
          `+✨ **${xpGain.toLocaleString()} XP Nghề**\n` +
          (moneyEarned > 0
            ? `+💰 **${moneyEarned.toLocaleString()} VNĐ**\n`
            : "") +
          `📊 XP Nghề hiện tại: **${user.mainJob.xp.toLocaleString()}/${requiredXPForNextLevel.toLocaleString()}**`,
      )
      .setTimestamp();

    if (leveledUp) {
      const newSalaryAfterLevelUp = await calculateSalaryForJobLevel(
        jobDefinition.name,
        user.mainJob.level,
      );
      taskEmbed.addFields({
        name: "🎉 Thăng Cấp Nghề!",
        value: `Chúc mừng! Bạn đã đạt cấp **${user.mainJob.level}** cho nghề **${jobDefinition.name}**!\nLương cơ bản mới (cho nhiệm vụ chính): ${newSalaryAfterLevelUp.toLocaleString()} VNĐ`,
      });
    }
    await interaction.editReply({ embeds: [taskEmbed] });
    Logger.info(
      `[MainJob/Task/${this.taskId}] User ${user.userId} completed task. XP: +${xpGain}, Money: +${moneyEarned}. Leveled up: ${leveledUp}`,
    );
  },
};
