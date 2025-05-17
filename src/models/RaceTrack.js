const mongoose = require("mongoose");
const { Schema } = mongoose;

const RaceTrackSchema = new Schema(
  {
    trackId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    lengthText: { type: String, default: "Trung bình" }, // Mô tả độ dài (ngắn, trung bình, dài)
    trackType: {
      type: String,
      enum: ["circuit", "drag", "sprint", "drift", "offroad"],
      default: "circuit",
    }, // Loại đường đua
    difficultyRating: { type: Number, min: 1, max: 5, default: 3 }, // Độ khó của track 1-5 sao
    // Ảnh hưởng của thời tiết (ví dụ: giảm handling, giảm speed)
    possibleWeather: [
      {
        weatherType: {
          type: String,
          enum: ["sunny", "rainy", "stormy", "snowy", "foggy"],
        },
        effectDescription: String, // Mô tả ảnh hưởng
        statModifiers: {
          // Các thay đổi % lên chỉ số xe
          handlingMultiplier: { type: Number, default: 1 }, // Mưa: 0.9 (giảm 10%)
          speedMultiplier: { type: Number, default: 1 },
          // Thêm các modifiers khác nếu cần
        },
        occurrenceWeight: { type: Number, default: 10 }, // Trọng số xuất hiện của thời tiết này
      },
    ],
    baseRewards: {
      // Phần thưởng cơ bản khi hoàn thành/thắng trên track này (chưa tính giải đấu)
      vnđ: { type: Number, default: 1000 },
      xp: { type: Number, default: 10 },
    },
    trackImageUrl: { type: String }, // Ảnh minh họa đường đua
  },
  { timestamps: true },
);

module.exports = mongoose.model("RaceTrack", RaceTrackSchema);
