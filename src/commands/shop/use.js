const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const ShopItem = require('../../models/ShopItem');
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

    await interaction.deferReply({ ephemeral: true });

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

      // --- Xử lý hiệu ứng vật phẩm ---
      if (itemData.effects?.cooldownReduction?.targetTaskId && itemData.effects?.cooldownReduction?.reductionTime) {
        const targetTaskId = itemData.effects.cooldownReduction.targetTaskId;
        const reductionTime = itemData.effects.cooldownReduction.reductionTime * quantityToUse; // Giảm theo số lượng dùng

        // Kiểm tra xem user có nghề phù hợp không (nếu vật phẩm yêu cầu)
        if (itemData.requiredJob && (!user.mainJob || user.mainJob.name?.toLowerCase() !== itemData.requiredJob.toLowerCase())) {
             return interaction.editReply(`❌ Bạn cần làm nghề **${itemData.requiredJob}** để sử dụng vật phẩm này.`);
        }
        // Kiểm tra level nghề (nếu cần)
        if (itemData.requiredLevel && (!user.mainJob || (user.mainJob.level || 1) < itemData.requiredLevel)) {
            return interaction.editReply(`❌ Bạn cần đạt cấp **<span class="math-inline">\{itemData\.requiredLevel\}\*\* nghề \*\*</span>{user.mainJob?.name || ''}** để sử dụng vật phẩm này.`);
        }

        const lastUsedTimestamp = user.mainJob?.taskCooldowns?.get(targetTaskId) || 0;

        if (lastUsedTimestamp > 0) { // Chỉ giảm nếu task đang trong cooldown
          // Giảm thời gian cooldown bằng cách trừ đi thời gian giảm
          // Đảm bảo không giảm về giá trị âm (tức là không thể rem cooldown về quá khứ xa)
          const newTimestamp = Math.max(0, lastUsedTimestamp - reductionTime);

          if (!user.mainJob.taskCooldowns) user.mainJob.taskCooldowns = new Map(); // Đảm bảo map tồn tại
          user.mainJob.taskCooldowns.set(targetTaskId, newTimestamp);
          cooldownReduced = true;

          const minutesReduced = Math.floor(reductionTime / 60000);
          const secondsReduced = Math.floor((reductionTime % 60000) / 1000);
          replyMessage += `\n⏱️ Cooldown nhiệm vụ \`${targetTaskId}\` đã giảm ${minutesReduced} phút ${secondsReduced} giây!`;
          Logger.info(`User ${userId} used ${quantityToUse} ${itemIdToUse}, reduced cooldown for ${targetTaskId} by ${reductionTime}ms. Old: ${lastUsedTimestamp}, New: ${newTimestamp}`);
        } else {
          replyMessage += `\nℹ️ Nhiệm vụ \`${targetTaskId}\` hiện không trong thời gian chờ nên không thể giảm.`;
        }
      }
      // Thêm các xử lý hiệu ứng khác (ví dụ: tăng XP tạm thời,...) ở đây

      // --- Tiêu hao vật phẩm (nếu cần) ---
      if (itemData.consumable) {
        const newQuantity = userQuantity - quantityToUse;
        if (newQuantity <= 0) {
          user.inventory.delete(itemIdToUse);
        } else {
          user.inventory.set(itemIdToUse, newQuantity);
        }
        replyMessage += `\n🎒 Số lượng còn lại: ${Math.max(0, newQuantity)}.`;
      }

      await user.save();
      return interaction.editReply(replyMessage);

    } catch (error) {
      Logger.error(`Lỗi lệnh use (${itemIdToUse}): ${error.message}`, { stack: error.stack });
      await interaction.editReply({ content: '❌ Có lỗi xảy ra khi sử dụng vật phẩm.' });
    }
  }
};