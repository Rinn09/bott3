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
    { name: "thợ sửa xe" }, // Tìm bằng chữ thường
    {
      name: "thợ sửa xe", // Lưu bằng chữ thường
      description:
        "Chẩn đoán lỗi, sửa chữa và bảo dưỡng các loại xe cơ giới, giữ cho những cỗ máy tốc độ luôn ở trạng thái hoàn hảo.",
      tasks: [
        {
          taskId: "completeRepairOrder", // ID task tượng trưng cho việc hoàn thành 1 đơn sửa
          name: "Hoàn Thành Đơn Sửa Xe",
          command: "/race repair complete", // Người dùng sẽ dùng lệnh này để hoàn thành
          xp: 75, // XP nghề nhận được khi hoàn thành 1 đơn sửa (có thể điều chỉnh)
          reward: 0, // Thù lao chính đến từ offeredReward của đơn hàng
          cooldown: 30 * 60 * 1000, // Cooldown 30 phút (ví dụ, để tránh spam hoàn thành liên tục nếu có lỗi)
        },
        {
          taskId: "performAdvancedDiagnostics",
          name: "Thực Hiện Chẩn Đoán Nâng Cao",
          command: "/mainjob task performAdvancedDiagnostics", // Lệnh task riêng (nếu có)
          xp: 40,
          reward: 10000, // Thưởng nhỏ cho việc "nghiên cứu" hoặc "thực hành"
          cooldown: 2 * 60 * 60 * 1000, // Cooldown 2 giờ
        },
        {
          taskId: "tuneUpEngineService",
          name: "Bảo Dưỡng Tinh Chỉnh Động Cơ",
          command: "/mainjob task tuneUpEngineService",
          xp: 60,
          reward: 15000,
          cooldown: 3 * 60 * 60 * 1000, // Cooldown 3 giờ
        },
      ],
      salaryByLevel: new Map([
        // Đây có thể là bonus dựa trên level nghề khi hoàn thành đơn, HOẶC không cần thiết nếu thù lao chỉ từ chủ xe
        ["1", 15000], // Bonus 1,500 VNĐ / đơn ở level 1
        ["5", 75000],
        ["10", 150000],
        ["15", 250000],
        ["20", 400000],
      ]),
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật nghề: Thợ Sửa Xe");
}

// node src/database/seeds/seedMainJobs.js
