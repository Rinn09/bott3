const mongoose = require("mongoose");
const { Schema } = mongoose;

const NpcRacerSchema = new Schema(
  {
    npcId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    bio: { type: String, default: "Một tay đua bí ẩn." },
    avatarUrl: { type: String, default: null },
    preferredCarModelIds: [{ type: String }], // Mảng các modelId từ CarModel
    baseSkillLevel: { type: Number, default: 50, min: 1, max: 100 }, // thang điểm 1-100
    raceStats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      specialMoveFrequency: { type: Number, default: 0.1, min: 0, max: 1 }, // Tần suất dùng skill đặc biệt (nếu có)
    },
    dialogues: {
      preRace: [String],
      postWin: [String],
      postLoss: [String],
    },
    personalityTraits: [String], // Ví dụ: ['aggressive', 'plays_safe_when_leading']
  },
  { timestamps: true },
);

module.exports = mongoose.model("NPCRacer", NpcRacerSchema);
