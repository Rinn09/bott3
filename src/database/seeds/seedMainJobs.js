const mongoose = require("mongoose");
const MainJob = require("../../models/MainJob"); // Đảm bảo đường dẫn đúng
require("dotenv").config();

// Kết nối MongoDB (giữ nguyên)
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ Kết nối MongoDB thành công. Bắt đầu seed dữ liệu...");
    seedJobs().then(() => {
      console.log("🌾 Seed dữ liệu nghề nghiệp hoàn tất.");
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
  });

async function seedJobs() {
  // --- Nghề Nông Dân (dùng chữ thường) ---
  await MainJob.findOneAndUpdate(
    { name: "nông dân" }, // Tìm bằng chữ thường
    {
      name: "nông dân", // Lưu bằng chữ thường
      description: "Chăm sóc và thu hoạch mùa màng.",
      tasks: [
        {
          taskId: "tuoiCay", // ID task Tưới cây
          name: "Tưới cây",
          command: "/tuoi-cay",
          xp: 20,
          reward: 1500, // Thưởng cố định cho tưới cây
          cooldown: 60 * 60 * 1000,
        },
        {
          taskId: "thuHoach", // ID task Thu hoạch (camelCase)
          name: "Thu hoạch",
          command: "/thu-hoach",
          xp: 50,
          reward: 0, // Đặt là 0 vì task này sẽ trả lương theo cấp độ
          cooldown: 120 * 60 * 1000,
        },
        {
          taskId: "gieoHat", // ID task Trồng hạt giống
          name: "Trồng hạt giống",
          command: "/gieo-hat",
          xp: 40,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 240 * 60 * 1000,
        },
        {
          taskId: "catCo", // ID task Cắt cỏ
          name: "Cắt cỏ",
          command: "/cat-co",
          xp: 30,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 90 * 60 * 1000,
        },
      ],
      salaryByLevel: new Map([
        ["1", 30000],
        ["2", 35000],
        ["3", 42000],
        ["5", 55000],
      ]),
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật nghề: nông dân (lowercase)");

  await MainJob.findOneAndUpdate(
    { name: "giáo viên" }, // Tên chữ thường
    {
      name: "giáo viên",
      description: "Truyền đạt kiến thức và kinh nghiệm.",
      tasks: [
        {
          taskId: "soanGiaoAn", // ID task ví dụ
          name: "Soạn giáo án",
          command: "/soan-giao-an", // Lệnh tương ứng (sẽ tạo ở bước sau)
          xp: 60, // Ví dụ XP
          reward: 0, // Ví dụ thưởng
          cooldown: 3600000, // Ví dụ cooldown 1 giờ
        },
        {
          taskId: "dayHoc", // ID task ví dụ
          name: "Dạy học",
          command: "/day-hoc", // Lệnh tương ứng (sẽ tạo ở bước sau)
          xp: 35,
          reward: 40000, // Task này trả lương theo cấp
          cooldown: 10800000, // Ví dụ cooldown 3 giờ
        },
        {
          taskId: "chamSocHocSinh", // ID task ví dụ
          name: "Chăm sóc học sinh",
          command: "/cham-soc-hoc-sinh", // Lệnh tương ứng (sẽ tạo ở bước sau)
          xp: 30,
          reward: 30000, // Task này trả lương theo cấp
          cooldown: 7200000, // Ví dụ cooldown 2 giờ
        },
        {
          taskId: "thamGiaHoiThao", // ID task ví dụ
          name: "Tham gia hội thảo",
          command: "/tham-gia-hoi-thao", // Lệnh tương ứng (sẽ tạo ở bước sau)
          xp: 80,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 14400000, // Ví dụ cooldown 4 giờ
        },
      ],
      salaryByLevel: new Map([
        // Ví dụ thang lương
        ["1", 3000],
        ["2", 35000],
        ["3", 38000],
        ["5", 42000],
      ]),
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật nghề: giáo viên");

  await MainJob.findOneAndUpdate(
    { name: "công nhân" }, // Tên chữ thường
    {
      name: "công nhân",
      description: "Làm việc tại nhà máy, lắp ráp sản phẩm.",
      tasks: [
        {
          taskId: "lapRap", // ID task ví dụ
          name: "Lắp ráp linh kiện",
          command: "/lap-rap", // Lệnh tương ứng
          xp: 60,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 7200000, // Ví dụ cooldown 2 giờ
        },
        {
          taskId: "kiemTra", // ID task ví dụ
          name: "Kiểm tra chất lượng",
          command: "/kiem-tra", // Lệnh tương ứng
          xp: 50,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 5400000, // Ví dụ cooldown 1.5 giờ
        },
        {
          taskId: "vanChuyen", // ID task ví dụ
          name: "Vận chuyển hàng hóa",
          command: "/van-chuyen", // Lệnh tương ứng
          xp: 30,
          reward: 20000, // Task này trả lương theo cấp
          cooldown: 3600000, // Ví dụ cooldown 1 giờ
        },
        {
          taskId: "baoTri", // ID task ví dụ
          name: "Bảo trì máy móc",
          command: "/bao-tri", // Lệnh tương ứng
          xp: 70,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 10800000, // Ví dụ cooldown 3 giờ
        },
      ],
      salaryByLevel: new Map([
        // Ví dụ thang lương
        ["1", 28000],
        ["2", 33000],
        ["3", 39000],
        ["5", 50000],
      ]),
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật nghề: công nhân");

  await MainJob.findOneAndUpdate(
    { name: "bác sĩ" }, // Tên chữ thường
    {
      name: "bác sĩ",
      description: "Chăm sóc sức khỏe và điều trị bệnh nhân.",
      tasks: [
        {
          taskId: "khamsucKhoe", // ID task ví dụ
          name: "Khám sức khỏe",
          command: "/kham-suc-khoe", // Lệnh tương ứng
          xp: 30,
          reward: 10000, // Task này trả lương theo cấp
          cooldown: 10800000, // Ví dụ cooldown 3 giờ
        },
        {
          taskId: "capCuu", // ID task ví dụ
          name: "Cấp cứu bệnh nhân",
          command: "/cap-cuu", // Lệnh tương ứng
          xp: 80,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 21600000, // Ví dụ cooldown 3 giờ
        },
        {
          taskId: "tuVan", // ID task ví dụ
          name: "Tư vấn sức khỏe",
          command: "/tu-van", // Lệnh tương ứng
          xp: 30,
          reward: 10000, // Task này trả lương theo cấp
          cooldown: 3600000, // Ví dụ cooldown 1 giờ
        },
        {
          taskId: "thucHienXetNghiem", // ID task ví dụ
          name: "Thực hiện xét nghiệm",
          command: "/thuc-hien-xet-nghiem", // Lệnh tương ứng
          xp: 40,
          reward: 20000, // Task này trả lương theo cấp
          cooldown: 14400000, // Ví dụ cooldown 4 giờ
        },
      ],
      salaryByLevel: new Map([
        // Ví dụ thang lương
        ["1", 50000],
        ["2", 60000],
        ["3", 70000],
        ["5", 90000],
      ]),
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật nghề: bác sĩ");

  await MainJob.findOneAndUpdate(
    { name: "kỹ sư" }, // Tên chữ thường
    {
      name: "kỹ sư",
      description: "Thiết kế và phát triển các giải pháp kỹ thuật.",
      tasks: [
        {
          taskId: "thietKe", // ID task ví dụ
          name: "Thiết kế sản phẩm",
          command: "/thiet-ke", // Lệnh tương ứng
          xp: 60,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 7200000, // Ví dụ cooldown 2 giờ
        },
        {
          taskId: "phatTrien", // ID task ví dụ
          name: "Phát triển phần mềm",
          command: "/phat-trien", // Lệnh tương ứng
          xp: 80,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 10800000, // Ví dụ cooldown 3 giờ
        },
        {
          taskId: "kiemDinh", // ID task ví dụ
          name: "Kiểm định chất lượng",
          command: "/kiem-dinh", // Lệnh tương ứng
          xp: 50,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 3600000, // Ví dụ cooldown 1 giờ
        },
        {
          taskId: "tuVanKyThuat", // ID task ví dụ
          name: "Tư vấn kỹ thuật",
          command: "/tu-van-ky-thuat", // Lệnh tương ứng
          xp: 70,
          reward: 0, // Task này trả lương theo cấp
          cooldown: 14400000, // Ví dụ cooldown 4 giờ
        },
      ],
      salaryByLevel: new Map([
        // Ví dụ thang lương
        ["1", 60000],
        ["2", 70000],
        ["3", 80000],
        ["5", 100000],
      ]),
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật nghề: kỹ sư");

  await MainJob.findOneAndUpdate(
    { name: "thợ sửa xe" },
    {
      name: "thợ sửa xe",
      displayName: "Thợ Sửa Xe",
      icon: "🛠️",
      description:
        "Chuyên gia chẩn đoán, sửa chữa và nâng cấp xe cộ. Giữ cho những cỗ máy tốc độ luôn ở trạng thái hoàn hảo nhất.",
      requirementsToJoin: {
        minUserLevel: 5, // Ví dụ: Cần user level 5
        costToJoin: 10000, // Phí gia nhập
      },
      salaryByLevel: new Map([
        // Lương cơ bản cho task "Hoàn thành đơn sửa xe" (nếu task đó reward.money = 0)
        ["1", 5000],
        ["5", 10000],
        ["10", 20000],
      ]),
      levelUpRewards: new Map([
        [
          "5",
          {
            money: 25000,
            items: [
              {
                itemId: "advanced_repair_kit",
                quantity: 1,
                itemType: "shop_item",
              },
            ],
          },
        ],
        [
          "10",
          {
            money: 100000,
            userXp: 500,
            items: [
              {
                itemId: "blueprint_rare_engine_part",
                quantity: 1,
                itemType: "shop_item",
              },
            ],
          },
        ],
      ]),
      specializations: [
        {
          specId: "engine_tuner",
          name: "Chuyên Gia Độ Động Cơ",
          description:
            "Mở khóa các task liên quan đến sửa chữa và tối ưu hóa động cơ.",
          requiredJobLevel: 5,
          requiredTasksCompleted: [
            { taskId: "completebasicrepair", count: 10 },
          ], // Ví dụ: cần hoàn thành 10 đơn sửa cơ bản
          statBonuses: new Map([
            ["engine_repair_speed_multiplier", 1.1],
            ["engine_crafting_success_chance", 0.05],
          ]),
        },
        {
          specId: "chassis_master",
          name: "Bậc Thầy Khung Gầm",
          description:
            "Chuyên sâu về sửa chữa và gia cố khung gầm, hệ thống treo.",
          requiredJobLevel: 8,
          // ...
        },
      ],
      tasks: [
        {
          taskId: "diagnosecarproblem",
          name: "Chẩn Đoán Lỗi Xe",
          description:
            "Kiểm tra một chiếc xe bị hỏng nhẹ để tìm ra nguyên nhân.",
          requiredJobLevel: 1,
          cooldownMs: 10 * 60 * 1000, // 10 phút
          reward: { jobXp: 15, jobReputation: 5 },
          type: "active_immediate",
          // Output có thể là một "Báo cáo chẩn đoán" (item tạm thời)
          // outputItems: [{ itemId: "diagnostic_report_common", quantity: 1, chance: 0.8, itemType: 'shop_item' }]
        },
        {
          taskId: "performoilchange",
          name: "Thay Nhớt Xe",
          description: "Thực hiện thay nhớt cơ bản cho xe của khách.",
          requiredJobLevel: 1,
          requiredItems: [
            { itemId: "new_engine_oil", quantity: 1, itemType: "shop_item" },
          ], // Cần item "Dầu nhớt mới"
          cooldownMs: 30 * 60 * 1000, // 30 phút
          reward: { money: 3000, jobXp: 25, jobReputation: 10 },
          type: "active_immediate",
        },
        {
          taskId: "completerepairorder", // Task này liên kết với /race repair complete
          name: "Hoàn Thành Đơn Sửa Xe Khách",
          description:
            "Hoàn thành một đơn sửa xe từ yêu cầu của người chơi khác.",
          requiredJobLevel: 2,
          // Không có reward cố định ở đây, vì reward đến từ đơn hàng
          reward: { jobXp: 50, jobReputation: 20 }, // Chỉ có XP và danh tiếng
          type: "repair_service", // Loại task đặc biệt
          // Cooldown có thể không cần thiết nếu dựa vào tần suất đơn hàng
        },
        {
          taskId: "tuneupbasicengine",
          name: "Tinh Chỉnh Động Cơ Cơ Bản",
          description: "Tối ưu hóa một động cơ để tăng nhẹ hiệu suất.",
          requiredJobLevel: 5,
          requiredSpecialization: "engine_tuner",
          requiredItems: [
            { itemId: "basic_tuning_kit", quantity: 1, itemType: "shop_item" },
          ],
          durationMs: 1 * 60 * 60 * 1000, // 1 giờ
          successChance: 0.9,
          reward: { jobXp: 100, jobReputation: 30 },
          // outputItems: có thể là một "Engine Tune-up Voucher"
          type: "active_duration",
        },
        {
          taskId: "craftcommonenginepart",
          name: "Chế Tạo Phụ Tùng Động Cơ Common",
          description:
            "Sử dụng mảnh vụn để chế tạo một phụ tùng động cơ cấp thấp.",
          requiredJobLevel: 7,
          requiredSpecialization: "engine_tuner",
          requiredItems: [
            {
              itemId: "basic_metal_scrap",
              quantity: 10,
              itemType: "shop_item",
            },
            {
              itemId: "engine_blueprints_common",
              quantity: 1,
              itemType: "shop_item",
            },
          ],
          durationMs: 2 * 60 * 60 * 1000, // 2 giờ
          successChance: 0.75,
          outputItems: [
            {
              itemId: "random_common_engine_part",
              quantity: 1,
              itemType: "part_instance_definition",
              chance: 1,
            },
          ], // Sẽ tạo 1 part instance mới
          failureOutput: { itemLossPercentage: 0.5, xpLoss: 10 },
          type: "crafting",
        },
        // Thêm các task khác cho thợ sửa xe...
      ],
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật nghề: Thợ Sửa Xe");
}

// node src/database/seeds/seedMainJobs.js
