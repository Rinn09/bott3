const { EmbedBuilder } = require("discord.js");
const User = require("../models/User"); // User model
const MainJob = require("../models/MainJob"); // MainJob model
const {
  handleJobLevelUp,
  getRequiredXPForLevel,
  calculateSalaryForJobLevel,
} = require("../utils/jobUtil");
const Logger = require("../utils/logger");

// Helper function to format duration
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
  if (seconds > 0 || durationString === "") durationString += `${seconds} giây`;
  return durationString.trim() || "Ngay bây giờ";
}

module.exports = {
  taskId: "kiemTra",
  jobName: "công nhân",
  async executeTask(interaction, user, jobDefinition, taskDefinition) {
    const {
      name: taskName,
      xp: taskXpFromDef,
      // reward: taskBaseRewardFromDef, // Lệnh này tính lương theo level, không dùng reward cố định từ task
      cooldown: taskCooldownFromDef,
    } = taskDefinition;

    const cooldownTimeMs = taskCooldownFromDef || 10800000; // 3 giờ default từ lệnh gốc
    const xpGain = taskXpFromDef || 60;
    // Tính lương dựa trên cấp độ nghề của người dùng
    let moneyEarned = await calculateSalaryForJobLevel(
      jobDefinition.name, // Sử dụng tên nghề từ jobDefinition
      user.mainJob.level,
    );

    const now = Date.now();
    const lastUsedTimestamp = user.mainJob.taskCooldowns?.get(this.taskId) || 0;

    if (now - lastUsedTimestamp < cooldownTimeMs) {
      const remaining = cooldownTimeMs - (now - lastUsedTimestamp);
      // Sử dụng formatDuration cho thông báo cooldown
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      return interaction.editReply({
        content: `⏳ Bạn cần nghỉ ngơi thêm **${h > 0 ? `${h} giờ ` : ""}${m > 0 ? `${m} phút ` : ""}${s} giây** trước khi ${taskName.toLowerCase()} lần tiếp theo.`,
      });
    }

    if (!user.mainJob.taskCooldowns) user.mainJob.taskCooldowns = new Map();
    user.mainJob.taskCooldowns.set(this.taskId, now);

    user.mainJob.xp = (user.mainJob.xp || 0) + xpGain;
    if (moneyEarned > 0) {
      // Kiểm tra moneyEarned > 0 trước khi cộng
      user.balance = (user.balance || 0) + moneyEarned;
      user.totalEarned = (user.totalEarned || 0) + moneyEarned;
    }
    const leveledUp = await handleJobLevelUp(user);
    await user.save();

    const requiredXP = getRequiredXPForLevel(user.mainJob.level);
    const embed = new EmbedBuilder()
      .setTitle(`🔎 ${taskName} thành công!`)
      .setColor("#FFD700") // Gold - màu cho kiểm tra
      .setDescription(
        `Bạn đã hoàn thành công việc kiểm tra chất lượng.\n` +
          `+✨ **${xpGain.toLocaleString()} XP Nghề**\n` +
          (moneyEarned > 0
            ? `+💰 **${moneyEarned.toLocaleString()} VNĐ** (Lương theo cấp độ)\n`
            : "") +
          `📊 XP Nghề hiện tại: **${user.mainJob.xp.toLocaleString()}/${requiredXP.toLocaleString()}**`,
      )
      .setTimestamp();

    if (leveledUp) {
      const newSalaryAfterLevelUp = await calculateSalaryForJobLevel(
        jobDefinition.name,
        user.mainJob.level,
      );
      embed.addFields({
        name: "📈 Thăng cấp!",
        value: `Bạn đã đạt cấp **${user.mainJob.level}** cho nghề **${jobDefinition.name}**!\nLương mới: **${newSalaryAfterLevelUp.toLocaleString()} VNĐ**`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
    Logger.info(
      `[MainJob/Task/${this.taskId}] User ${user.userId} completed task ${taskName}. XP: +${xpGain}, Money: +${moneyEarned}. Leveled up: ${leveledUp}`,
    );
  },
};
