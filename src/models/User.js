const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- Định nghĩa Schema con cho Phụ tùng trong Garage ---
const PartInstanceSchema = new Schema(
  {
    partDefinitionId: { type: String, required: true, index: true }, // Link tới PartDefinition.partId
    acquiredAt: { type: Date, default: Date.now },
    installedOnCar: {
      // _id của CarInstance mà phụ tùng này đang được lắp
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
    // currentDurability: { type: Number, default: 100 }, // Độ bền riêng của phụ tùng (nếu cần)
    // maxDurability: { type: Number, default: 100 },
  },
  { _id: true },
);

// --- Định nghĩa Schema con cho Xe trong Garage ---
const CarInstanceSchema = new Schema(
  {
    carModelId: { type: String, required: true, index: true }, // Link tới CarModel.modelId
    currentStats: {
      // Các chỉ số hiệu quả của xe sau khi tính toán phụ tùng và các yếu tố khác
      speed: Number,
      acceleration: Number,
      handling: Number,
      durability: Number, // Chỉ số độ bền hiệu quả của xe, khác với độ bền hiện tại
    },
    durability: { type: Number, default: 100, min: 0, max: 100 }, // Độ bền hiện tại của xe
    maxDurability: { type: Number, default: 100 }, // Độ bền tối đa mà xe có thể đạt được
    status: {
      type: String,
      default: "ready",
      enum: [
        "ready",
        "racing",
        "needs_repair",
        "under_repair",
        "repair_requested",
      ],
      index: true,
    },
    lastRaceAt: { type: Date, default: null },
    installedParts: {
      type: Map,
      of: Schema.Types.ObjectId, // Value là _id của PartInstance trong user.garage.parts
      default: {}, // Key là partType (ví dụ: 'engine', 'tires')
    },
    cosmetics: {
      color: { type: String, default: "#FFFFFF" },
      decalId: { type: String, default: null },
      licensePlate: { type: String, default: null, trim: true, maxlength: 10 },
    },
    raceHistory: {
      totalRaces: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      // Có thể thêm các chi tiết khác như thời gian đua tốt nhất, v.v.
    },
    acquiredAt: { type: Date, default: Date.now },
    isDisplayed: { type: Boolean, default: false },
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
  },
  { _id: true },
);

// --- Cập nhật userSchema chính ---
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    balance: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastDaily: { type: Date },
    cooldowns: {
      carDiscard: {
        date: { type: String }, // YYYY-MM-DD
        count: { type: Number, default: 0 },
      },
      work: { type: Date },
      daily: { type: Date },
      games: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    job: {
      name: String,
      tier: Number,
      lastSalary: Date,
      hiredAt: Date,
    },
    mainJob: {
      name: { type: String, default: null }, // Để null nếu chưa có nghề
      level: { type: Number, default: 1 },
      xp: { type: Number, default: 0 },
      lastSalary: Date,
      hiredAt: { type: Date, default: null },
      lastQuit: { type: Date, default: null },
      taskCooldowns: {
        type: Map,
        of: Number,
        default: {},
      },
      taskCount: { type: Number, default: 0 },
    },
    racingStats: {
      // Thống kê đua xe tổng quát của người chơi
      totalRaces: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      elo: { type: Number, default: 1000 }, // Điểm ELO khởi đầu
      currentTournamentId: { type: String, default: null }, // ID giải đấu NPC đang tham gia (nếu có)
    },
    mechanicLicense: {
      // Thông tin về nghề thợ sửa xe
      isLicensed: { type: Boolean, default: false },
      level: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
      // specialties: [String] // Ví dụ: chuyên sửa động cơ, chuyên xe hãng X (tương lai)
    },
    gacha: {
      lastFreeRollDate: { type: String },
      freeRollsUsedToday: { type: Number, default: 0 },
      pityRolls: { type: Number, default: 0 },
      weeklyTicketExchange: {
        count: { type: Number, default: 0 },
        weekStartDate: { type: Date, default: null },
      },
    },
    garage: {
      cars: [CarInstanceSchema],
      parts: [PartInstanceSchema],
    },
    dailyPurchases: {
      type: Map,
      of: new Schema(
        {
          count: { type: Number, default: 0 },
          lastPurchaseDate: { type: Date },
        },
        { _id: false },
      ),
      default: {},
    },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    inventory: {
      type: Map,
      of: Number,
      default: {},
    },
    castrolBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
