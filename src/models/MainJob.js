const mongoose = require("mongoose");
const { Schema } = mongoose; // Đảm bảo Schema được import

// --- Định nghĩa Schema con cho các Task ---
const TaskSchema = new Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true, // Nên unique trong scope của một MainJob, hoặc global nếu taskId là duy nhất toàn hệ thống
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "Một nhiệm vụ trong nghề." },
    commandToInitiate: { type: String, default: null }, // Lệnh cụ thể để bắt đầu task này (nếu không phải là /mainjob task <taskId>)

    requiredJobLevel: { type: Number, default: 1 },
    requiredSpecialization: { type: String, default: null, lowercase: true }, // ID của chuyên môn yêu cầu
    requiredTasksCompleted: [
      {
        // Các task khác cần hoàn thành N lần trước khi làm task này
        taskId: String,
        count: Number,
      },
    ],
    requiredItems: [
      // Vật phẩm cần để bắt đầu/thực hiện task
      {
        _id: false,
        itemId: { type: String, required: true }, // itemId từ ShopItem hoặc PartDefinition (nếu cần "rã" part)
        itemType: {
          type: String,
          enum: ["shop_item", "part_definition"],
          default: "shop_item",
        },
        quantity: { type: Number, default: 1 },
        consume: { type: Boolean, default: true }, // Có bị tiêu hao sau khi làm task không
      },
    ],
    outputItems: [
      // Vật phẩm nhận được sau khi hoàn thành task
      {
        _id: false,
        itemId: { type: String, required: true }, // itemId từ ShopItem hoặc PartDefinition (nếu chế tạo part)
        itemType: {
          type: String,
          enum: ["shop_item", "part_instance_definition"],
          default: "shop_item",
        },
        quantity: { type: Number, default: 1 },
        chance: { type: Number, default: 1, min: 0, max: 1 }, // Tỷ lệ nhận (0-1)
      },
    ],
    reward: {
      // Phần thưởng cố định (ngoài outputItems)
      money: { type: Number, default: 0 },
      jobXp: { type: Number, default: 0 }, // XP cho MainJob
      userXp: { type: Number, default: 0 }, // XP cho User level (chung)
      jobReputation: { type: Number, default: 0 },
    },
    // salaryByJobLevelOverride: { // Nếu task này có cách tính lương theo level nghề riêng, ghi đè salaryByLevel của MainJob
    //   type: Map,
    //   of: Number,
    //   default: {}
    // },
    cooldownMs: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 }, // Thời gian cần để hoàn thành task (nếu có)
    successChance: { type: Number, default: 1, min: 0, max: 1 },
    failureOutput: {
      // Hình phạt nếu task thất bại (khi successChance < 1)
      xpLoss: { type: Number, default: 0 }, // Mất XP nghề
      itemLossPercentage: { type: Number, default: 0, min: 0, max: 1 }, // % mất requiredItems
      durabilityPenalty: { type: Number, default: 0 }, // Ví dụ, thợ sửa xe làm hỏng thêm xe khách
    },
    type: {
      // Loại task để phân biệt logic xử lý
      type: String,
      enum: [
        "active_immediate", // Click là xong, nhận thưởng ngay (như hiện tại)
        "active_duration", // Click để bắt đầu, cần thời gian để hoàn thành, sau đó claim
        "passive_income", // Tự động tạo ra thu nhập/tài nguyên theo thời gian (cần cơ chế claim định kỳ)
        "crafting", // Chế tạo vật phẩm
        "repair_service", // Liên quan đến hệ thống sửa xe
        "research", // Nghiên cứu công nghệ, mở khóa recipe mới (cần thời gian)
        "special_event", // Task đặc biệt từ sự kiện
      ],
      default: "active_immediate",
    },
    // Thêm các trường khác tùy theo logic của task
    // Ví dụ: targetEntity (nếu task tác động lên xe, part), minigameType, ...
  },
  { _id: false }, // Không tạo _id cho subdocument task
);

// --- Định nghĩa Schema con cho Chuyên Môn ---
const SpecializationSchema = new Schema(
  {
    specId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true },
    description: String,
    icon: String,
    requiredJobLevel: { type: Number, default: 1 },
    requiredTasksCompleted: [
      {
        // Các task nào phải hoàn thành bao nhiêu lần để mở khóa chuyên môn này
        taskId: String,
        count: Number,
      },
    ],
    // tasksUnlocked: [String], // Danh sách các taskId mới được mở khóa bởi chuyên môn này (có thể suy ra từ task.requiredSpecialization)
    statBonuses: {
      // Bonus thụ động khi có chuyên môn này
      type: Map,
      of: Number, // Ví dụ: { crafting_success_chance: 0.05, repair_speed_multiplier: 1.1 }
      default: {},
    },
  },
  { _id: false },
);

// --- Định nghĩa Schema chính cho MainJob ---
const mainJobSchema = new mongoose.Schema(
  {
    name: {
      // ID nội bộ, dùng để query (ví dụ: 'farmer', 'mechanic')
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: { type: String, required: true }, // Tên hiển thị cho người dùng (ví dụ: "Nông Dân", "Thợ Sửa Xe")
    description: String,
    icon: String, // Emoji hoặc URL ảnh icon cho nghề

    tasks: [TaskSchema], // Danh sách các nhiệm vụ của nghề
    specializations: [SpecializationSchema], // Các nhánh chuyên môn có thể có

    // Lương cơ bản cho các task chính (thường là task có reward.money = 0 trong định nghĩa task,
    // và task đó sẽ lấy lương từ đây dựa trên jobLevel của user)
    salaryByLevel: {
      type: Map,
      of: Number, // key là level (String), value là salary (Number)
      default: {}, // Ví dụ: { "1": 30000, "5": 50000 }
    },

    // Phần thưởng một lần khi người dùng đạt các mốc level nghề nhất định
    levelUpRewards: {
      type: Map,
      of: new Schema(
        {
          // Key là level (String)
          _id: false,
          money: { type: Number, default: 0 },
          userXp: { type: Number, default: 0 }, // XP cho level user chung
          items: [
            {
              _id: false,
              itemId: String,
              quantity: Number,
              itemType: {
                type: String,
                enum: ["shop_item", "part_instance_definition"],
                default: "shop_item",
              },
            },
          ],
          // Có thể thêm castrol, vé gacha, ...
        },
        { _id: false },
      ),
      default: {},
      // Ví dụ: "5": { money: 10000, items: [{ itemId: "rare_tool_box", itemType: 'shop_item', quantity: 1 }] }
    },

    // Yêu cầu để người dùng có thể chọn nghề này
    requirementsToJoin: {
      minUserLevel: { type: Number, default: 1 }, // Level user chung
      requiredItemId: { type: String, default: null }, // Ví dụ: cần "Chứng chỉ học nghề ABC"
      requiredPreviousJob: {
        // Nếu nghề này là nâng cấp từ nghề khác
        jobName: { type: String, default: null, lowercase: true },
        minLevel: { type: Number, default: 1 },
      },
      costToJoin: { type: Number, default: 0 }, // Phí để tham gia nghề (nếu có)
    },
    // Các thông tin khác của nghề
    dailyReputationCap: { type: Number, default: 500 }, // Giới hạn danh tiếng nhận được mỗi ngày từ nghề này
  },
  { timestamps: true },
);

module.exports = mongoose.model("MainJob", mainJobSchema);
