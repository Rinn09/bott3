const { EmbedBuilder } = require("discord.js");
const { PartDefinition } = require("../models/PartDefinition");
const Logger = require("../utils/logger");
const { handleJobLevelUp, getRequiredXPForLevel } = require("../utils/jobUtil");
const { getRandomInt } = require("../utils/gameUtils");

const COMMON_ENGINE_PART_IDS = [
  // Danh sách này cần được cập nhật từ seedCarParts.js
  "engine_c_i4_1.6l_stock",
  "engine_c_i3_1.2l_eco",
  "engine_c_diesel_2.2l_utility",
];

// Helper function
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
  taskId: "craftcommonenginepart",
  jobName: "thợ sửa xe",
  async executeTask(
    interaction,
    user,
    jobDefinition,
    taskDefinition,
    additionalArgs = {},
  ) {
    // taskHandler đã kiểm tra và trừ requiredItems
    const finishTime = new Date(Date.now() + taskDefinition.durationMs);

    const startEmbed = new EmbedBuilder()
      .setTitle(`🔩 Bắt Đầu Chế Tạo Phụ Tùng Động Cơ Common!`)
      .setColor("Orange")
      .setDescription(
        `Bạn đã bắt đầu công việc **${taskDefinition.name}**. Quá trình này đòi hỏi sự tỉ mỉ.\nSản phẩm dự kiến hoàn thành sau khoảng **${formatDuration(taskDefinition.durationMs)}** (dự kiến <t:${Math.floor(finishTime.getTime() / 1000)}:R>).\n\nDùng lệnh \`/mainjob claim-task\` để nhận sản phẩm khi hoàn thành.`,
      )
      .addFields({
        name: "Nguyên liệu đã sử dụng",
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
    let successMessage = "";
    let craftedPartInfo = "";
    let itemAddedToGarage = false;

    const moneyReward = taskDefinition.reward?.money || 0; // Tiền công chế tạo (nếu có)
    const jobXpReward = taskDefinition.reward?.jobXp || 0;
    const jobReputationReward = taskDefinition.reward?.jobReputation || 0;

    if (Math.random() < (taskDefinition.successChance || 1)) {
      successMessage = `✅ Chúc mừng! Bạn đã chế tạo thành công một phụ tùng động cơ!`;

      // Chọn ngẫu nhiên một PartDefinition động cơ common
      const randomCommonEnginePartId =
        COMMON_ENGINE_PART_IDS[
          getRandomInt(0, COMMON_ENGINE_PART_IDS.length - 1)
        ];
      const partDefCrafted = await PartDefinition.findOne({
        partId: randomCommonEnginePartId,
      }).lean();

      if (partDefCrafted) {
        // Tạo một PartInstance mới
        // Lưu ý: Mongoose tự tạo _id khi push vào array, không cần new mongoose.Types.ObjectId() ở đây
        const newPartInstanceData = {
          partDefinitionId: partDefCrafted.partId,
          acquiredAt: new Date(),
          bonusStats: new Map(), // Có thể thêm logic roll bonus nhỏ ở đây
          // Các trường khác sẽ lấy default từ PartInstanceSchema
        };
        user.garage.parts.push(newPartInstanceData);
        user.markModified("garage.parts"); // Quan trọng
        itemAddedToGarage = true;
        craftedPartInfo = `\n🎁 Bạn nhận được: **1x ${partDefCrafted.name}** (Common). Nó đã được thêm vào kho phụ tùng của bạn (\`/gacha warehouse\`).`;
      } else {
        successMessage =
          "⚠️ Chế tạo thành công nhưng không tìm thấy định nghĩa phụ tùng để trao. Vui lòng báo admin.";
        Logger.error(
          `[Task/CraftPart] Crafting success but PartDefinition ${randomCommonEnginePartId} not found.`,
        );
      }

      user.mainJob.xp = (user.mainJob.xp || 0) + jobXpReward;
      user.mainJob.reputation =
        (user.mainJob.reputation || 0) + jobReputationReward;
      user.balance += moneyReward;
      if (moneyReward > 0) user.totalEarned += moneyReward;
    } else {
      successMessage = `❌ Rất tiếc, quá trình chế tạo đã thất bại... Bạn mất một phần nguyên liệu.`;
      user.mainJob.xp -= taskDefinition.failureOutput?.xpLoss || 0;
      if (user.mainJob.xp < 0) user.mainJob.xp = 0;
      // Logic trừ itemLossPercentage đã được xử lý khi bắt đầu task bởi taskHandler (nếu consume: true).
      // Nếu consume là false, thì bạn cần trừ item ở đây dựa trên failureOutput.itemLossPercentage
      // Ví dụ:
      // if (activeTaskData.inputItemsSnapshot) {
      //   for (const consumedItem of activeTaskData.inputItemsSnapshot) {
      //     const lossQty = Math.floor(consumedItem.quantity * (taskDefinition.failureOutput?.itemLossPercentage || 0));
      //     // Hoàn trả lại (consumedItem.quantity - lossQty) nếu cần
      //   }
      // }
    }

    const leveledUpData = await handleJobLevelUp(user);
    // user đã được save() trong handleJobLevelUp nếu có lên cấp
    // hoặc sẽ được save bởi taskHandler.completeActiveTask

    const requiredXP = getRequiredXPForLevel(user.mainJob.level);
    const finalEmbed = new EmbedBuilder()
      .setTitle(taskDefinition.name)
      .setColor(itemAddedToGarage ? "Green" : "Red")
      .setDescription(successMessage + craftedPartInfo)
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
    if (moneyReward > 0) {
      finalEmbed.addFields({
        name: "💰 Tiền công",
        value: `+${moneyReward.toLocaleString()} VNĐ`,
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

    // Không cần interaction.editReply ở đây, vì taskHandler sẽ làm
    // Chỉ cần trả về kết quả để taskHandler xử lý
    await interaction.editReply({ embeds: [finalEmbed], components: [] });
    return {
      success: itemAddedToGarage,
      message: successMessage + craftedPartInfo,
      user,
    }; // Trả về user để taskHandler save
  },
};
