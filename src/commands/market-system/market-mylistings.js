const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MarketListing = require('../../models/MarketListing');
const Logger = require('../../utils/logger');

const ITEMS_PER_PAGE = 5; // Số vật phẩm mỗi trang

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-mylistings')
        .setDescription('Xem các tin đăng đang hoạt động của bạn trên chợ.')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Số trang muốn xem (mặc định là 1)')
                .setMinValue(1)
                .setRequired(false)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        let requestedPage = interaction.options.getInteger('page') || 1;

        await interaction.deferReply({ ephemeral: false }); // Có thể để ephemeral: true nếu chỉ muốn người dùng xem

        const generateMyListingsEmbedAndButtons = async (page) => {
            const mongoQuery = {
                sellerId: userId, // Lọc theo người bán là chính mình
                guildId: guildId,
                status: 'active'  // Chỉ hiển thị tin đang hoạt động
            };

            const listingsCount = await MarketListing.countDocuments(mongoQuery);
            const totalPages = Math.ceil(listingsCount / ITEMS_PER_PAGE) || 1;

            if (page > totalPages) page = totalPages;
            if (page < 1) page = 1;

            const skip = (page - 1) * ITEMS_PER_PAGE;

            const listings = await MarketListing.find(mongoQuery)
                .sort({ listedAt: -1 }) // Sắp xếp mới nhất lên đầu
                .skip(skip)
                .limit(ITEMS_PER_PAGE)
                .lean();

            const embed = new EmbedBuilder()
                .setTitle(`📰 Tin đăng đang bán của bạn - Trang ${page}/${totalPages}`)
                .setColor('#F1C40F') // Màu vàng
                .setTimestamp()
                .setFooter({ text: `Người dùng: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });


            if (!listings.length) {
                 embed.setDescription('Bạn không có tin đăng nào đang hoạt động trên chợ.');
                 // Không cần nút nếu không có trang nào
                 const components = listingsCount > 0 ? [generatePaginationButtons(page, totalPages, "market_mylistings_")] : [];
                 return { embeds: [embed], components, currentPage: page, totalPages };
            }


            listings.forEach(listing => {
                embed.addFields({
                    // Hiển thị rõ ID để người dùng dễ dàng copy và dùng lệnh /market-unlist
                    name: `${listing.itemSnapshot?.name || listing.itemName} (x${listing.quantity})`,
                    value: `Giá: **${listing.price.toLocaleString()} VNĐ / cái**\nĐăng lúc: <t:${Math.floor(listing.listedAt.getTime() / 1000)}:R>\nID: \`${listing._id}\``,
                    inline: false
                });
            });

            const components = [generatePaginationButtons(page, totalPages, "market_mylistings_")];

            return { embeds: [embed], components, currentPage: page, totalPages };
        };

        const generatePaginationButtons = (currentPage, totalPages, prefix) => {
             return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${prefix}prev_${currentPage}`)
                    .setLabel('◀️ Trước')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId(`${prefix}next_${currentPage}`)
                    .setLabel('Sau ▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= totalPages) // >= vì page bắt đầu từ 1
            );
        };


        // Hiển thị lần đầu
        const initialData = await generateMyListingsEmbedAndButtons(requestedPage);
        const message = await interaction.editReply(initialData);

        // Chỉ tạo collector nếu có nhiều hơn 1 trang
        if (initialData.totalPages <= 1) return;


        // Collector cho các nút phân trang
        const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('market_mylistings_');
        const collector = message.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 }); // 5 phút

        let currentCollectorPage = initialData.currentPage;

        collector.on('collect', async i => {
             if (!i.isButton()) return;
             await i.deferUpdate(); // Xác nhận tương tác mà không gửi phản hồi mới

             const action = i.customId.split('_')[3]; // Lấy 'prev' hoặc 'next'

             if (action === 'prev') {
                 currentCollectorPage--;
             } else if (action === 'next') {
                 currentCollectorPage++;
             }

             // Đảm bảo trang không đi ra ngoài giới hạn trong collector
             if(currentCollectorPage < 1) currentCollectorPage = 1;
             // totalPages được lấy từ initialData vì nó không thay đổi trong lúc xem
             if(currentCollectorPage > initialData.totalPages) currentCollectorPage = initialData.totalPages;


             const newData = await generateMyListingsEmbedAndButtons(currentCollectorPage);
             await i.editReply(newData); // Cập nhật tin nhắn với trang mới
        });


        collector.on('end', async (collected, reason) => {
            if (reason !== 'messageDelete') {
                const finalData = await generateMyListingsEmbedAndButtons(currentCollectorPage); // Lấy lại embed trang cuối cùng
                const disabledComponents = finalData.components.map(row => {
                    row.components.forEach(button => button.setDisabled(true));
                    return row;
                });
                try {
                    await message.edit({ components: disabledComponents });
                } catch (error) {
                   // Logger.warn(`Could not edit my listings message on collector end: ${error.message}`);
                }
            }
        });
    }
};