const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.buttons = new Map();
  client.selectMenus = new Map();

  // Load Buttons
  const buttonPath = path.join(__dirname, '../interactions/buttons');
  fs.readdirSync(buttonPath).forEach(file => {
    const button = require(`${buttonPath}/${file}`);
    client.buttons.set(button.customId, button);
  });

  // Load Select Menus
  const selectPath = path.join(__dirname, '../interactions/selects');
  fs.readdirSync(selectPath).forEach(file => {
    const menu = require(`${selectPath}/${file}`);
    client.selectMenus.set(menu.customId, menu);
  });

  // Event
  client.on('interactionCreate', async (interaction) => {
    console.log(`[INTERACTION] ${interaction.customId} | ${interaction.user.tag}`);

    if (interaction.isModalSubmit()) {
        const customId = interaction.customId;
        if (customId.startsWith('market_buy_modal_')) {
            await interaction.deferReply({ ephemeral: true });
            const listingId = customId.split('_')[3];
            const buyerId = interaction.user.id;
            const guildId = interaction.guild.id;

            const quantityToBuyStr = interaction.fields.getTextInputValue('buy_quantity');
            const quantityToBuy = parseInt(quantityToBuyStr);

            if (isNaN(quantityToBuy) || quantityToBuy <= 0) {
                return interaction.editReply({ content: '❌ Số lượng mua không hợp lệ.' });
            }

            const session = await mongoose.startSession();
            session.startTransaction();
            let success = false;
            let boughtItemName = 'Vật phẩm';
            let boughtQuantity = 0;
            let totalPrice = 0;

            try {
                const listing = await MarketListing.findById(listingId).session(session);
                if (!listing || listing.status !== 'active' || listing.guildId !== guildId) {
                    throw new Error('Tin đăng không còn tồn tại hoặc đã được bán.');
                }
                if (listing.sellerId === buyerId) {
                    throw new Error('Bạn không thể tự mua vật phẩm của mình.');
                }
                if (listing.quantity < quantityToBuy) {
                    throw new Error(`Số lượng \`${listing.itemName}\` trên chợ không đủ (Chỉ còn ${listing.quantity}).`);
                }

                boughtItemName = listing.itemSnapshot?.name || listing.itemName;
                boughtQuantity = quantityToBuy;
                totalPrice = listing.pricePerItem * quantityToBuy;

                const buyerData = await User.findOne({ userId: buyerId, guildId }).session(session);
                const sellerData = await User.findOne({ userId: listing.sellerId, guildId }).session(session);

                if (!buyerData) throw new Error('Không tìm thấy dữ liệu người mua.');
                if (!sellerData) throw new Error('Không tìm thấy dữ liệu người bán (có thể người bán đã rời server).'); // Hoặc xử lý khác

                if (buyerData.balance < totalPrice) {
                    throw new Error(`Bạn không đủ ${totalPrice.toLocaleString()} VNĐ để mua. Số dư của bạn: ${buyerData.balance.toLocaleString()} VNĐ.`);
                }

                // Thực hiện giao dịch
                buyerData.balance -= totalPrice;
                sellerData.balance += totalPrice; // TODO: Có thể thêm thuế chợ ở đây

                // Cập nhật inventory người mua
                const buyerCurrentItemQty = buyerData.inventory.get(listing.itemId) || 0;
                buyerData.inventory.set(listing.itemId, buyerCurrentItemQty + quantityToBuy);
                buyerData.markModified('inventory');

                // Cập nhật tin đăng
                listing.quantity -= quantityToBuy;
                if (listing.quantity <= 0) {
                    listing.status = 'sold';
                }

                await buyerData.save({ session });
                await sellerData.save({ session });
                await listing.save({ session });

                await session.commitTransaction();
                success = true;

                // Gửi DM cho người bán (tùy chọn)
                try {
                    const sellerUser = await client.users.fetch(listing.sellerId);
                    if (sellerUser) {
                        sellerUser.send(` Chợ: Vật phẩm **${boughtQuantity} ${boughtItemName}** của bạn đã được ${interaction.user.username} mua với giá ${totalPrice.toLocaleString()} VNĐ!`).catch(dmError => {
                            Logger.warn(`Could not DM seller ${listing.sellerId} about market sale: ${dmError.message}`);
                        });
                    }
                } catch (fetchError) {
                     Logger.warn(`Could not fetch seller ${listing.sellerId} to DM about market sale: ${fetchError.message}`);
                }

            } catch (error) {
                await session.abortTransaction();
                Logger.error(`Error processing market buy modal (Listing: ${listingId}, Buyer: ${buyerId}):`, error);
                await interaction.editReply({ content: `❌ Lỗi khi mua vật phẩm: ${error.message}` });
            } finally {
                await session.endSession();
            }

            if (success) {
                await interaction.editReply({
                    content: `✅ Bạn đã mua thành công **${boughtQuantity} ${boughtItemName}** với giá **${totalPrice.toLocaleString()} VNĐ**!`,
                    embeds: [] // Xóa embed nếu có
                });
            }
            return; // Đã xử lý modal
        }
    }
    
    try {
      if (interaction.isButton()) {
        console.log('Button Clicked:', interaction.customId);
        const handler = client.buttons.get(interaction.customId);
        if (handler) await handler.execute(interaction);
        
      }

      if (interaction.isStringSelectMenu()) {
        const handler = client.selectMenus.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      }
    } catch (err) {
      console.error('[Interaction Error]', err);
      if (interaction.deferred || interaction.replied) {
        interaction.followUp({ content: '❌ Đã xảy ra lỗi.', ephemeral: true });
      } else {
        interaction.reply({ content: '❌ Đã xảy ra lỗi.', ephemeral: true });
      }
    }
  });
};
