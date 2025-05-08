const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const MarketListing = require('../../models/MarketListing');
const User = require('../../models/User');
const Logger = require('../../utils/logger');
const mongoose = require('mongoose');

const ITEMS_PER_PAGE = 5; // Số vật phẩm mỗi trang

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-view')
        .setDescription('Xem các vật phẩm đang được bán trên chợ.')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Số trang muốn xem (mặc định là 1)')
                .setMinValue(1)
                .setRequired(false)),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        let requestedPage = interaction.options.getInteger('page') || 1;

        await interaction.deferReply({ ephemeral: false }); // Cho phép nhiều người thấy chợ

        const generateMarketEmbedAndButtons = async (page) => {
            const skip = (page - 1) * ITEMS_PER_PAGE;
            const listingsCount = await MarketListing.countDocuments({ guildId, status: 'active' });
            const totalPages = Math.ceil(listingsCount / ITEMS_PER_PAGE) || 1; // Đảm bảo totalPages ít nhất là 1

            if (page > totalPages) page = totalPages; // Nếu trang yêu cầu lớn hơn tổng số trang, đặt về trang cuối
            if (page < 1) page = 1; // Đảm bảo trang không nhỏ hơn 1


            const listings = await MarketListing.find({ guildId, status: 'active' })
                .sort({ listedAt: -1 }) // Sắp xếp mới nhất lên đầu
                .skip(skip)
                .limit(ITEMS_PER_PAGE)
                .lean();

            const embed = new EmbedBuilder()
                .setTitle(` Chợ Giao Dịch - Trang ${page}/${totalPages}`)
                .setColor('#3498DB')
                .setTimestamp();

            if (!listings.length && listingsCount === 0) {
                embed.setDescription('Hiện tại không có vật phẩm nào được đăng bán trên chợ.');
                return { embeds: [embed], components: [] };
            } else if (!listings.length && listingsCount > 0) {
                embed.setDescription(`Không tìm thấy vật phẩm ở trang ${page}. Tổng số trang: ${totalPages}.`);
                 return { embeds: [embed], components: [generatePaginationButtons(page, totalPages, "market_view_")] };
            }


            listings.forEach(listing => {
                embed.addFields({
                    name: `${listing.itemSnapshot?.name || listing.itemName} (x${listing.quantity}) - \`${listing._id}\``,
                    value: `Người bán: ${listing.sellerUsername}\nGiá: **${(listing.price || 0).toLocaleString()} VNĐ / cái**\nĐăng lúc: <t:${Math.floor(listing.listedAt.getTime() / 1000)}:R>`,
                    inline: false
                });
            });

            const components = [generatePaginationButtons(page, totalPages, "market_view_")];
            // Chỉ thêm hàng nút mua nếu có vật phẩm
            /*if (listings.length > 0) {
                 const buyButtonsRow = new ActionRowBuilder();
                 listings.slice(0, 5).forEach(listing => { // Chỉ tạo tối đa 5 nút mua mỗi trang
                     buyButtonsRow.addComponents(
                         new ButtonBuilder()
                             .setCustomId(`market_buy_${listing._id}`) // customId chứa listingId
                             .setLabel(`Mua ${listing.itemSnapshot?.name || listing.itemName.substring(0, 15)}`)
                             .setStyle(ButtonStyle.Success)
                             .setEmoji('🛒')
                     );
                 });
                 components.push(buyButtonsRow);
            }*/


            return { embeds: [embed], components, currentPage: page, totalPages };
        };

        const generatePaginationButtons = (currentPage, totalPages, prefix) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${prefix}prev_${currentPage}`)
                    .setLabel('◀️ Trang Trước')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId(`${prefix}next_${currentPage}`)
                    .setLabel('Trang Sau ▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages)
            );
        };

        // Hiển thị lần đầu
        const initialData = await generateMarketEmbedAndButtons(requestedPage);
        const message = await interaction.editReply(initialData);

        // Collector cho các nút phân trang và mua
        const collector = message.createMessageComponentCollector({
            filter: i => i.customId.startsWith('market_view_') || i.customId.startsWith('market_buy_'),
            time: 5 * 60 * 1000 // 5 phút
        });

        collector.on('collect', async i => {
            if (i.customId.startsWith('market_view_')) { // Xử lý phân trang
                await i.deferUpdate();
                const action = i.customId.split('_')[2];
                let currentPage = parseInt(i.customId.split('_')[3]);
        
                if (action === 'prev') currentPage--;
                if (action === 'next') currentPage++;
        
                const newData = await generateMarketEmbedAndButtons(currentPage);
                await i.editReply(newData);
        
            } else if (i.customId.startsWith('market_buy_')) { // Xử lý nút mua
                const listingId = i.customId.split('_')[2];
                const listing = await MarketListing.findOne({ _id: listingId, guildId, status: 'active' });
        
                if (!listing) {
                    return i.reply({ content: '❌ Tin đăng này không còn tồn tại hoặc đã được bán.', ephemeral: true });
                }
                if (listing.sellerId === i.user.id) {
                    return i.reply({ content: '❌ Bạn không thể tự mua vật phẩm của chính mình.', ephemeral: true });
                }
        
                const session = await mongoose.startSession();
                session.startTransaction();
        
                try {
                    const buyerData = await User.findOne({ userId: i.user.id, guildId }).session(session);
                    const sellerData = await User.findOne({ userId: listing.sellerId, guildId }).session(session);
        
                    if (!buyerData) throw new Error('Không tìm thấy dữ liệu người mua.');
                    if (!sellerData) throw new Error('Không tìm thấy dữ liệu người bán.');
        
                    const totalPrice = listing.price * listing.quantity;
                    if (buyerData.balance < totalPrice) {
                        throw new Error(`Bạn không đủ tiền. Cần **${totalPrice.toLocaleString()} VNĐ**, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`);
                    }
        
                    // Thực hiện giao dịch
                    buyerData.balance -= totalPrice;
                    sellerData.balance += totalPrice;
        
                    // Cập nhật inventory người mua
                    const buyerCurrentItemQty = buyerData.inventory.get(listing.itemId) || 0;
                    buyerData.inventory.set(listing.itemId, buyerCurrentItemQty + listing.quantity);
                    buyerData.markModified('inventory');
        
                    // Xóa tin đăng
                    await MarketListing.deleteOne({ _id: listing._id }).session(session);
        
                    await buyerData.save({ session });
                    await sellerData.save({ session });
                    await session.commitTransaction();
        
                    await i.reply({
                        content: `✅ Đã mua thành công **${listing.quantity}x ${listing.itemName}** với giá **${totalPrice.toLocaleString()} VNĐ**!`,
                        ephemeral: true
                    });
                } catch (error) {
                    await session.abortTransaction();
                    Logger.error(`Lỗi khi xử lý mua hàng từ nút market-buy: ${error.message}`);
                    await i.reply({ content: `❌ Lỗi khi mua vật phẩm: ${error.message}`, ephemeral: true });
                } finally {
                    await session.endSession();
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason !== 'messageDelete') {
                const finalData = await generateMarketEmbedAndButtons(initialData.currentPage || 1);
                const disabledComponents = finalData.components.map(row => {
                    row.components.forEach(button => button.setDisabled(true));
                    return row;
                });
                 try {
                    await message.edit({ components: disabledComponents });
                } catch (error) {
                    Logger.warn(`Could not edit market message on collector end: ${error.message}`);
                }
            }
        });
    }
};