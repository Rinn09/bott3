const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const MarketListing = require('../../models/MarketListing');
const User = require('../../models/User');
const MarketTransaction = require('../../models/MarketTransaction');
const Logger = require('../../utils/logger');
const mongoose = require('mongoose');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-buy')
        .setDescription('Mua một vật phẩm từ chợ.')
        .addStringOption(option =>
            option.setName('listing_id')
                .setDescription('ID của tin đăng bạn muốn mua (lấy từ /market hoặc /market-search)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('Số lượng muốn mua (mặc định là toàn bộ số lượng của tin đăng)')
                .setMinValue(1)
                .setRequired(false)), // Để false, nếu không nhập thì mặc định mua hết

    async execute(interaction) {
        const buyerId = interaction.user.id;
        const guildId = interaction.guild.id;
        const listingId = interaction.options.getString('listing_id');
        let quantityToBuy = interaction.options.getInteger('quantity');

        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return interaction.reply({ content: '❌ ID tin đăng không hợp lệ.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: false }); // Hiển thị cho mọi người nếu giao dịch thành công

        const session = await mongoose.startSession();
        session.startTransaction();

        let boughtItemName = 'Vật phẩm không xác định';
        let actualBoughtQuantity = 0;
        let totalPrice = 0;
        let sellerIdForDM = null;

        try {
            const listing = await MarketListing.findById(listingId).session(session);

            if (!listing) {
                throw new Error('Tin đăng không tồn tại.');
            }
            if (listing.guildId !== guildId) {
                throw new Error('Tin đăng này không thuộc server hiện tại.');
            }
            if (listing.status !== 'active') {
                throw new Error(`Tin đăng này không còn hoạt động (trạng thái: ${listing.status}).`);
            }
            if (listing.sellerId === buyerId) {
                throw new Error('Bạn không thể tự mua vật phẩm của chính mình.');
            }

            // Nếu quantityToBuy không được cung cấp, mặc định là mua toàn bộ số lượng còn lại của tin đăng
            if (quantityToBuy === null || quantityToBuy === undefined) {
                quantityToBuy = listing.quantity;
            }

            if (quantityToBuy <= 0) {
                throw new Error('Số lượng mua phải lớn hơn 0.');
            }
            if (listing.quantity < quantityToBuy) {
                throw new Error(`Số lượng vật phẩm trên chợ không đủ. Tin đăng chỉ còn ${listing.quantity} ${listing.itemSnapshot?.name || listing.itemName}.`);
            }

            boughtItemName = listing.itemSnapshot?.name || listing.itemName;
            actualBoughtQuantity = quantityToBuy;
            totalPrice = listing.price * actualBoughtQuantity; // listing.price là giá mỗi đơn vị
            sellerIdForDM = listing.sellerId;

            const buyerData = await User.findOne({ userId: buyerId, guildId }).session(session);
            const sellerData = await User.findOne({ userId: listing.sellerId, guildId }).session(session);

            if (!buyerData) {
                // Nếu người mua chưa có dữ liệu, tạo mới (hiếm khi xảy ra với bot có hệ thống kinh tế)
                // Hoặc throw error nếu bạn yêu cầu người dùng phải có tài khoản trước
                throw new Error('Không tìm thấy dữ liệu người mua. Hãy thử tương tác với bot để tạo tài khoản.');
            }
            if (!sellerData) {
                // Người bán có thể đã rời server hoặc dữ liệu bị lỗi
                // Trong trường hợp này, giao dịch không thể hoàn thành một cách an toàn
                // Hoặc bạn có thể quyết định cho phép mua nhưng tiền sẽ "biến mất" (không khuyến khích)
                listing.status = 'cancelled'; // Hủy tin đăng nếu người bán không tồn tại
                await listing.save({ session });
                throw new Error('Không tìm thấy dữ liệu người bán. Tin đăng có thể đã bị lỗi và sẽ được hủy.');
            }

            if (buyerData.balance < totalPrice) {
                throw new Error(`Bạn không đủ tiền. Cần **${totalPrice.toLocaleString()} VNĐ**, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`);
            }

            // --- Thực hiện giao dịch ---
            buyerData.balance -= totalPrice;
            buyerData.totalSpent = (buyerData.totalSpent || 0) + totalPrice;

            // Thuế chợ (ví dụ 5%)
            const marketTaxRate = 0.07; // 7%
            const taxAmount = Math.floor(totalPrice * marketTaxRate);
            const amountToSeller = totalPrice - taxAmount;

            sellerData.balance += amountToSeller;
            sellerData.totalEarned = (sellerData.totalEarned || 0) + amountToSeller;

            // --- Cộng tiền thuế vào tài khoản BOT ---
            if (taxAmount > 0) {
                const botUserId = interaction.client.user.id; // Lấy ID của chính bot
                try {
                    // Tìm hoặc tạo tài khoản cho bot trong server này và cộng tiền thuế
                    // Sử dụng findOneAndUpdate với upsert: true để đảm bảo bot có record trong DB
                    const botUpdateResult = await User.findOneAndUpdate(
                        { userId: botUserId, guildId: guildId }, // Điều kiện tìm
                        { $inc: { balance: taxAmount, totalEarned: taxAmount } }, // Tăng balance và totalEarned
                        { upsert: true, new: true, session: session } // Tạo mới nếu chưa có, trả về bản ghi mới, chạy trong session
                    );
                     if (!botUpdateResult) {
                       // Trường hợp hiếm khi findOneAndUpdate bị lỗi dù có upsert
                       Logger.error(`[Market-Buy Tax] Failed to find or update bot's balance (User ID: ${botUserId}, Guild: ${guildId}). Tax ${taxAmount} might be lost.`);
                    } else {
                         Logger.info(`[Market-Buy Tax] Added ${taxAmount} VND tax to bot (${botUserId}) balance in guild ${guildId}. New bot balance: ${botUpdateResult.balance}`);
                    }

                } catch (botUpdateError) {
                     // Log lỗi nhưng không nên dừng transaction chính
                     Logger.error(`[Market-Buy Tax] Error updating bot's balance: ${botUpdateError.message}`, { stack: botUpdateError.stack });
                }
            }

            // Cập nhật inventory người mua
            const buyerCurrentItemQty = buyerData.inventory.get(listing.itemId) || 0;
            buyerData.inventory.set(listing.itemId, buyerCurrentItemQty + actualBoughtQuantity);
            buyerData.markModified('inventory');

            // Cập nhật tin đăng
            listing.quantity -= actualBoughtQuantity;
            if (listing.quantity <= 0) {
                await MarketListing.deleteOne({ _id: listing._id }).session(session);
            } else {
                await listing.save({ session });
                Logger.info(`[Market-Buy] Listing ${listing._id} quantity updated to ${listing.quantity}.`);
            }

            await buyerData.save({ session });
            await sellerData.save({ session });

            const transactionRecord = new MarketTransaction({
                guildId: guildId,
                listingId: listing._id, // Lưu ID của listing gốc
                itemId: listing.itemId,
                itemName: boughtItemName,
                quantity: actualBoughtQuantity,
                pricePerItem: listing.price, // Giá mỗi đơn vị
                totalPrice: totalPrice, // Tổng giá
                taxAmount: taxAmount, // Thuế đã tính
                buyerId: buyerId,
                buyerUsername: interaction.user.username, // Lấy username hiện tại của người mua
                sellerId: listing.sellerId,
                sellerUsername: sellerData.username || listing.sellerUsername, // Lấy username người bán từ User data nếu có, fallback về listing
                transactionTime: new Date() // Thời gian giao dịch
            });
            await transactionRecord.save({ session }); // Lưu vào cùng transaction
            Logger.info(`[Market-Buy] Transaction record saved for listing ${listing._id}`);
            
            await session.commitTransaction();

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🛒 Mua Hàng Thành Công!')
                .setDescription(`Bạn đã mua thành công **${actualBoughtQuantity} ${boughtItemName}** từ người bán **${listing.sellerUsername}**.`)
                .addFields(
                    { name: '💸 Tổng chi phí', value: `${totalPrice.toLocaleString()} VNĐ` },
                    { name: '💰 Tiền người bán nhận (sau thuế 5%)', value: `${amountToSeller.toLocaleString()} VNĐ`},
                    { name: '🧾 ID Tin đăng', value: `\`${listingId}\`` }
                )
                .setTimestamp()
                .setFooter({ text: `Người mua: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Gửi DM cho người bán
            if (sellerIdForDM) {
                try {
                    const sellerUser = await interaction.client.users.fetch(sellerIdForDM);
                    if (sellerUser) {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('Blue')
                            .setTitle('🔔 Thông Báo Chợ: Vật Phẩm Đã Bán!')
                            .setDescription(`Vật phẩm của bạn đã được bán trên chợ.`)
                            .addFields(
                                { name: '🛍️ Vật phẩm', value: `${actualBoughtQuantity} ${boughtItemName}` },
                                { name: '👤 Người mua', value: `${interaction.user.tag} (\`${buyerId}\`)` },
                                { name: '💰 Số tiền bạn nhận (sau thuế 5%)', value: `${amountToSeller.toLocaleString()} VNĐ` },
                                { name: '🧾 ID Tin đăng', value: `\`${listingId}\`` }
                            )
                            .setTimestamp()
                            .setFooter({text: `Server: ${interaction.guild.name}`});
                        await sellerUser.send({ embeds: [dmEmbed] });
                    }
                } catch (dmError) {
                    Logger.warn(`[Market-Buy] Không thể gửi DM cho người bán ${sellerIdForDM}: ${dmError.message}`);
                }
            }

            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (guildConfig && guildConfig.marketNotificationChannelId) {
                const marketNotiChannel = await interaction.client.channels.fetch(guildConfig.marketNotificationChannelId).catch(() => null);
                if (marketNotiChannel && marketNotiChannel.isTextBased()) {
                    const marketNotiEmbed = new EmbedBuilder()
                        .setColor('Purple') // Màu khác để phân biệt với DM hoặc reply
                        .setTitle('📈 Giao Dịch Chợ Mới')
                        .setDescription(`Một giao dịch vừa được thực hiện trên chợ của server!`)
                        .addFields(
                            { name: '🛍️ Vật phẩm', value: `${actualBoughtQuantity} ${boughtItemName}` },
                            { name: '👤 Người mua', value: `${interaction.user.tag} (\`${buyerId}\`)` },
                            { name: '💰 Người bán', value: `${listing.sellerUsername} (\`${listing.sellerId}\`)` },
                            { name: '💸 Giá trị giao dịch', value: `${totalPrice.toLocaleString()} VNĐ` },
                            { name: '🧾 ID Tin đăng', value: `\`${listingId}\`` }
                        )
                        .setTimestamp()
                        .setFooter({ text: `Server: ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() });
                    
                    await marketNotiChannel.send({ embeds: [marketNotiEmbed] });
                } else if (marketNotiChannel === null) {
                    Logger.warn(`[Market-Buy] Market notification channel ID ${guildConfig.marketNotificationChannelId} not found for guild ${interaction.guild.id}.`);
                }
            }

        } catch (error) {
            await session.abortTransaction();
            Logger.error(`Lỗi lệnh /market-buy (Listing: ${listingId}, Buyer: ${buyerId}): ${error.message}`, { stack: error.stack });
            await interaction.editReply({ content: `❌ Lỗi khi mua vật phẩm: ${error.message}` });
        } finally {
            await session.endSession();
        }
    }
};