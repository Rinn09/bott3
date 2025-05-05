// src/models/ShopItem.js
const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true }, // ID định danh vật phẩm (vd: 'hat_giong_lua', 'cuoc_sat')
  name: { type: String, required: true }, // Tên hiển thị
  description: { type: String, default: 'Một vật phẩm hữu ích.' },
  buyPrice: { type: Number, default: null }, // Giá mua từ shop (null nếu không thể mua)
  sellPrice: { type: Number, default: null }, // Giá bán lại cho shop (null nếu không thể bán)
  requiredJob: { type: String, default: null }, // Nghề yêu cầu để mua/sử dụng (vd: 'Nông dân')
  requiredLevel: { type: Number, default: 0 }, // Level nghề yêu cầu
  // Thêm các thuộc tính khác nếu cần (vd: độ bền, hiệu ứng...)
});

module.exports = mongoose.model('ShopItem', shopItemSchema);