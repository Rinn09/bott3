const mongoose = require("mongoose");
const { Schema } = mongoose;

// Định nghĩa các độ hiếm (có thể dùng lại RarityEnum từ CarModel nếu muốn)
const RarityEnum = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];
// Định nghĩa các loại phụ tùng
const PartTypeEnum = [
  "engine",
  "tires",
  "ecu",
  "nitro",
  "chassis",
  "bodykit",
  "brakes",
  "suspension",
  "exhaust",
  "transmission",
  "cooling",
  "forced_induction",
]; // Thêm các loại khác nếu cần

const partDefinitionSchema = new Schema(
  {
    partId: {
      // ID định danh duy nhất cho phụ tùng, ví dụ: 'engine_v6_mk1', 'tires_sport_r'
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      // Tên hiển thị, ví dụ: "Động cơ V6 Mk.1", "Lốp Thể Thao R"
      type: String,
      required: true,
      trim: true,
    },
    description: {
      // Mô tả
      type: String,
      default: "Một phụ tùng hữu ích.",
    },
    rarity: {
      // Độ hiếm
      type: String,
      required: true,
      enum: RarityEnum,
      index: true,
    },
    partType: {
      // Loại phụ tùng (quan trọng để biết lắp vào đâu)
      type: String,
      required: true,
      enum: PartTypeEnum,
      index: true,
    },
    statModifiers: {
      // Chỉ số mà phụ tùng này CỘNG THÊM vào chỉ số gốc của xe
      speed: { type: Number, default: 0 },
      acceleration: { type: Number, default: 0 },
      handling: { type: Number, default: 0 },
      durability: { type: Number, default: 0 },
      // Thêm các chỉ số khác nếu phụ tùng có ảnh hưởng
    },
    imageUrl: {
      // URL hình ảnh phụ tùng (tùy chọn)
      type: String,
      trim: true,
      default: null,
    },
    gachaWeight: {
      // "Trọng số" xác suất xuất hiện trong Gacha
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PartDefinition", partDefinitionSchema);
