const mongoose = require("mongoose");
const { Schema } = mongoose;

const PartInstanceSchema = new Schema(
  {
    partDefinitionId: { type: String, required: true, index: true },
    acquiredAt: { type: Date, default: Date.now },
    installedOnCar: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
    bonusStats: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: true },
);
const CarInstanceSchema = new Schema(
  {
    carModelId: {
      type: String,
      required: true,
      index: true,
    },
    installedParts: {
      type: Map,
      of: Schema.Types.ObjectId,
      default: {},
    },
    cosmetics: {
      // Thông tin ngoại hình
      color: { type: String, default: "#FFFFFF" },
      decalId: { type: String, default: null },
      licensePlate: { type: String, default: null, trim: true, maxlength: 10 },
    },
    raceHistory: {
      // Lịch sử đua
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      lastMaintenance: { type: Date, default: null },
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    isDisplayed: {
      type: Boolean,
      default: false,
    },
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
  },
  { _id: true },
);
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
        date: { type: String },
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
      name: String,
      level: { type: Number, default: 1 },
      xp: { type: Number, default: 0 },
      lastSalary: Date,
      hiredAt: Date,
      lastQuit: { type: Date, default: null },
      taskCooldowns: {
        type: Map,
        of: Number,
        default: {},
      },
      taskCount: { type: Number, default: 0 },
    },
    gacha: {
      lastFreeRollDate: { type: String },
      freeRollsUsedToday: { type: Number, default: 0 },
      rollTickets: { type: Number, default: 0 },
      pityRolls: { type: Number, default: 0 },
      weeklyTicketExchange: {
        count: { type: Number, default: 0 },
        weekStartDate: { type: Date, default: null },
      },
    },
    garage: {
      cars: [CarInstanceSchema],
      parts: [PartInstanceSchema],
      default: { cars: [], parts: [] },
    },
    dailyPurchases: {
      type: Map,
      of: new Schema(
        {
          // Lưu số lượng và ngày mua cuối cho mỗi itemId
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
