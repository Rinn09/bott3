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
  taskId: "thuHoach",
  jobName: "nông dân",
  async executeTask(interaction, user, jobDefinition, taskDefinition) {
    const {
      name: taskName,
      xp: taskXpFromDef,
      // reward: taskBaseRewardFromDef, // Lệnh này tính lương theo level
      cooldown: taskCooldownFromDef,
    } = taskDefinition;

    const cooldownTimeMs = taskCooldownFromDef || 120 * 60 * 1000; // 2 giờ default từ lệnh gốc
    const xpGain = taskXpFromDef || 50;
    // Tính lương dựa trên cấp độ nghề của người dùng
    let moneyEarned = await calculateSalaryForJobLevel(
      jobDefinition.name,
      user.mainJob.level,
    );

    const now = Date.now();
    const lastUsedTimestamp = user.mainJob.taskCooldowns?.get(this.taskId) || 0;

    if (now - lastUsedTimestamp < cooldownTimeMs) {
      const remaining = cooldownTimeMs - (now - lastUsedTimestamp);
      return interaction.editReply({
        content: `⏳ Hãy đợi **${formatDuration(remaining)}** nữa để ${taskName.toLowerCase()} lần tiếp theo.`,
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
    // Always save after modifications, regardless of level up status
    await user.save();

    const requiredXP = getRequiredXPForLevel(user.mainJob.level);
    const embed = new EmbedBuilder()
      .setTitle(`🌾 ${taskName} thành công!`)
      .setColor("#4EEE94") // Màu xanh lá cây nhạt
      .setDescription(
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
        name: "🎉 Thăng Cấp Nghề!",
        value: `Chúc mừng! Bạn đã đạt cấp **${user.mainJob.level}** cho nghề **${jobDefinition.name}**!\nLương mới: **${newSalaryAfterLevelUp.toLocaleString()} VNĐ**`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
    Logger.info(
      `[MainJob/Task/${this.taskId}] User ${user.userId} completed task ${taskName}. XP: +${xpGain}, Money: +${moneyEarned}. Leveled up: ${leveledUp}`,
    );
  },
};
