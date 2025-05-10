// src/models/ShopItem.js
const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  description: { type: String, default: 'Một vật phẩm hữu ích.' },
  buyPrice: { type: Number, default: null }, // Giá mua từ shop
  sellPrice: { type: Number, default: null }, // Giá bán lại cho shop (null nếu không thể bán)
  requiredJob: { type: [String], default: null },
  requiredLevel: { type: Number, default: 0 },
  effects: {
    cooldownReduction: {
      targetTaskId: { type: [String] },
      reductionTime: { type: Number }
    }
  },
  consumable: { type: Boolean, default: true },
  marketable: { type: Boolean, default: true }, // << THÊM: Có thể bán trên chợ không?
  dailyBuyLimit: { type: Number, default: null } // << THÊM: Giới hạn mua mỗi ngày
});

module.exports = mongoose.model('ShopItem', shopItemSchema);