const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- Định nghĩa Schema con cho Phụ tùng trong Garage ---
const PartInstanceSchema = new Schema(
  {
    partDefinitionId: { type: String, required: true, index: true }, // Link tới PartDefinition.partId
    acquiredAt: { type: Date, default: Date.now },
    installedOnCar: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
    // Thêm bonusStats cho phụ tùng nếu cần thiết cho việc "đột phá" từ Gacha hoặc nâng cấp
    bonusStats: {
      type: Map,
      of: Number, // Ví dụ: { speed: 5, handling: 2 }
      default: {},
    },
  },
  { _id: true },
);

// --- Định nghĩa Schema con cho Xe trong Garage ---
const CarInstanceSchema = new Schema(
  {
    carModelId: { type: String, required: true, index: true },
    // currentStats: { // Có thể bỏ nếu bạn tính toán real-time, hoặc giữ lại nếu muốn cache
    //   speed: Number,
    //   acceleration: Number,
    //   handling: Number,
    //   durability: Number,
    // },
    durability: { type: Number, default: 100, min: 0, max: 100 },
    maxDurability: { type: Number, default: 100 },
    status: {
      type: String,
      default: "ready",
      enum: [
        "ready",
        "racing",
        "needs_repair", // Cần sửa chữa (hỏng nặng hoặc độ bền thấp)
        "under_repair", // Đang được một thợ khác sửa
        "repair_requested", // Đã tạo yêu cầu sửa, đang chờ thợ nhận
      ],
      index: true,
    },
    lastRaceAt: { type: Date, default: null },
    installedParts: {
      type: Map,
      of: Schema.Types.ObjectId, // Value là _id của PartInstance trong user.garage.parts
      default: {},
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
    },
    acquiredAt: { type: Date, default: Date.now },
    isDisplayed: { type: Boolean, default: false }, // Xe đang được trưng bày
    isListedOnMarket: { type: Boolean, default: false, index: true },
    marketListingId: { type: Schema.Types.ObjectId, default: null },
    // Thêm trường để lưu trữ các tuỳ chỉnh stat từ thợ (nếu có)
    // customTuningStats: {
    //   type: Map,
    //   of: Number, // Ví dụ: { speed: 2, handling: 1 }
    //   default: {}
    // }
  },
  { _id: true },
);

// --- Cập nhật userSchema chính ---
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // Giữ index cho query nhanh
    guildId: { type: String, required: true, index: true }, // Giữ index cho query nhanh
    balance: { type: Number, default: 0, min: 0 },
    bank: { type: Number, default: 0, min: 0 },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    lastDaily: { type: Date },
    cooldowns: {
      carDiscard: {
        // Thêm cooldown cho việc phá xe
        date: { type: String }, // Format: YYYY-MM-DD
        count: { type: Number, default: 0 },
      },
      work: { type: Date }, // Side job work
      daily: { type: Date }, // daily command
      games: {
        // Cooldown cho các minigames
        type: Map,
        of: Number, // Timestamp lần cuối chơi game đó
        default: {},
      },
      // Thêm các cooldown khác nếu cần
    },
    job: {
      // Side Job (công việc phụ hiện tại)
      name: String,
      tier: Number,
      lastSalary: Date,
      hiredAt: Date,
    },
    mainJob: {
      // Nghề nghiệp chính
      name: { type: String, default: null, index: true },
      level: { type: Number, default: 1 },
      xp: { type: Number, default: 0 },
      hiredAt: { type: Date, default: null },
      lastQuit: { type: Date, default: null }, // Thời điểm nghỉ việc gần nhất
      taskCooldowns: {
        // Cooldown cho từng task của nghề này
        type: Map,
        of: Number, // Timestamp lần cuối thực hiện task
        default: {},
      },
      // --- CÁC TRƯỜNG MỚI CHO MAINJOB NÂNG CAO ---
      specialization: { type: String, default: null, index: true }, // Ví dụ: 'engine_expert', 'body_work_master'
      skillTier: { type: Number, default: 1 }, // Bậc kỹ năng của chuyên môn (nếu có)
      reputation: { type: Number, default: 0, index: true }, // Danh tiếng trong nghề
      activeTask: {
        // Nếu task có durationMs > 0
        taskId: String,
        startTime: Date,
        durationMs: Number,
        // Có thể thêm inputItemsSnapshot ở đây để trừ khi hoàn thành, tránh user bán mất
      },
      currentCrafting: {
        // Nếu có nghề chế tạo
        recipeId: String, // Hoặc itemId đang chế tạo
        progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
        startedAt: Date,
        materialsCommitted: [{ itemId: String, quantity: Number }], // Vật liệu đã dùng
      },
      tasksCompleted: {
        // Theo dõi số lần hoàn thành task (có thể dùng cho điều kiện mở khóa chuyên môn)
        type: Map,
        of: Number, // { taskId: count }
        default: {},
      },
      // --------------------------------------------
    },
    racingStats: {
      totalRaces: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      elo: { type: Number, default: 1000 },
      currentTournamentId: { type: String, default: null },
    },
    // Bỏ mechanicLicense, sẽ tích hợp vào mainJob "Thợ Sửa Xe"
    // mechanicLicense: {
    //   isLicensed: { type: Boolean, default: false },
    //   level: { type: Number, default: 0 },
    //   xp: { type: Number, default: 0 },
    // },
    gacha: {
      lastFreeRollDate: { type: String }, // YYYY-MM-DD
      freeRollsUsedToday: { type: Number, default: 0 },
      pityRolls: { type: Number, default: 0 },
      weeklyTicketExchange: {
        // Cho đổi Castrol -> Vé Roll
        count: { type: Number, default: 0 },
        weekStartDate: { type: Date, default: null }, // Ngày bắt đầu của tuần đổi vé
      },
    },
    garage: {
      cars: [CarInstanceSchema],
      parts: [PartInstanceSchema], // Kho chứa phụ tùng (chưa lắp hoặc đã tháo)
    },
    dailyPurchases: {
      // Giới hạn mua item trong shop mỗi ngày
      type: Map,
      of: new Schema(
        {
          count: { type: Number, default: 0 },
          lastPurchaseDate: { type: Date }, // Chỉ cần Date, không cần time
        },
        { _id: false },
      ),
      default: {}, // key là itemId, value là { count, lastPurchaseDate }
    },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    inventory: {
      // Túi đồ chứa các item từ ShopItem (nguyên liệu, vé roll, sách kỹ năng...)
      type: Map,
      of: Number, // key là itemId (String), value là quantity (Number)
      default: {},
    },
    castrolBalance: {
      // Đơn vị tiền tệ cao cấp hơn, có thể kiếm từ Gacha xe trùng
      type: Number,
      default: 0,
      min: 0,
    },
    // Thêm các trường khác nếu cần cho hệ thống "chain"
    activeBoosts: [
      {
        // Các buff tạm thời
        boostType: String, // 'xp_job', 'xp_user', 'task_cooldown_reduction', 'gacha_luck'
        multiplier: Number, // Hoặc fixedValue: Number
        expiresAt: Date,
        sourceJob: String, // Nghề nào tạo ra boost này (nếu có)
      },
    ],
    unlockedRecipes: [String], // Danh sách các recipeId (công thức chế tạo) đã học được
  },
  { timestamps: true },
);

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });
// Thêm index cho các trường thường xuyên query/sort
userSchema.index({ guildId: 1, level: -1, xp: -1 }); // Cho leaderboard level
userSchema.index({ guildId: 1, balance: -1 }); // Cho top money (nếu chỉ tính balance)
userSchema.index({ guildId: 1, "mainJob.name": 1, "mainJob.level": -1 }); // Cho leaderboard nghề
userSchema.index({ guildId: 1, "mainJob.reputation": -1 }); // Cho leaderboard danh tiếng nghề

module.exports = mongoose.model("User", userSchema);
