// src/models/ShopItem.js
const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true }, // vd: 'phan_bon', 'hat_giong_lua'...
  name: { type: String, required: true },
  description: { type: String, default: 'Một vật phẩm hữu ích.' },
  buyPrice: { type: Number, default: null },
  sellPrice: { type: Number, default: null },
  requiredJob: { type: [String], default: null }, // Nghề yêu cầu để mua/sử dụng
  requiredLevel: { type: Number, default: 0 }, // Level nghề yêu cầu

  // --- THÊM CÁC TRƯỜNG MỚI ---
  effects: { // Lưu các hiệu ứng của vật phẩm
    cooldownReduction: { // Hiệu ứng giảm cooldown
      targetTaskId: { type: [String] }, // Cho phép mảng các taskId (vd: ['thuHoach', 'gieoHat'])
      reductionTime: { type: Number } // Thời gian giảm (tính bằng mili giây)
      // Có thể thêm các hiệu ứng khác ở đây sau này
    }
    // Ví dụ: effect: { xpBoost: { percentage: 10, duration: 3600000 } }
  },
  consumable: { type: Boolean, default: true } // Vật phẩm có bị tiêu hao sau khi dùng không?
});

module.exports = mongoose.model('ShopItem', shopItemSchema);