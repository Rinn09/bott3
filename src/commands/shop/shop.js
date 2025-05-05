// src/commands/shop/shop.js (Tạo thư mục 'shop' nếu chưa có)
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ShopItem = require('../../models/ShopItem');

const ITEMS_PER_PAGE = 5; // Số vật phẩm mỗi trang

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Xem các vật phẩm đang bán trong cửa hàng.'),

  async execute(interaction) {
    await interaction.deferReply();

    const items = await ShopItem.find({ buyPrice: { $ne: null } }).sort({ name: 1 }); // Chỉ hiển thị đồ có thể mua

    if (!items.length) {
      return interaction.editReply('Cửa hàng hiện đang trống trơn!');
    }

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const currentItems = items.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle('🛒 Cửa Hàng Vật Phẩm')
        .setColor('Green')
        .setDescription(currentItems.map(item =>
          `**${item.name}** (\`${item.itemId}\`)\n` +
          `*${item.description}*\n` +
          `Giá mua: **${item.buyPrice?.toLocaleString()} VNĐ**` +
          `${item.sellPrice ? ` | Giá bán: ${item.sellPrice.toLocaleString()} VNĐ` : ''}` +
          `${item.requiredJob ? `\n*Yêu cầu nghề: ${item.requiredJob} (Cấp ${item.requiredLevel || 1})*` : ''}`
        ).join('\n\n'))
        .setFooter({ text: `Trang ${page + 1}/${totalPages}` });
      return embed;
    };

    const generateButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('shop_prev')
          .setLabel('◀️ Trước')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('shop_next')
          .setLabel('Sau ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= totalPages - 1)
      );
    };

    const initialEmbed = generateEmbed(currentPage);
    const initialButtons = generateButtons(currentPage);
    const message = await interaction.editReply({ embeds: [initialEmbed], components: [initialButtons] });

    const collector = message.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && (i.customId === 'shop_prev' || i.customId === 'shop_next'),
      time: 120000 // 2 phút
    });

    collector.on('collect', async i => {
      if (i.customId === 'shop_prev') {
        currentPage--;
      } else if (i.customId === 'shop_next') {
        currentPage++;
      }
      const embed = generateEmbed(currentPage);
      const buttons = generateButtons(currentPage);
      await i.update({ embeds: [embed], components: [buttons] });
    });

    collector.on('end', () => {
        const disabledButtons = generateButtons(currentPage).components.map(b => b.setDisabled(true));
        interaction.editReply({ components: [new ActionRowBuilder().addComponents(disabledButtons)] }).catch(()=>{});
    });
  }
};