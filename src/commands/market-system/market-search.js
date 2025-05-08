const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MarketListing = require('../../models/MarketListing');
const Logger = require('../../utils/logger');

const ITEMS_PER_PAGE = 5; // Số vật phẩm mỗi trang, giống market-view.js

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-search')
        .setDescription('Tìm kiếm vật phẩm trên chợ theo tên.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Tên vật phẩm bạn muốn tìm kiếm')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Số trang muốn xem (mặc định là 1)')
                .setMinValue(1)
                .setRequired(false)),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const searchQuery = interaction.options.getString('query');
        let requestedPage = interaction.options.getInteger('page') || 1;

        await interaction.deferReply({ ephemeral: false });

        const generateSearchResultsEmbedAndButtons = async (page, query) => {
            const mongoQuery = {
                guildId,
                status: 'active',
                // Sử dụng $regex để tìm kiếm không phân biệt chữ hoa/thường và khớp một phần
                // Hoặc nếu bạn đã cấu hình text index trên MongoDB cho itemName:
                // $text: { $search: query }
                // Để đơn giản và không yêu cầu cấu hình text index phức tạp, ta dùng regex trước.
                itemName: { $regex: new RegExp(query, 'i') }
            };

            const listingsCount = await MarketListing.countDocuments(mongoQuery);
            const totalPages = Math.ceil(listingsCount / ITEMS_PER_PAGE) || 1;

            if (page > totalPages) page = totalPages;
            if (page < 1) page = 1;

            const skip = (page - 1) * ITEMS_PER_PAGE;

            const listings = await MarketListing.find(mongoQuery)
                .sort({ listedAt: -1 }) // Sắp xếp mới nhất lên đầu, hoặc theo relevancy nếu dùng $text search
                .skip(skip)
                .limit(ITEMS_PER_PAGE)
                .lean();

            const embed = new EmbedBuilder()
                .setTitle(`🔎 Kết quả tìm kiếm cho: "${query}" - Trang ${page}/${totalPages}`)
                .setColor('#2ECC71') // Màu xanh lá cây cho tìm kiếm thành công
                .setTimestamp();

            if (!listings.length && listingsCount === 0) {
                embed.setDescription(`Không tìm thấy vật phẩm nào khớp với "${query}" trên chợ.`);
                return { embeds: [embed], components: [], currentPage: page, totalPages };
            } else if (!listings.length && listingsCount > 0) {
                embed.setDescription(`Không tìm thấy vật phẩm ở trang ${page} cho tìm kiếm "${query}". Tổng số trang: ${totalPages}.`);
                 return { embeds: [embed], components: [generatePaginationButtons(page, totalPages, "market_search_")], currentPage: page, totalPages };
            }

            listings.forEach(listing => {
                embed.addFields({
                    name: `${listing.itemSnapshot?.name || listing.itemName} (x${listing.quantity}) - ID: \`${listing._id}\``,
                    value: `Người bán: ${listing.sellerUsername}\nGiá: **${listing.price.toLocaleString()} VNĐ / cái**\nĐăng lúc: <t:${Math.floor(listing.listedAt.getTime() / 1000)}:R>`,
                    inline: false
                });
            });

            const components = [generatePaginationButtons(page, totalPages, "market_search_")];
             // Chỉ thêm hàng nút mua nếu có vật phẩm và nếu bạn muốn tích hợp luôn nút mua ở đây
            // Tuy nhiên, để giữ cho lệnh search tập trung, có thể người dùng sẽ dùng /market-buy sau khi có ID
            // Nếu muốn thêm nút mua trực tiếp:
            
            /*if (listings.length > 0) {
                 const buyButtonsRow = new ActionRowBuilder();
                 listings.slice(0, 5).forEach(listing => {
                     buyButtonsRow.addComponents(
                         new ButtonBuilder()
                             .setCustomId(`market_buy_${listing._id}`) // customId cho nút mua
                             .setLabel(`Mua ${listing.itemSnapshot?.name || listing.itemName.substring(0,15)}`)
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
                    .setLabel('◀️ Trước')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId(`${prefix}next_${currentPage}`)
                    .setLabel('Sau ▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages || totalPages === 0) // Disable nếu không có trang nào
            );
        };

        // Hiển thị lần đầu
        const initialData = await generateSearchResultsEmbedAndButtons(requestedPage, searchQuery);
        const message = await interaction.editReply(initialData);

        // Collector cho các nút phân trang
        // Filter cho collector: chỉ nhận button từ người dùng đã gọi lệnh và customId bắt đầu bằng prefix của search
        const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('market_search_');
        const collector = message.createMessageComponentCollector({
            filter,
            time: 5 * 60 * 1000 // 5 phút
        });

        let currentCollectorPage = initialData.currentPage; // Biến để theo dõi trang hiện tại của collector

        collector.on('collect', async i => {
            if (i.customId.startsWith('market_search_')) { // Xử lý phân trang
                await i.deferUpdate();
                const action = i.customId.split('_')[2];
                let currentPage = parseInt(i.customId.split('_')[3]);
        
                if (action === 'prev') currentPage--;
                if (action === 'next') currentPage++;
        
                const newData = await generateSearchResultsEmbedAndButtons(currentPage, searchQuery);
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
            if (reason !== 'messageDelete') { // Không cố edit nếu tin nhắn đã bị xóa
                const finalData = await generateSearchResultsEmbedAndButtons(currentCollectorPage, searchQuery);
                const disabledComponents = finalData.components.map(row => {
                    row.components.forEach(button => button.setDisabled(true));
                    return row;
                });
                try {
                    await message.edit({ components: disabledComponents });
                } catch (error) {
                    // Logger.warn(`Could not edit market search message on collector end: ${error.message}`);
                }
            }
        });
    }
};