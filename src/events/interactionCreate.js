const { InteractionType } = require('discord.js');
const Logger = require('../utils/logger');
const User = require('../models/User');
const MarketListing = require('../models/MarketListing');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Xử lý modal submit cho market buy
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('market_buy_modal_')) {
            try {
                const listingId = interaction.customId.split('_')[3];
                const buyQuantity = parseInt(interaction.fields.getTextInputValue('buy_quantity'));
                
                // Kiểm tra số lượng hợp lệ
                if (isNaN(buyQuantity) || buyQuantity < 1) {
                    return interaction.reply({
                        content: '❌ Số lượng không hợp lệ!',
                        ephemeral: true
                    });
                }

                const listing = await MarketListing.findOne({ 
                    _id: listingId,
                    status: 'active'
                });

                if (!listing) {
                    return interaction.reply({
                        content: '❌ Vật phẩm này không còn tồn tại hoặc đã được bán!',
                        ephemeral: true
                    });
                }

                if (buyQuantity > listing.quantity) {
                    return interaction.reply({
                        content: '❌ Số lượng muốn mua vượt quá số lượng có sẵn!',
                        ephemeral: true
                    });
                }

                // Kiểm tra số dư người mua
                const buyer = await User.findOne({ userId: interaction.user.id });
                const totalCost = buyQuantity * listing.price;

                if (!buyer || buyer.money < totalCost) {
                    return interaction.reply({
                        content: '❌ Bạn không có đủ tiền để mua vật phẩm này!',
                        ephemeral: true
                    });
                }

                // TODO: Thực hiện giao dịch
                // Cập nhật số dư người mua và người bán
                // Chuyển vật phẩm từ người bán sang người mua
                // Cập nhật trạng thái listing nếu bán hết

                await interaction.reply({
                    content: `✅ Đã mua thành công ${buyQuantity}x ${listing.itemName} với giá ${totalCost.toLocaleString()} VNĐ!`,
                    ephemeral: true
                });

            } catch (error) {
                Logger.error('Lỗi khi xử lý market buy modal:', error);
                await interaction.reply({
                    content: '❌ Đã xảy ra lỗi khi xử lý giao dịch!',
                    ephemeral: true
                });
            }
        }
    }
};