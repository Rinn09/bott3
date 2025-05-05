const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const ShopItem = require('../../models/ShopItem'); // Cần để lấy tên vật phẩm

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Xem túi đồ của bạn.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const user = await User.findOne({ userId, guildId });

    if (!user || !user.inventory || user.inventory.size === 0) {
      return interaction.reply({ content: '🎒 Túi đồ của bạn đang trống!', ephemeral: true });
    }

    const inventoryEmbed = new EmbedBuilder()
      .setTitle(`🎒 Túi đồ của ${interaction.user.username}`)
      .setColor('Orange');

    let description = '';
    for (const [itemId, quantity] of user.inventory) {
        if (quantity > 0) { // Chỉ hiển thị vật phẩm có số lượng > 0
            const itemInfo = await ShopItem.findOne({ itemId: itemId }); // Lấy thông tin vật phẩm để hiển thị tên
            const itemName = itemInfo ? itemInfo.name : itemId; // Nếu không tìm thấy item info, hiển thị ID
            description += `**${itemName}** (\`${itemId}\`) - Số lượng: ${quantity}\n`;
        }
    }

    if (!description) {
        description = 'Túi đồ của bạn đang trống!';
    }

    inventoryEmbed.setDescription(description);

    await interaction.reply({ embeds: [inventoryEmbed] });
  }
};