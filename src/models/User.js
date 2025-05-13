const mongoose = require("mongoose");
const { Schema } = mongoose; // Import Schema

// --- Định nghĩa Schema con cho Phụ tùng trong Garage ---
const PartInstanceSchema = new Schema(
  {
    partDefinitionId: { type: String, required: true, index: true },
    acquiredAt: { type: Date, default: Date.now },
    installedOnCar: {
      // ID của CarInstance mà phụ tùng này đang được lắp
      type: Schema.Types.ObjectId,
      default: null,
      index: true, // Có thể thêm index nếu bạn thường xuyên query part theo xe nó lắp
    },
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
  },
  { _id: true },
); // Bật _id để có ID duy nhất cho mỗi instance phụ tùng

// --- Định nghĩa Schema con cho Xe trong Garage ---
const CarInstanceSchema = new Schema(
  {
    carModelId: {
      // Link tới CarModel.modelId
      type: String,
      required: true,
      index: true,
    },
    installedParts: {
      // Lưu ID (_id) của PartInstance đang được lắp vào xe
      type: Map,
      of: Schema.Types.ObjectId, // Value là _id của PartInstance trong user.garage.parts
      default: {}, // Key là partType (ví dụ: 'engine', 'tires')
    },
    cosmetics: {
      // Thông tin ngoại hình
      color: { type: String, default: "#FFFFFF" }, // Màu sơn mặc định
      decalId: { type: String, default: null }, // ID của decal (có thể link tới PartDefinition nếu decal là item)
      licensePlate: { type: String, default: null, trim: true, maxlength: 10 }, // Biển số xe tùy chỉnh
    },
    raceHistory: {
      // Lịch sử đua
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      lastMaintenance: { type: Date, default: null }, // Thời gian bảo dưỡng cuối (cho tính năng bảo dưỡng)
    },
    acquiredAt: {
      // Thời gian nhận được xe này
      type: Date,
      default: Date.now,
    },
    isDisplayed: {
      // Đánh dấu xe này có đang được hiển thị trong /profile không (tùy chọn)
      type: Boolean,
      default: false,
    },
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
  },
  { _id: true },
); // Bật _id để có ID duy nhất cho mỗi instance xe

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
        date: { type: String },
        count: { type: Number, default: 0 },
      },
      work: { type: Date },
      daily: { type: Date }, // Đổi tên từ lastDaily cho nhất quán
      games: {
        // Map cho cooldown các game
        type: Map,
        of: Number, // Key: tên game (vd: 'coinflip'), Value: timestamp lastPlayed
        default: {},
      },
    },
    job: {
      // Việc làm phụ (side job)
      name: String,
      tier: Number,
      lastSalary: Date,
      hiredAt: Date,
    },
    mainJob: {
      // Việc làm chính
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

    // --- THÊM TRƯỜNG MỚI CHO GACHA VÀ GARAGE ---
    gacha: {
      lastFreeRollDate: { type: String }, // Lưu ngày YYYY-MM-DD của lần free roll cuối
      freeRollsUsedToday: { type: Number, default: 0 }, // Số lượt free roll đã dùng hôm nay
      rollTickets: { type: Number, default: 0 },
      pityRolls: { type: Number, default: 0 },
      weeklyTicketExchange: {
        count: { type: Number, default: 0 },
        weekStartDate: { type: Date, default: null }, // Ngày đầu tiên của tuần đã đổi
      },
    },
    garage: {
      cars: [CarInstanceSchema], // Mảng chứa các instance xe sở hữu
      parts: [PartInstanceSchema], // Mảng chứa các instance phụ tùng sở hữu
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
      ), // Không cần _id cho subdocument này
      default: {},
    },
    // --- KẾT THÚC TRƯỜNG MỚI ---

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
      min: 0, // Đảm bảo không âm
    },
  },
  { timestamps: true },
); // Thêm createdAt và updatedAt tự động

// Thêm index kết hợp cho userId và guildId để tối ưu query
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
