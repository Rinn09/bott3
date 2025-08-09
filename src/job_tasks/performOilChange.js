const { EmbedBuilder } = require("discord.js");
const Logger = require("../utils/logger");
const { handleJobLevelUp, getRequiredXPForLevel } = require("../utils/jobUtil");

module.exports = {
  taskId: "performoilchange",
  jobName: "thợ sửa xe",
  async executeTask(interaction, user, jobDefinition, taskDefinition) {
    // GIẢ SỬ: Logic chọn xe và kiểm tra requiredItems đã được xử lý bởi taskHandler
    // taskHandler sẽ truyền carInstanceId (nếu task này yêu cầu chọn xe) hoặc đơn giản chỉ chạy logic.
    // Task này đơn giản, không cần chọn xe cụ thể, chỉ là một hành động trừu tượng.

    const moneyReward = taskDefinition.reward?.money || 0;
    const jobXpReward = taskDefinition.reward?.jobXp || 0;
    const jobReputationReward = taskDefinition.reward?.jobReputation || 0;

    user.balance += moneyReward;
    user.totalEarned = (user.totalEarned || 0) + moneyReward;
    user.mainJob.xp = (user.mainJob.xp || 0) + jobXpReward;
    user.mainJob.reputation =
      (user.mainJob.reputation || 0) + jobReputationReward;

    const leveledUp = await handleJobLevelUp(user);
    // user.save() sẽ được gọi bởi taskHandler

    const requiredXP = getRequiredXPForLevel(user.mainJob.level);

    const embed = new EmbedBuilder()
      .setTitle(`🛢️ ${taskDefinition.name} Hoàn Tất!`)
      .setColor("#A52A2A") // Brown
      .setDescription(
        `Bạn đã hoàn thành công việc **${taskDefinition.name}** cho một khách hàng.`,
      )
      .addFields(
        {
          name: "💰 Tiền công nhận được",
          value: `${moneyReward.toLocaleString()} VNĐ`,
          inline: true,
        },
        { name: "✨ XP Nghề", value: `+${jobXpReward}`, inline: true },
        {
          name: "🎖️ Danh tiếng",
          value: `+${jobReputationReward}`,
          inline: true,
        },
        {
          name: "📊 Tiến độ nghề",
          value: `${user.mainJob.xp.toLocaleString()}/${requiredXP.toLocaleString()} XP`,
        },
      )
      .setFooter({ text: `Thực hiện bởi: ${interaction.user.tag}` })
      .setTimestamp();

    if (leveledUp && leveledUp.leveledUp) {
      embed.addFields({
        name: "🎉 Thăng Cấp Nghề!",
        value: `Chúc mừng! Bạn đã đạt cấp **${user.mainJob.level}** cho nghề **${jobDefinition.displayName}**!`,
      });
      // Logic thưởng thêm từ MainJobModel.levelUpRewards có thể được xử lý trong handleJobLevelUp hoặc ở đây
      const levelUpJobRewards = jobDefinition.levelUpRewards?.get(
        user.mainJob.level.toString(),
      );
      if (levelUpJobRewards) {
        let rewardMsg = "";
        if (levelUpJobRewards.money > 0) {
          user.balance += levelUpJobRewards.money;
          user.totalEarned += levelUpJobRewards.money;
          rewardMsg += `\n+${levelUpJobRewards.money.toLocaleString()} VNĐ`;
        }
        // Xử lý item rewards...
        embed.addFields({
          name: "🏆 Thưởng Lên Cấp Nghề",
          value: `Bạn nhận thêm: ${rewardMsg.trim()}`,
        });
      }
    }

    await interaction.editReply({ embeds: [embed] });
    Logger.info(
      `[Task/${this.taskId}] User ${user.userId} completed task. Money: +${moneyReward}, XP: +${jobXpReward}, Rep: +${jobReputationReward}`,
    );
  },
};
