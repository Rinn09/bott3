const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const ShopItem = require('../../models/ShopItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Mua vật phẩm từ cửa hàng.')
    .addStringOption(option =>
      option.setName('item_id')
        .setDescription('ID của vật phẩm muốn mua (xem ID bằng /shop)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Số lượng muốn mua (mặc định là 1)')
        .setMinValue(1)
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const itemId = interaction.options.getString('item_id').toLowerCase();
    const quantity = interaction.options.getInteger('quantity') || 1;

    const item = await ShopItem.findOne({ itemId: itemId });
    const user = await User.findOne({ userId, guildId });

    if (!user) {
        return interaction.reply({ content: 'Không tìm thấy dữ liệu người dùng!', ephemeral: true });
    }
    if (!item) {
      return interaction.reply({ content: `❌ Không tìm thấy vật phẩm với ID \`${itemId}\`.`, ephemeral: true });
    }
    if (item.buyPrice === null) {
      return interaction.reply({ content: `❌ Vật phẩm **${item.name}** không thể mua từ cửa hàng.`, ephemeral: true });
    }

    // Kiểm tra yêu cầu nghề/level (nếu có)
    if (item.requiredJob) {
        if (!user.mainJob || user.mainJob.name?.toLowerCase() !== item.requiredJob.toLowerCase() || (user.mainJob.level || 1) < (item.requiredLevel || 1)) {
            return interaction.reply({ content: `❌ Bạn cần là **${item.requiredJob}** cấp **${item.requiredLevel || 1}** trở lên để mua vật phẩm này.`, ephemeral: true });
        }
    }
    const totalCost = item.buyPrice * quantity;

    if (user.balance < totalCost) {
      return interaction.reply({ content: `❌ Bạn không đủ tiền! Cần **${totalCost.toLocaleString()} VNĐ** nhưng bạn chỉ có ${user.balance.toLocaleString()} VNĐ.`, ephemeral: true });
    }
    user.balance -= totalCost;
    user.totalSpent = (user.totalSpent || 0) + totalCost; // Cập nhật totalSpent

    const currentQuantity = user.inventory.get(itemId) || 0;
    user.inventory.set(itemId, currentQuantity + quantity);

    await user.save();

    return interaction.reply(`✅ Bạn đã mua thành công **${quantity} ${item.name}** với giá **${totalCost.toLocaleString()} VNĐ**.`);
  }
}
