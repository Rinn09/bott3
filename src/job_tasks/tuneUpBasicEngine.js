const { EmbedBuilder, inlineCode } = require("discord.js");
const CarModel = require("../models/CarModel");
const ShopItem = require("../models/ShopItem");
const { handleJobLevelUp, getRequiredXPForLevel } = require("../utils/jobUtil");
const { getRandomInt } = require("../utils/gameUtils");

// Helper function (nếu cần)
function formatDuration(ms) {
  if (ms <= 0) return "Ngay lập tức";
  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / (1000 * 60)) % 60);
  let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  let days = Math.floor(ms / (1000 * 60 * 60 * 24));
  let str = "";
  if (days > 0) str += `${days} ngày `;
  if (hours > 0) str += `${hours} giờ `;
  if (minutes > 0) str += `${minutes} phút `;
  if (seconds > 0 || str === "") str += `${seconds} giây`;
  return str.trim();
}

module.exports = {
  taskId: "tuneupbasicengine",
  jobName: "thợ sửa xe",
  async executeTask(
    interaction,
    user,
    jobDefinition,
    taskDefinition,
    additionalArgs = {},
  ) {
    // Logic chọn xe nên được xử lý ở lệnh /mainjob task và truyền carInstanceId vào additionalArgs
    const carInstanceIdToTune = additionalArgs.targetCarId;

    if (!carInstanceIdToTune) {
      // Thông báo cho taskHandler biết là cần input từ người dùng, hoặc taskHandler tự quản lý
      // Ở đây, giả sử lệnh /mainjob task đã xử lý việc lấy carInstanceIdToTune
      // Nếu không có, taskHandler sẽ không gọi đến đây, hoặc báo lỗi từ taskHandler.
      await interaction.editReply({
        content:
          "❌ Bạn cần chọn một xe để tinh chỉnh. Vui lòng thử lại lệnh và chọn xe.",
      });
      return { success: false, message: "Chưa chọn xe." }; // Báo hiệu cho taskHandler
    }

    const carInstance = user.garage.cars.id(carInstanceIdToTune);
    const carModel = await CarModel.findOne({
      modelId: carInstance?.carModelId,
    }).lean();

    if (!carInstance || !carModel) {
      await interaction.editReply({
        content:
          "❌ Không tìm thấy thông tin xe đã chọn để bắt đầu tinh chỉnh.",
      });
      return { success: false, message: "Xe không hợp lệ." };
    }

    const finishTime = new Date(Date.now() + taskDefinition.durationMs);
    const startEmbed = new EmbedBuilder()
      .setTitle(`⏳ Bắt Đầu Tinh Chỉnh Động Cơ Cho ${carModel.name}!`)
      .setColor("Orange")
      .setDescription(
        `Bạn đã bắt đầu công việc **${taskDefinition.name}** cho chiếc ${carModel.name} (ID: ${inlineCode(carInstanceIdToTune.slice(-6))}).\nCông việc sẽ hoàn thành sau khoảng **${formatDuration(taskDefinition.durationMs)}** (dự kiến <t:${Math.floor(finishTime.getTime() / 1000)}:R>).\n\nDùng lệnh \`/mainjob claim-task\` để nhận kết quả khi hoàn thành.`,
      )
      .addFields({
        name: "Vật phẩm yêu cầu đã sử dụng",
        value:
          taskDefinition.requiredItems
            ?.map((it) => `${it.quantity}x \`${it.itemId}\``)
            .join(", ") || "Không có",
      })
      .setFooter({ text: `Yêu cầu bởi: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [startEmbed], components: [] });
    return { success: true }; // Báo hiệu task đã bắt đầu thành công
  },

  async completeTask(
    interaction,
    user,
    jobDefinition,
    taskDefinition,
    activeTaskData,
    session,
  ) {
    // user đã được fetch trong session bởi taskHandler.completeActiveTask
    const { targetCarId } = activeTaskData; // Lấy targetCarId từ activeTaskData
    const carInstance = user.garage.cars.id(targetCarId);
    const carModel = await CarModel.findOne({
      modelId: carInstance?.carModelId,
    }).lean();

    let successMessage = "";
    let statBonusMessage = "";
    let moneyEarned = taskDefinition.reward?.money || 0;
    const jobXpReward = taskDefinition.reward?.jobXp || 0;
    const jobReputationReward = taskDefinition.reward?.jobReputation || 0;
    let itemsAwardedInfo = "";

    if (Math.random() < (taskDefinition.successChance || 1)) {
      successMessage = `✅ Hoàn thành tinh chỉnh động cơ cho **${carModel?.name || "xe không rõ"}**!`;

      if (carInstance) {
        const statsToBoost = ["speed", "acceleration"];
        const randomStat =
          statsToBoost[getRandomInt(0, statsToBoost.length - 1)];
        const boostAmount = getRandomInt(1, 2); // Tăng 1-2 điểm cho tinh chỉnh cơ bản

        if (!carInstance.customTuningStats)
          carInstance.customTuningStats = new Map();
        const currentTuneBonus =
          carInstance.customTuningStats.get(randomStat) || 0;
        carInstance.customTuningStats.set(
          randomStat,
          currentTuneBonus + boostAmount,
        );

        statBonusMessage = `\n🚀 Xe được tối ưu thêm: **+${boostAmount} ${randomStat.toUpperCase()}**!`;
        user.markModified("garage.cars"); // Đánh dấu mảng cars đã thay đổi
      }

      user.mainJob.xp = (user.mainJob.xp || 0) + jobXpReward;
      user.mainJob.reputation =
        (user.mainJob.reputation || 0) + jobReputationReward;
      user.balance += moneyEarned;
      if (moneyEarned > 0) user.totalEarned += moneyEarned;

      // Xử lý outputItems
      if (taskDefinition.outputItems && taskDefinition.outputItems.length > 0) {
        let itemsReceivedArray = [];
        for (const outItem of taskDefinition.outputItems) {
          if (Math.random() < (outItem.chance || 1)) {
            const itemDef = await ShopItem.findOne({
              itemId: outItem.itemId,
            }).lean();
            if (itemDef) {
              const currentQty = user.inventory.get(outItem.itemId) || 0;
              user.inventory.set(outItem.itemId, currentQty + outItem.quantity);
              itemsReceivedArray.push(
                `${outItem.quantity}x **${itemDef.name}**`,
              );
            }
          }
        }
        if (itemsReceivedArray.length > 0) {
          itemsAwardedInfo = `\n🎁 Vật phẩm nhận được: ${itemsReceivedArray.join(", ")}.`;
        }
        user.markModified("inventory");
      }
    } else {
      successMessage = `❌ Rất tiếc, quá trình tinh chỉnh động cơ cho **${carModel?.name || "xe không rõ"}** đã thất bại...`;
      user.mainJob.xp -= taskDefinition.failureOutput?.xpLoss || 0;
      if (user.mainJob.xp < 0) user.mainJob.xp = 0;
      // Logic trừ itemLossPercentage (nếu requiredItems không consume khi bắt đầu) sẽ ở đây
    }

    const leveledUpData = await handleJobLevelUp(user); // Sẽ tự cộng thưởng tiền level up nếu có

    const requiredXP = getRequiredXPForLevel(user.mainJob.level);
    const finalEmbed = new EmbedBuilder()
      .setTitle(taskDefinition.name)
      .setColor(successMessage.startsWith("✅") ? "Green" : "Red")
      .setDescription(successMessage + statBonusMessage + itemsAwardedInfo)
      .addFields(
        {
          name: "✨ XP Nghề",
          value: `${jobXpReward > 0 ? "+" : ""}${jobXpReward.toLocaleString()} (Hiện tại: ${user.mainJob.xp.toLocaleString()}/${requiredXP.toLocaleString()})`,
          inline: true,
        },
        {
          name: "🎖️ Danh tiếng",
          value: `${jobReputationReward > 0 ? "+" : ""}${jobReputationReward.toLocaleString()} (Tổng: ${user.mainJob.reputation.toLocaleString()})`,
          inline: true,
        },
      );
    if (moneyEarned > 0) {
      finalEmbed.addFields({
        name: "💰 Tiền công",
        value: `+${moneyEarned.toLocaleString()} VNĐ`,
        inline: true,
      });
    }

    if (leveledUpData && leveledUpData.leveledUp) {
      finalEmbed.addFields({
        name: "🎉 Thăng Cấp Nghề!",
        value: `Bạn đã đạt cấp **${leveledUpData.newLevel}** cho nghề **${jobDefinition.displayName}**!\nThưởng: +${leveledUpData.reward.toLocaleString()} VNĐ.`,
      });
    }
    finalEmbed
      .setFooter({ text: `Số dư: ${user.balance.toLocaleString()} VNĐ` })
      .setTimestamp();

    // Lưu user cuối cùng trong session
    await user.save({ session });

    await interaction.editReply({ embeds: [finalEmbed], components: [] });
    return { success: true, message: successMessage }; // Báo về cho taskHandler
  },
};
