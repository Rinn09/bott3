const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MarketListing = require('../../models/MarketListing');
const User = require('../../models/User');
const Logger = require('../../utils/logger');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-unlist')
        .setDescription('Hủy một tin đăng bán vật phẩm của bạn trên chợ.')
        .addStringOption(option =>
            option.setName('listing_id')
                .setDescription('ID của tin đăng bạn muốn hủy (xem ID khi đăng hoặc trong /market-view của bạn)')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const listingId = interaction.options.getString('listing_id');

        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return interaction.reply({ content: '❌ ID tin đăng không hợp lệ.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: false });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const listing = await MarketListing.findById(listingId).session(session);

            if (!listing) {
                throw new Error('Tin đăng không tồn tại.');
            }
            if (listing.guildId !== guildId) {
                throw new Error('Tin đăng này không thuộc server hiện tại hoặc bạn không có quyền truy cập.');
            }
            if (listing.sellerId !== userId) {
                throw new Error('Bạn không phải là người đã đăng tin này nên không thể hủy nó.');
            }
            if (listing.status !== 'active') {
                throw new Error(`Tin đăng này không ở trạng thái "active" (trạng thái hiện tại: ${listing.status}), không thể hủy theo cách này.`);
            }

            const userData = await User.findOne({ userId, guildId }).session(session);
            if (!userData) {
                // Hiếm khi xảy ra nếu người dùng có thể đăng tin
                throw new Error('Không tìm thấy dữ liệu người dùng của bạn.');
            }

            // Hoàn trả vật phẩm vào inventory của người dùng
            const itemId = listing.itemId;
            const quantityToReturn = listing.quantity;
            const itemName = listing.itemSnapshot?.name || listing.itemName;

            const currentItemQtyInInventory = userData.inventory.get(itemId) || 0;
            userData.inventory.set(itemId, currentItemQtyInInventory + quantityToReturn);
            userData.markModified('inventory');
            await userData.save({ session });

            // Xóa tin đăng khỏi chợ
            await MarketListing.deleteOne({ _id: listing._id }).session(session);
            // Hoặc, nếu bạn muốn giữ lại và chỉ đổi status:
            // listing.status = 'cancelled';
            // await listing.save({ session });


            await session.commitTransaction();

            const successEmbed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('🗑️ Hủy Tin Đăng Thành Công!')
                .setDescription(`Bạn đã hủy thành công tin đăng bán **${quantityToReturn} ${itemName}**.`)
                .addFields(
                    { name: '📦 Vật phẩm đã hoàn trả', value: `${quantityToReturn} ${itemName} đã được trả lại vào túi đồ của bạn.` },
                    { name: '🧾 ID Tin đăng đã hủy', value: `\`${listingId}\`` }
                )
                .setTimestamp()
                .setFooter({ text: `Yêu cầu bởi: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });
            Logger.info(`[Market-Unlist] User ${userId} unlisted item ${listingId}. Returned ${quantityToReturn} of ${itemId} (${itemName}).`);

        } catch (error) {
            await session.abortTransaction();
            Logger.error(`Lỗi lệnh /market-unlist (Listing: ${listingId}, User: ${userId}): ${error.message}`, { stack: error.stack });
            await interaction.editReply({ content: `❌ Lỗi khi hủy tin đăng: ${error.message}` });
        } finally {
            await session.endSession();
        }
    }
};