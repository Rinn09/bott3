const ShopItem = require("../../models/ShopItem"); // Đường dẫn tới model
const mongoose = require("mongoose");

require("dotenv").config(); // Để sử dụng biến môi trường
async function seedItems() {
  await ShopItem.findOneAndUpdate(
    { itemId: "phan-bon" },
    {
      itemId: "phan-bon",
      name: "Phân bón",
      description:
        "Giúp cây trồng phát triển nhanh hơn, giảm thời gian chờ thu hoạch.",
      buyPrice: 10000,
      sellPrice: 1000,
      consumable: true,
      requiredJob: "nông dân", // Ví dụ: chỉ nông dân mua được
      effects: {
        cooldownReduction: {
          targetTaskId: "thuHoach", // Ảnh hưởng task 'thuHoach'
          reductionTime: 30 * 60 * 1000, // Giảm 30 phút (30 * 60 * 1000 ms)
        },
      },
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Phân bón");

  await ShopItem.findOneAndUpdate(
    { itemId: "hat-giong" }, // Đặt ID khác nếu có nhiều loại hạt giống
    {
      itemId: "hat-giong",
      name: "Hạt giống",
      description:
        "Loại hạt giống đặc biệt, rút ngắn thời gian chờ gieo hạt tiếp theo.",
      buyPrice: 3000,
      sellPrice: 500,
      consumable: true,
      requiredJob: "nông dân", // Ví dụ: chỉ nông dân mua được
      effects: {
        cooldownReduction: {
          targetTaskId: "gieoHat", // Ảnh hưởng task 'gieoHat'
          reductionTime: 30 * 60 * 1000, // Giảm 1 giờ
        },
      },
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Hạt giống");

  await ShopItem.findOneAndUpdate(
    { itemId: "luoi-liem" },
    {
      itemId: "luoi-liem",
      name: "Lưỡi liềm",
      description: "Một công cụ hữu ích để thu hoạch cây trồng.",
      buyPrice: 15000,
      sellPrice: 3000,
      consumable: true,
      requiredJob: "nông dân", // Ví dụ: chỉ nông dân mua được
      effects: {
        cooldownReduction: {
          targetTaskId: "catCo", // Ảnh hưởng task 'thuHoach'
          reductionTime: 40 * 60 * 1000, // Giảm 1 giờ
        },
      },
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Lưỡi liềm");

  await ShopItem.findOneAndUpdate(
    { itemId: "kinh-lup" },
    {
      itemId: "kinh-lup",
      name: "kính lúp",
      description: "Một công cụ giúp bạn kiểm định và kiểm tra sản phẩm.",
      buyPrice: 10000,
      sellPrice: 0,
      consumable: true,
      requiredJob: ["công nhân", "kỹ sư"], // Ví dụ: chỉ công nhân, kỹ sư mua được
      effects: {
        cooldownReduction: {
          targetTaskId: ["kiemDinh", "kiemTra"], // Ảnh hưởng task 'kiemDinh', 'kiemTra'
          reductionTime: 60 * 60 * 1000, // Giảm 1 giờ
        },
      },
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Kính lúp");

  await ShopItem.findOneAndUpdate(
    { itemId: "toolkit" },
    {
      itemId: "toolkit",
      name: "Bộ dụng cụ",
      description: "Bộ dụng cụ hữu ích cho việc lắp ráp thiết bị.",
      buyPrice: 7000,
      sellPrice: 1500,
      consumable: true,
      requiredJob: "công nhân", // Ví dụ: chỉ kỹ sư mua được
      effects: {
        cooldownReduction: {
          targetTaskId: "lapRap", // Ảnh hưởng task 'kiemTra'
          reductionTime: 30 * 60 * 1000, // Giảm 30 phút
        },
      },
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Bộ dụng cụ");

  await ShopItem.findOneAndUpdate(
    { itemId: "laptop" },
    {
      itemId: "laptop",
      name: "Laptop",
      description: "Laptop giúp bạn làm việc hiệu quả hơn.",
      buyPrice: 150000,
      sellPrice: 5000,
      consumable: false,
      requiredJob: ["kỹ sư", "giáo viên"], // Ví dụ: chỉ kỹ sư mua được
      effects: {
        cooldownReduction: {
          targetTaskId: ["lapRap", "thietKe", "soanGiaoAn"], // Ảnh hưởng task 'kiemTra'
          reductionTime: 90 * 60 * 1000, // Giảm 1 giờ
        },
      },
    },
    { upsert: true, new: true },
  );

  console.log("✅ Đã tạo/cập nhật vật phẩm: Laptop");

  await ShopItem.findOneAndUpdate(
    { itemId: "roll_ticket" },
    {
      itemId: "roll_ticket",
      name: "Vé Roll Gacha",
      description:
        "Dùng vé này để quay Gacha VNGarage và có cơ hội nhận xe hoặc phụ tùng xịn!",
      buyPrice: 50000, // Đặt giá vé bạn muốn
      sellPrice: null, // Không thể bán lại cho shop
      consumable: true, // Sẽ bị tiêu hao khi dùng trong /roll
      marketable: false, // << QUAN TRỌNG: Không thể bán trên chợ
      dailyBuyLimit: 10, // << QUAN TRỌNG: Giới hạn mua 10 vé/ngày
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Vé Roll Gacha");

  await ShopItem.findOneAndUpdate(
    { itemId: "basic_metal_scrap" },
    {
      itemId: "basic_metal_scrap",
      name: "Mảnh Kim Loại Vụn",
      description: "Nguyên liệu cơ bản để chế tạo và sửa chữa.",
      buyPrice: 50, // Có thể mua từ shop
      sellPrice: 10, // Hoặc bán lại
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Mảnh Kim Loại Vụn");

  await ShopItem.findOneAndUpdate(
    { itemId: "common_repair_kit" },
    {
      itemId: "common_repair_kit",
      name: "Bộ Dụng Cụ Sửa Chữa Cơ Bản",
      description: "Dùng để thực hiện các tác vụ sửa chữa đơn giản.",
      buyPrice: 1000,
      sellPrice: 200,
      consumable: false, // Dụng cụ có thể không tiêu hao, hoặc có độ bền riêng (phức tạp hơn)
      requiredJob: ["thợ sửa xe"], // Chỉ thợ sửa xe mua được
      marketable: true,
      dailyBuyLimit: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Bộ Dụng Cụ Sửa Chữa Cơ Bản");

  // Item mở khóa chuyên môn hoặc công thức
  await ShopItem.findOneAndUpdate(
    { itemId: "engine_tuning_manual_vol1" },
    {
      itemId: "engine_tuning_manual_vol1",
      name: "Sách Hướng Dẫn Độ Máy - Tập 1",
      description:
        "Mở khóa một số công thức chế tạo hoặc task liên quan đến động cơ.",
      buyPrice: 50000,
      sellPrice: null,
      consumable: true, // Dùng 1 lần để học
      marketable: false, // Không cho bán trên chợ nếu là item "học"
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Sách Hướng Dẫn Độ Máy - Tập 1");

  await ShopItem.findOneAndUpdate(
    { itemId: "spark_plug_common" },
    {
      itemId: "spark_plug_common",
      name: "Bugi thông dụng",
      description: "Bugi thông dụng cho động cơ.",
      buyPrice: 10000,
      sellPrice: 5000,
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Bugi thông dụng");

  await ShopItem.findOneAndUpdate(
    { itemId: "air_filter_common" },
    {
      itemId: "air_filter_common",
      name: "Lọc gió thông dụng",
      description: "Lọc gió thông dụng cho động cơ.",
      buyPrice: 10000,
      sellPrice: 5000,
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Lọc gió thông dụng");

  await ShopItem.findOneAndUpdate(
    { itemId: "engine_oil_standard" },
    {
      itemId: "engine_oil_standard",
      name: "Dầu máy thông dụng",
      description: "Dầu máy thông dụng cho động cơ.",
      buyPrice: 10000,
      sellPrice: 5000,
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Dầu máy thông dụng");

  await ShopItem.findOneAndUpdate(
    { itemId: "oil_filter_common" },
    {
      itemId: "oil_filter_common",
      name: "Lọc dầu thông dụng",
      description: "Lọc dầu thông dụng.",
      buyPrice: 10000,
      sellPrice: 5000,
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Lọc dầu thông dụng");

  await ShopItem.findOneAndUpdate(
    { itemId: "brake_pads_standard" },
    {
      itemId: "brake_pads_standard",
      name: "Má phanh thông dụng",
      description: "Má phanh thông dụng cho động cơ.",
      buyPrice: 10000,
      sellPrice: 5000,
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Má phanh thông dụng");

  await ShopItem.findOneAndUpdate(
    { itemId: "brake_fluid_dot4" },
    {
      itemId: "brake_fluid_dot4",
      name: "Dầu phanh thông dụng",
      description: "Dầu phanh thông dụng cho động cơ.",
      buyPrice: 10000,
      sellPrice: 5000,
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Dầu phanh thông dụng");

  await ShopItem.findOneAndUpdate(
    { itemId: "battery_standard" },
    {
      itemId: "battery_standard",
      name: "Ắc quy thông dụng",
      description: "Ắc quy thông dụng cho động cơ.",
      buyPrice: 10000,
      sellPrice: 5000,
      consumable: true,
      marketable: true,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Ắc quy thông dụng");

  await ShopItem.findOneAndUpdate(
    { itemId: "engine_blueprints_common" }, // itemId này đã được dùng trong task craft
    {
      itemId: "engine_blueprints_common",
      name: "Bản Vẽ Phụ Tùng Động Cơ (Common)",
      description: "Bản vẽ chi tiết để chế tạo một phụ tùng động cơ cấp thấp.",
      buyPrice: 15000, // Ví dụ
      sellPrice: 1500,
      consumable: true, // Dùng 1 lần cho 1 lần craft
      marketable: true,
      // requiredJob: ["kỹ sư", "thợ sửa xe"], // Có thể giới hạn người mua
    },
    { upsert: true, new: true },
  );
  console.log("✅ Đã tạo/cập nhật vật phẩm: Bản Vẽ Phụ Tùng Động Cơ (Common)");
}
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ Kết nối MongoDB thành công. Bắt đầu seed dữ liệu...");
    seedItems().then(() => {
      console.log("🌾 Seed dữ liệu cửa hàng hoàn tất.");
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
  });

//node src/database/seeds/seedShopItems.js
