const mongoose = require("mongoose");
const ShopItem = require("../../models/ShopItem"); // Sử dụng cùng model ShopItem
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
}); // Đảm bảo đúng đường dẫn tới .env

async function seedTaskOutputItems() {
  console.log("Seeding Task-Specific Output Items (Not for general sale)...");

  // --- Các loại Báo Cáo Chẩn Đoán ---
  const diagnosticReports = [
    {
      itemId: "diagnostic_report_sparkplug",
      name: "Báo Cáo Chẩn Đoán: Bugi",
      description: "Kết quả kiểm tra bugi của xe. Cần thiết để sửa chữa.",
    },
    {
      itemId: "diagnostic_report_airfilter",
      name: "Báo Cáo Chẩn Đoán: Lọc Gió",
      description: "Kết quả kiểm tra lọc gió. Cần thiết để thay thế.",
    },
    {
      itemId: "diagnostic_report_oilchange",
      name: "Báo Cáo Chẩn Đoán: Dầu Máy",
      description: "Tình trạng dầu máy và lọc dầu. Cần cho việc thay dầu.",
    },
    {
      itemId: "diagnostic_report_brakes",
      name: "Báo Cáo Chẩn Đoán: Hệ Thống Phanh",
      description:
        "Tình trạng má phanh và dầu phanh. Cần cho việc bảo dưỡng phanh.",
    },
    {
      itemId: "diagnostic_report_battery",
      name: "Báo Cáo Chẩn Đoán: Ắc Quy",
      description: "Tình trạng ắc quy. Cần để quyết định sạc hay thay mới.",
    },
    // Thêm các báo cáo khác nếu cần
  ];

  for (const report of diagnosticReports) {
    await ShopItem.findOneAndUpdate(
      { itemId: report.itemId },
      {
        ...report,
        buyPrice: null, // Không bán trong shop
        sellPrice: 10, // Có thể cho bán lại với giá rất thấp, hoặc null
        consumable: true, // Dùng 1 lần cho việc sửa chữa tương ứng
        marketable: false, // Có thể không cho bán trên chợ, hoặc cho phép với giá thấp
        // Không cần 'effects' nếu nó chỉ là item điều kiện
      },
      { upsert: true, new: true },
    );
    console.log(`✅ Seeded/Updated Task Output Item: ${report.name}`);
  }

  // --- Các "Mảnh Vỡ" hoặc "Linh Kiện Hỏng" (nếu có) ---
  await ShopItem.findOneAndUpdate(
    { itemId: "broken_engine_component_common" },
    {
      itemId: "broken_engine_component_common",
      name: "Linh Kiện Động Cơ Hỏng (Common)",
      description:
        "Một linh kiện động cơ cấp thấp bị hỏng, có thể dùng để tái chế hoặc nghiên cứu.",
      buyPrice: null,
      sellPrice: 5,
      consumable: true, // Sẽ bị tiêu hao khi dùng làm nguyên liệu
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Task Output Item: Linh Kiện Động Cơ Hỏng (Common)",
  );

  // Ví dụ: "Engine Tune-up Voucher" (nếu task tuneUpBasicEngine có output này)
  await ShopItem.findOneAndUpdate(
    { itemId: "engine_tuneup_voucher_basic" },
    {
      itemId: "engine_tuneup_voucher_basic",
      name: "Phiếu Tinh Chỉnh Động Cơ Cơ Bản",
      description:
        "Một phiếu xác nhận việc động cơ đã được tinh chỉnh cơ bản, có thể mang lại một lợi ích nhỏ.",
      buyPrice: null,
      sellPrice: null, // Không bán
      consumable: true, // Dùng để áp dụng một buff nhỏ cho xe (nếu có logic đó)
      marketable: false,
      effects: {
        // Ví dụ một hiệu ứng tạm thời có thể áp dụng cho xe
        car_stat_boost: {
          targetStat: "acceleration",
          boostValue: 0.05,
          durationMinutes: 120,
        },
      },
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Task Output Item: Phiếu Tinh Chỉnh Động Cơ Cơ Bản",
  );

  console.log("Finished seeding Task-Specific Output Items.");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected (seedTaskOutputItems). Starting seed...");
    seedTaskOutputItems().then(() => {
      console.log("🌱 Seeding Task-Specific Output Items complete.");
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error (seedTaskOutputItems):", err);
  });

// Để chạy: node src/database/seeds/seedTaskOutputItems.js
