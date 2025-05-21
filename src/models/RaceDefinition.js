const mongoose = require("mongoose");
const { Schema } = mongoose;

const CarRequirementSchema = new Schema(
  {
    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "epic", "legendary", "mythic"],
    },
    minTotalStats: Number, // Tổng các chỉ số speed, accel, handling, dura
    allowedModelIds: [String], // Chỉ cho phép các modelId này
    bannedModelIds: [String], // Cấm các modelId này
    requiredPartTypes: [String], // Yêu cầu phải lắp loại phụ tùng nào đó (ví dụ: 'tires_sport')
  },
  { _id: false },
);

const RaceDefinitionSchema = new Schema(
  {
    tournamentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      enum: [
        "NPC_SOLO_CHALLENGE",
        "NPC_TOURNAMENT_BRACKET",
        "PLAYER_EVENT_SEASONAL",
      ],
      required: true,
    },
    difficulty: { type: Number, min: 1, max: 10, default: 5 }, // Thang điểm độ khó
    npcOpponentIds: [{ type: String }], // Mảng các npcId từ NpcRacerSchema
    entryFee: { type: Number, default: 0, min: 0 },
    carRequirements: CarRequirementSchema,
    trackInfo: {
      name: { type: String, default: "Đường đua không tên" },
      lengthKm: Number, // Độ dài đường đua (km), có thể dùng để tính độ bền hao hụt
      defaultWeather: {
        type: String,
        enum: ["sunny", "rainy", "snowy", "windy"],
        default: "sunny",
      },
    },
    rewards: {
      vnd: { min: Number, max: Number },
      xp: { min: Number, max: Number },
      itemDrops: [
        {
          // Phần thưởng vật phẩm
          itemId: String, // itemId từ ShopItem hoặc partId từ PartDefinition
          itemType: {
            type: String,
            enum: ["shop_item", "part_instance_definition"],
          }, // Để biết là vật phẩm hay định nghĩa phụ tùng
          dropChance: Number, // 0.0 to 1.0
          quantity: { type: Number, default: 1 },
        },
      ],
      blueprintDrops: [
        {
          // Mảnh ghép xe/phụ tùng
          blueprintFor: String, // modelId hoặc partId
          type: { type: String, enum: ["car", "part"] },
          dropChance: Number,
          quantityMin: Number,
          quantityMax: Number,
        },
      ],
    },
    cooldownHours: { type: Number, default: 0 }, // Thời gian chờ để tham gia lại (tính bằng giờ)
    availability: {
      startTime: Date,
      endTime: Date,
      daysOfWeek: [Number], // 0 = Sunday, 6 = Saturday
    },
    requiredLevel: { type: Number, default: 1 }, // Level người chơi yêu cầu
  },
  { timestamps: true },
);
// RaceDefinitionSchema.index({ type: 1, requiredLevel: 1 });
// RaceDefinitionSchema.index({ tournamentId: 1 });
module.exports = mongoose.model("RaceDefinition", RaceDefinitionSchema);
