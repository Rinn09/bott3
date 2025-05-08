const mongoose = require('mongoose');
const { Schema } = mongoose;

const marketTransactionSchema = new Schema({
    guildId: { type: String, required: true, index: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'MarketListing', index: true }, // ID của tin đăng gốc (có thể null nếu tin đăng bị xóa)
    itemId: { type: String, required: true, index: true },
    itemName: { type: String, required: true }, // Tên vật phẩm tại thời điểm giao dịch
    quantity: { type: Number, required: true },
    pricePerItem: { type: Number, required: true }, // Giá mỗi đơn vị tại thời điểm giao dịch
    totalPrice: { type: Number, required: true }, // Tổng giá trị giao dịch (quantity * pricePerItem)
    taxAmount: { type: Number, default: 0 }, // Số tiền thuế đã thu (nếu có)
    buyerId: { type: String, required: true, index: true },
    buyerUsername: { type: String }, // Username người mua tại thời điểm giao dịch
    sellerId: { type: String, required: true, index: true },
    sellerUsername: { type: String }, // Username người bán tại thời điểm giao dịch
    transactionTime: { type: Date, default: Date.now, index: true },
});

// Index để tối ưu query lịch sử theo người dùng
marketTransactionSchema.index({ guildId: 1, buyerId: 1, transactionTime: -1 });
marketTransactionSchema.index({ guildId: 1, sellerId: 1, transactionTime: -1 });

module.exports = mongoose.model('MarketTransaction', marketTransactionSchema);