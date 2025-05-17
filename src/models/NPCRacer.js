const mongoose = require("mongoose");
const { Schema } = mongoose;

const NPCRacerSchema = new Schema(
  {
    npcId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "Một tay đua bí ẩn." },
    carModelId: { type: String, required: true, ref: "CarModel" }, // Tham chiếu đến CarModel
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert", "nightmare"],
      default: "medium",
    },
    // Chỉ số này sẽ override baseStats của CarModel nếu được cung cấp
    // Nếu không, NPC sẽ dùng baseStats từ CarModel đó
    baseStatsOverride: {
      speed: { type: Number },
      acceleration: { type: Number },
      handling: { type: Number },
      durability: { type: Number },
    },
    // Lời thoại của NPC
    dialogues: {
      startRace: [{ type: String }], // Mảng các câu thoại khi bắt đầu
      winRace: [{ type: String }], // Khi NPC thắng
      loseRace: [{ type: String }], // Khi NPC thua
    },
    // Phần thưởng khi thắng NPC này (ngoài phần thưởng của giải/track)
    winBonus: {
      vnđ: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
      items: [
        {
          // Ví dụ: { itemId: String, quantity: Number, type: 'part_definition' | 'shop_item' }
          itemId: String,
          quantity: Number,
          itemType: { type: String, enum: ["part_definition", "shop_item"] },
        },
      ],
    },
    // Yêu cầu để người chơi có thể đua với NPC này (nếu đua lẻ)
    requirements: {
      minPlayerLevel: { type: Number, default: 1 },
      minCarRarity: {
        type: String,
        enum: [
          null,
          "common",
          "uncommon",
          "rare",
          "epic",
          "legendary",
          "mythic",
        ],
        default: null,
      },
      // Thêm các yêu cầu khác nếu cần
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NPCRacer", NPCRacerSchema);
