const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const ShopItem = require('../../models/ShopItem');
const MainJob = require('../../models/MainJob'); // Thêm model MainJob
const Logger = require('../../utils/logger'); // Để ghi log

module.exports = {
  data: new SlashCommandBuilder()
    .setName('use')
    .setDescription('Sử dụng một vật phẩm từ túi đồ của bạn.')
    .addStringOption(option =>
      option.setName('item_id')
        .setDescription('ID của vật phẩm muốn sử dụng (Xem ID bằng /inventory)')
        .setRequired(true))
    .addIntegerOption(option => // Thêm option số lượng
      option.setName('quantity')
        .setDescription('Số lượng muốn dùng (mặc định là 1)')
        .setMinValue(1)
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const itemIdToUse = interaction.options.getString('item_id').toLowerCase();
    const quantityToUse = interaction.options.getInteger('quantity') || 1;

    await interaction.deferReply({ ephemeral: false });

    try {
      const user = await User.findOne({ userId, guildId });
      const itemData = await ShopItem.findOne({ itemId: itemIdToUse });

      if (!user) return interaction.editReply('❌ Không tìm thấy dữ liệu người dùng.');
      if (!itemData) return interaction.editReply(`❌ Không tìm thấy vật phẩm với ID: \`${itemIdToUse}\`.`);

      const userQuantity = user.inventory?.get(itemIdToUse) || 0;

      if (userQuantity < quantityToUse) {
        return interaction.editReply(`❌ Bạn không có đủ ${quantityToUse} ${itemData.name}. Bạn chỉ có ${userQuantity}.`);
      }

      let replyMessage = `✅ Bạn đã sử dụng ${quantityToUse} ${itemData.name}.`;
      let cooldownReduced = false; // Biến cờ để kiểm tra có giảm cooldown không

      // --- Xử lý kiểm tra yêu cầu nghề ---
      if (itemData.requiredJob) {
        let reqJobs = [];
        if (Array.isArray(itemData.requiredJob)) {
          reqJobs = itemData.requiredJob.map(job => job.toLowerCase());
        } else {
          reqJobs = [itemData.requiredJob.toLowerCase()];
        }
        const userJob = user.mainJob?.name?.toLowerCase();
        if (!userJob || !reqJobs.includes(userJob)) {
          return interaction.editReply(`❌ Bạn cần làm nghề **${reqJobs.join(', ')}** để sử dụng vật phẩm này.`);
        }
      }

      // --- Xử lý hiệu ứng vật phẩm ---
      let targetTaskId = itemData.effects.cooldownReduction.targetTaskId;
      
      // Nếu targetTaskId không phải là string, ví dụ là mảng, ta lấy phần tử đầu tiên
      if (Array.isArray(targetTaskId)) {
        targetTaskId = targetTaskId[0];
      }

      const reductionTime = itemData.effects.cooldownReduction.reductionTime * quantityToUse; // Giảm theo số lượng dùng

      // Nếu cần kiểm tra level nghề, giữ nguyên:
      if (itemData.requiredLevel && (!user.mainJob || (user.mainJob.level || 1) < itemData.requiredLevel)) {
        return interaction.editReply(`❌ Bạn cần đạt cấp **${itemData.requiredLevel}** nghề **${user.mainJob?.name || ''}** để sử dụng vật phẩm này.`);
      }

      // Lấy dữ liệu nhiệm vụ (từ MainJob) để biết cooldownTime của nhiệm vụ targetTaskId
      const mainJobData = await MainJob.findOne({ name: user.mainJob.name.toLowerCase() });
      const taskData = mainJobData?.tasks?.find(t => t.taskId.toLowerCase() === targetTaskId.toLowerCase());
      if (!taskData) {
        replyMessage += `\nℹ️ Không tìm thấy thông tin nhiệm vụ cho \`${targetTaskId}\`.`;
      } else {
        const cooldownTime = taskData.cooldown; // Cooldown ban đầu của nhiệm vụ
        // Lấy timestamp khi nhiệm vụ được thực hiện; nếu không có, coi là sẵn sàng (remaining = 0)
        const lastUsedTimestamp = user.mainJob?.taskCooldowns?.get(targetTaskId) || 0;
        const now = Date.now();
        const elapsed = now - lastUsedTimestamp;
        const remaining = lastUsedTimestamp ? Math.max(0, cooldownTime - elapsed) : 0;

        if (remaining > 0) {
          // Nhiệm vụ vẫn trong cooldown, áp dụng giảm
          let newRemaining = remaining - reductionTime;
          if (newRemaining < 0) newRemaining = 0;
          // Tính lại timestamp: newLastUsed = now - (cooldownTime - newRemaining)
          const newTimestamp = now - (cooldownTime - newRemaining);
          user.mainJob.taskCooldowns.set(targetTaskId, newTimestamp);
          user.markModified('mainJob.taskCooldowns'); // Đánh dấu phần này đã được thay đổi
          cooldownReduced = true;

          const minutesReduced = Math.floor(reductionTime / 60000);
          const secondsReduced = Math.floor((reductionTime % 60000) / 1000);
          replyMessage += `\n⏱️ Cooldown nhiệm vụ \`${targetTaskId}\` đã giảm ${minutesReduced} phút ${secondsReduced} giây!`;
          Logger.info(`User ${userId} used ${quantityToUse} ${itemIdToUse}, reduced cooldown for ${targetTaskId} by ${reductionTime}ms. Old remaining: ${remaining}ms, New remaining: ${newRemaining}ms`);
        } else {
          replyMessage += `\nℹ️ Nhiệm vụ \`${targetTaskId}\` hiện không trong thời gian chờ nên không thể giảm.`;
        }
      }

      // --- Tiêu hao vật phẩm (chỉ nếu hiệu ứng thành công) ---
      if (itemData.consumable) {
        // Chỉ tiêu hao nếu có ít nhất 1 hiệu ứng được áp dụng (hoặc bạn có thể thay đổi điều kiện tùy ý)
        if (cooldownReduced) {
          const newQuantity = user.inventory?.get(itemIdToUse) - quantityToUse;
          if (newQuantity <= 0) {
            user.inventory.delete(itemIdToUse);
          } else {
            user.inventory.set(itemIdToUse, newQuantity);
          }
          replyMessage += `\n🎒 Số lượng còn lại: ${Math.max(0, newQuantity)}.`;
        } else {
          replyMessage += `\nℹ️ Không tiêu hao vật phẩm vì hiệu ứng không được kích hoạt.`;
        }
      }

      await user.save();
      return interaction.editReply(replyMessage);

    } catch (error) {
      Logger.error(`Lỗi lệnh use (${itemIdToUse}): ${error.message}`, { stack: error.stack });
      await interaction.editReply({ content: '❌ Có lỗi xảy ra khi sử dụng vật phẩm.' });
    }
  }
};