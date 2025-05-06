const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const ShopItem = require('../../models/ShopItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Bán vật phẩm bạn sở hữu cho cửa hàng.')
    .addStringOption(option =>
      option.setName('item_id')
        .setDescription('ID của vật phẩm muốn bán (xem ID bằng /inventory)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('Số lượng muốn bán (mặc định là 1)')
        .setMinValue(1)
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const itemId = interaction.options.getString('item_id').toLowerCase();
    const quantityToSell = interaction.options.getInteger('quantity') || 1;

    const item = await ShopItem.findOne({ itemId: itemId });
    const user = await User.findOne({ userId, guildId });

    if (!user) {
        return interaction.reply({ content: 'Không tìm thấy dữ liệu người dùng!', ephemeral: true });
    }
    if (!item) {
      return interaction.reply({ content: `❌ Không tìm thấy vật phẩm với ID \`${itemId}\`.`, ephemeral: true });
    }
    if (item.sellPrice === null) {
      return interaction.reply({ content: `❌ Vật phẩm **${item.name}** không thể bán lại cho cửa hàng.`, ephemeral: true });
    }

    const currentQuantity = user.inventory.get(itemId) || 0;

    if (currentQuantity < quantityToSell) {
      return interaction.reply({ content: `❌ Bạn không có đủ **${quantityToSell} ${item.name}** để bán. Bạn chỉ có ${currentQuantity}.`, ephemeral: true });
    }

    const totalGain = item.sellPrice * quantityToSell;

    // Cộng tiền và trừ vật phẩm khỏi inventory
    user.balance += totalGain;
    user.totalEarned = (user.totalEarned || 0) + totalGain; // Cập nhật totalEarned

    user.inventory.set(itemId, currentQuantity - quantityToSell);
    // Nếu số lượng về 0, xóa khỏi Map
    if (user.inventory.get(itemId) <= 0) {
      user.inventory.delete(itemId);
    }

    await user.save();

    return interaction.reply(`✅ Bạn đã bán thành công **${quantityToSell} ${item.name}** và nhận được **${totalGain.toLocaleString()} VNĐ**.`);
  }
};