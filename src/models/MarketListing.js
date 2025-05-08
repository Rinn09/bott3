const mongoose = require('mongoose');

const marketListingSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true }, // THÊM DÒNG NÀY
    sellerId: { type: String, required: true, index: true },
    sellerUsername: { type: String, required: true },
    itemId: { type: String, required: true, index: true }, // ID từ ShopItem
    itemName: { type: String, required: true, index: true }, // Để tìm kiếm dễ hơn
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // Giá cho mỗi đơn vị (đã đúng trong code của bạn là pricePerItem)
    listedAt: { type: Date, default: Date.now, index: true },
    status: {
        type: String,
        enum: ['active', 'sold', 'cancelled', 'expired'],
        default: 'active',
        index: true
    },
    itemSnapshot: {
        name: String,
        description: String,
        // Thêm các thuộc tính khác của vật phẩm bạn muốn lưu lại
    }
});

marketListingSchema.index({ itemName: 'text' });
marketListingSchema.index({ guildId: 1, status: 1, listedAt: -1 }); // Index tối ưu cho lệnh market-view

module.exports = mongoose.model('MarketListing', marketListingSchema);