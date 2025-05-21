const mongoose = require("mongoose");
const { Schema } = mongoose;

// Định nghĩa các độ hiếm có thể có
const RarityEnum = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

const carModelSchema = new Schema(
  {
    modelId: {
      // ID định danh duy nhất cho mẫu xe, ví dụ: 'sedan_basic', 'hypercar_x1'
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // Đảm bảo ID luôn là chữ thường
      // index: true,
    },
    name: {
      // Tên hiển thị cho người dùng, ví dụ: "Sedan Cơ Bản", "HyperCar X1"
      type: String,
      required: true,
      trim: true,
    },
    description: {
      // Mô tả ngắn gọn, câu chuyện hoặc flavor text
      type: String,
      default: "Một chiếc xe thú vị.",
    },
    brand: {
      // Hãng xe (tên thật hoặc tên chế)
      type: String,
      trim: true,
      default: "Chưa rõ hãng",
    },
    rarity: {
      // Độ hiếm của xe
      type: String,
      required: true,
      enum: RarityEnum, // Chỉ cho phép các giá trị trong RarityEnum
      index: true,
    },
    baseStats: {
      // Các chỉ số gốc của xe khi chưa nâng cấp
      speed: { type: Number, required: true, default: 50 }, // Tốc độ tối đa
      acceleration: { type: Number, required: true, default: 5 }, // Khả năng tăng tốc
      handling: { type: Number, required: true, default: 5 }, // Khả năng xử lý, vào cua
      durability: { type: Number, required: true, default: 100 }, // Độ bền (có thể dùng cho đua xe hoặc bảo dưỡng)
      // Thêm các chỉ số khác nếu cần (ví dụ: nitroCapacity, weight,...)
    },
    imageUrl: {
      // URL hình ảnh của mẫu xe (tùy chọn)
      type: String,
      trim: true,
      default: null,
    },
    gachaWeight: {
      // "Trọng số" xác suất xuất hiện trong Gacha (số càng cao càng dễ ra)
      type: Number,
      required: true,
      min: 1, // Phải là số dương
    },
    castrolValue: {
      type: Number,
      required: true,
      default: 1, // Mặc định là 1, bạn nên đặt giá trị dựa trên độ hiếm
      min: 1,
    },
  },
  { timestamps: true },
); // Thêm createdAt và updatedAt tự động
// carModelSchema.index({ modelId: 1 });
module.exports = mongoose.model("CarModel", carModelSchema);
