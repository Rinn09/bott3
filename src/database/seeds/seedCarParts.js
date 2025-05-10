const mongoose = require("mongoose");
const PartDefinition = require("../../models/PartDefinition");
require("dotenv").config();

async function seedCarParts() {
  console.log("Seeding Parts...");

  // Engines

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_c_i4_1.6l_stock" },
    {
      partId: "engine_c_i4_1.6l_stock",
      name: "Động Cơ I4 1.6L Nguyên Bản",
      description:
        "Động cơ 4 xi-lanh thẳng hàng 1.6L cơ bản, phổ biến trên nhiều dòng xe.",
      rarity: "common",
      partType: "engine",
      statModifiers: {
        speed: 5,
        acceleration: 0.15,
        handling: 0,
        durability: 3,
      },
      imageUrl: "https://i.imgur.com/UPAnv71.png", // Placeholder generic engine
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ I4 1.6L Nguyên Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_c_i3_1.2l_eco" },
    {
      partId: "engine_c_i3_1.2l_eco",
      name: "Động Cơ I3 1.2L Tiết Kiệm",
      description:
        "Khối động cơ 3 xi-lanh nhỏ gọn, ưu tiên hiệu quả nhiên liệu.",
      rarity: "common",
      partType: "engine",
      statModifiers: {
        speed: 3,
        acceleration: 0.1,
        handling: 1,
        durability: 1,
      },
      imageUrl: "https://i.imgur.com/nCXZgYg.png", // Placeholder small engine
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ I3 1.2L Tiết Kiệm");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_c_diesel_2.2l_utility" },
    {
      partId: "engine_c_diesel_2.2l_utility",
      name: "Động Cơ Diesel 2.2L Đa Dụng",
      description:
        "Động cơ diesel bền bỉ, phù hợp cho xe bán tải và SUV cỡ nhỏ.",
      rarity: "common",
      partType: "engine",
      statModifiers: {
        speed: 2,
        acceleration: -0.1,
        handling: -1,
        durability: 8,
      }, // Diesel thường tăng tốc chậm hơn chút
      imageUrl: "https://i.imgur.com/sKLMno4.png", // Placeholder diesel engine
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ Diesel 2.2L Đa Dụng");

  // Uncommon Engines (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "engine_uc_i4_2.0l_turbo_street" },
    {
      partId: "engine_uc_i4_2.0l_turbo_street",
      name: "Động Cơ I4 2.0L Turbo Đường Phố",
      description:
        "Động cơ tăng áp 2.0L phổ biến, mang lại sự cải thiện hiệu suất đáng kể.",
      rarity: "uncommon",
      partType: "engine",
      statModifiers: {
        speed: 12,
        acceleration: 0.35,
        handling: -1,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/aBcDeFg.png", // Placeholder I4 Turbo
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ I4 2.0L Turbo Đường Phố");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_uc_v6_3.5l_naturally_aspirated" },
    {
      partId: "engine_uc_v6_3.5l_naturally_aspirated",
      name: "Động Cơ V6 3.5L Hút Khí Tự Nhiên",
      description:
        "Khối động cơ V6 dung tích lớn, cho sức mạnh mượt mà và đáng tin cậy.",
      rarity: "uncommon",
      partType: "engine",
      statModifiers: {
        speed: 10,
        acceleration: 0.2,
        handling: -2,
        durability: 12,
      },
      imageUrl: "https://i.imgur.com/hIjKlMn.png", // Placeholder V6 NA
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ V6 3.5L Hút Khí Tự Nhiên");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_uc_boxer_2.0l_tuned" },
    {
      partId: "engine_uc_boxer_2.0l_tuned",
      name: "Động Cơ Boxer 2.0L Tinh Chỉnh Nhẹ",
      description:
        "Động cơ Boxer với trọng tâm thấp, được tinh chỉnh để tăng thêm chút công suất.",
      rarity: "uncommon",
      partType: "engine",
      statModifiers: {
        speed: 8,
        acceleration: 0.3,
        handling: 2,
        durability: 6,
      },
      imageUrl: "https://i.imgur.com/oPqRsTu.png", // Placeholder Boxer engine
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ Boxer 2.0L Tinh Chỉnh Nhẹ");

  // Rare Engines (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "engine_r_i6_3.0l_inline_turbo" },
    {
      partId: "engine_r_i6_3.0l_inline_turbo",
      name: "Động Cơ I6 3.0L Turbo Inline",
      description:
        "Động cơ 6 xi-lanh thẳng hàng tăng áp, nổi tiếng với sự mượt mà và tiềm năng công suất lớn (ví dụ: BMW B58).",
      rarity: "rare",
      partType: "engine",
      statModifiers: {
        speed: 25,
        acceleration: 0.6,
        handling: -2,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/sTuVwXy.png", // Placeholder I6 Turbo
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ I6 3.0L Turbo Inline");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_r_v8_4.0l_twin_turbo_amg_spec" },
    {
      partId: "engine_r_v8_4.0l_twin_turbo_amg_spec",
      name: "Động Cơ V8 4.0L Twin-Turbo (AMG Spec)",
      description:
        "Trái tim của nhiều mẫu xe hiệu suất cao AMG, công suất và mô-men xoắn ấn tượng.",
      rarity: "rare",
      partType: "engine",
      statModifiers: {
        speed: 30,
        acceleration: 0.7,
        handling: -4,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/dEfGhIj.png", // Placeholder V8 Twin-Turbo
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ V8 4.0L Twin-Turbo (AMG Spec)");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_r_rotary_13b_rew_tuned" },
    {
      partId: "engine_r_rotary_13b_rew_tuned",
      name: "Động Cơ Rotary 13B-REW Tinh Chỉnh",
      description:
        "Động cơ xoay huyền thoại từ Mazda RX-7, được tinh chỉnh để đạt vòng tua cao và công suất lớn.",
      rarity: "rare",
      partType: "engine",
      statModifiers: {
        speed: 20,
        acceleration: 0.8,
        handling: 1,
        durability: -5,
      }, // Rotary thường cần bảo dưỡng kỹ
      imageUrl: "https://i.imgur.com/fGhIjKl.png", // Placeholder Rotary engine
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ Rotary 13B-REW Tinh Chỉnh");

  // Epic Engines (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "engine_e_v10_5.2l_fsi_huracan" },
    {
      partId: "engine_e_v10_5.2l_fsi_huracan",
      name: "Động Cơ V10 5.2L FSI (Huracan/R8)",
      description:
        "Khối động cơ V10 hút khí tự nhiên gầm rú, linh hồn của Lamborghini Huracan và Audi R8.",
      rarity: "epic",
      partType: "engine",
      statModifiers: {
        speed: 45,
        acceleration: 1.0,
        handling: -6,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/jKlMnOp.png", // Placeholder V10 engine
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ V10 5.2L FSI (Huracan/R8)");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_e_v8_3.9l_twin_turbo_ferrari" },
    {
      partId: "engine_e_v8_3.9l_twin_turbo_ferrari",
      name: "Động Cơ V8 3.9L Twin-Turbo (Ferrari F154)",
      description:
        "Động cơ V8 tăng áp kép từng đoạt nhiều giải thưởng của Ferrari, trang bị trên 488/F8.",
      rarity: "epic",
      partType: "engine",
      statModifiers: {
        speed: 50,
        acceleration: 1.1,
        handling: -5,
        durability: 7,
      },
      imageUrl: "https://i.imgur.com/kLmNoPq.png", // Placeholder Ferrari V8
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Động Cơ V8 3.9L Twin-Turbo (Ferrari F154)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_e_flat6_4.0l_gt3_porsche" },
    {
      partId: "engine_e_flat6_4.0l_gt3_porsche",
      name: "Động Cơ Flat-6 4.0L (Porsche GT3)",
      description:
        "Động cơ 6 xi-lanh đối đỉnh hút khí tự nhiên vòng tua cao, đặc trưng của Porsche 911 GT3.",
      rarity: "epic",
      partType: "engine",
      statModifiers: {
        speed: 40,
        acceleration: 0.9,
        handling: 3,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/mNoPqRs.png", // Placeholder Porsche Flat-6
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ Flat-6 4.0L (Porsche GT3)");

  // Legendary Engines (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "engine_l_v12_6.5l_aventador_na" },
    {
      partId: "engine_l_v12_6.5l_aventador_na",
      name: "Động Cơ V12 6.5L Hút Khí Tự Nhiên (Aventador)",
      description:
        "Cỗ máy V12 gào thét của Lamborghini Aventador, một biểu tượng sức mạnh.",
      rarity: "legendary",
      partType: "engine",
      statModifiers: {
        speed: 65,
        acceleration: 1.5,
        handling: -10,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/nOpQrSt.png", // Placeholder Lambo V12
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Động Cơ V12 6.5L Hút Khí Tự Nhiên (Aventador)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_l_w16_8.0l_quad_turbo_bugatti" },
    {
      partId: "engine_l_w16_8.0l_quad_turbo_bugatti",
      name: "Động Cơ W16 8.0L Quad-Turbo (Bugatti)",
      description:
        "Kiệt tác kỹ thuật với 16 xi-lanh và 4 bộ tăng áp, trái tim của những chiếc Bugatti triệu đô.",
      rarity: "legendary",
      partType: "engine",
      statModifiers: {
        speed: 80,
        acceleration: 1.8,
        handling: -12,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/pQrStUv.png", // Placeholder Bugatti W16
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Động Cơ W16 8.0L Quad-Turbo (Bugatti)");

  await PartDefinition.findOneAndUpdate(
    { partId: "engine_l_cosworth_v12_hybrid_valkyrie" },
    {
      partId: "engine_l_cosworth_v12_hybrid_valkyrie",
      name: "Động Cơ Cosworth V12 Hybrid (Valkyrie Spec)",
      description:
        "Động cơ V12 hút khí tự nhiên vòng tua cực cao kết hợp hệ thống hybrid, phát triển bởi Cosworth cho Aston Martin Valkyrie.",
      rarity: "legendary",
      partType: "engine",
      statModifiers: {
        speed: 70,
        acceleration: 1.6,
        handling: -8,
        durability: 3,
      }, // Động cơ xe đua thường ít bền hơn
      imageUrl: "https://i.imgur.com/qRsTuVw.png", // Placeholder Cosworth V12
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Động Cơ Cosworth V12 Hybrid (Valkyrie Spec)",
  );

  // Tires

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_c_all_season_standard" },
    {
      partId: "tires_c_all_season_standard",
      name: "Lốp 4 Mùa Tiêu Chuẩn",
      description:
        "Lốp đa dụng cơ bản, phù hợp cho việc đi lại hàng ngày trong nhiều điều kiện thời tiết.",
      rarity: "common",
      partType: "tires",
      statModifiers: {
        speed: 0,
        acceleration: 0.05,
        handling: 5,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/9qL0pW7.png", // Placeholder all-season tire
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp 4 Mùa Tiêu Chuẩn");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_c_eco_low_resistance" },
    {
      partId: "tires_c_eco_low_resistance",
      name: "Lốp Tiết Kiệm Nhiên Liệu Lực Cản Thấp",
      description:
        "Thiết kế để giảm lực cản lăn, giúp xe tiết kiệm nhiên liệu hơn một chút.",
      rarity: "common",
      partType: "tires",
      statModifiers: {
        speed: 1,
        acceleration: -0.05,
        handling: 3,
        durability: 8,
      }, // Ít bám hơn
      imageUrl: "https://i.imgur.com/R2dC3xS.png", // Placeholder eco tire
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Tiết Kiệm Nhiên Liệu Lực Cản Thấp");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_c_touring_comfort" },
    {
      partId: "tires_c_touring_comfort",
      name: "Lốp Touring Êm Ái",
      description:
        "Mang lại sự thoải mái và giảm tiếng ồn cho những chuyến đi dài.",
      rarity: "common",
      partType: "tires",
      statModifiers: {
        speed: -1,
        acceleration: 0,
        handling: 4,
        durability: 12,
      },
      imageUrl: "https://i.imgur.com/T5eF6gH.png", // Placeholder touring tire
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Touring Êm Ái");

  // Uncommon Tires (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "tires_uc_all_terrain_light" },
    {
      partId: "tires_uc_all_terrain_light",
      name: "Lốp Đa Địa Hình Hạng Nhẹ (A/T Light)",
      description: "Cung cấp độ bám tốt hơn trên đường xấu và off-road nhẹ.",
      rarity: "uncommon",
      partType: "tires",
      statModifiers: {
        speed: -2,
        acceleration: -0.1,
        handling: 8,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/Y7uJkL0.png", // Placeholder A/T tire
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Đa Địa Hình Hạng Nhẹ (A/T Light)");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_uc_performance_summer" },
    {
      partId: "tires_uc_performance_summer",
      name: "Lốp Hiệu Suất Mùa Hè",
      description:
        "Độ bám đường tốt trên mặt đường khô, cải thiện khả năng xử lý ở tốc độ cao.",
      rarity: "uncommon",
      partType: "tires",
      statModifiers: {
        speed: 2,
        acceleration: 0.15,
        handling: 10,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/P0oN1mZ.png", // Placeholder summer performance
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Hiệu Suất Mùa Hè");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_uc_reinforced_sidewall" },
    {
      partId: "tires_uc_reinforced_sidewall",
      name: "Lốp Thành Lốp Gia Cố",
      description:
        "Tăng độ cứng cho thành lốp, cải thiện phản hồi lái và độ bền.",
      rarity: "uncommon",
      partType: "tires",
      statModifiers: {
        speed: 0,
        acceleration: 0.05,
        handling: 6,
        durability: 18,
      },
      imageUrl: "https://i.imgur.com/V8bN2kM.png", // Placeholder reinforced tire
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Thành Lốp Gia Cố");

  // Rare Tires (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "tires_r_ultra_high_performance_uhp" },
    {
      partId: "tires_r_ultra_high_performance_uhp",
      name: "Lốp Siêu Hiệu Suất Cao (UHP)",
      description:
        "Dành cho xe thể thao, cung cấp độ bám đường và khả năng xử lý vượt trội (ví dụ: Michelin Pilot Sport 4S).",
      rarity: "rare",
      partType: "tires",
      statModifiers: {
        speed: 3,
        acceleration: 0.25,
        handling: 15,
        durability: 0,
      },
      imageUrl: "https://i.imgur.com/F3oP5qR.png", // Placeholder UHP tire
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Siêu Hiệu Suất Cao (UHP)");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_r_semi_slick_street_legal" },
    {
      partId: "tires_r_semi_slick_street_legal",
      name: "Lốp Semi-Slick Hợp Pháp Đường Phố",
      description:
        "Độ bám cực cao cho track day nhưng vẫn có thể sử dụng hàng ngày (ví dụ: Toyo R888R).",
      rarity: "rare",
      partType: "tires",
      statModifiers: {
        speed: 4,
        acceleration: 0.3,
        handling: 18,
        durability: -5,
      }, // Nhanh mòn
      imageUrl: "https://i.imgur.com/A9sD4eF.png", // Placeholder semi-slick
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Semi-Slick Hợp Pháp Đường Phố");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_r_mud_terrain_aggressive" },
    {
      partId: "tires_r_mud_terrain_aggressive",
      name: "Lốp Địa Hình Bùn Lầy Hầm Hố (M/T)",
      description:
        "Thiết kế gai lốp lớn, chuyên trị các cung đường off-road khắc nghiệt (ví dụ: BFGoodrich KM3).",
      rarity: "rare",
      partType: "tires",
      statModifiers: {
        speed: -5,
        acceleration: -0.2,
        handling: 10,
        durability: 25,
      }, // Chạy đường nhựa chậm và ồn
      imageUrl: "https://i.imgur.com/JkL0pWq.png", // Placeholder M/T tire
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Địa Hình Bùn Lầy Hầm Hố (M/T)");

  // Epic Tires (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "tires_e_racing_slick_soft_compound" },
    {
      partId: "tires_e_racing_slick_soft_compound",
      name: "Lốp Trơn Đường Đua (Hợp Chất Mềm)",
      description:
        "Lốp slick chuyên dụng cho đua xe với hợp chất mềm, bám đường tối đa trong thời gian ngắn (ví dụ: Pirelli P Zero Soft).",
      rarity: "epic",
      partType: "tires",
      statModifiers: {
        speed: 6,
        acceleration: 0.4,
        handling: 22,
        durability: -15,
      }, // Rất nhanh mòn
      imageUrl: "https://i.imgur.com/N1mZ2kO.png", // Placeholder racing slick soft
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Trơn Đường Đua (Hợp Chất Mềm)");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_e_run_flat_performance_gen3" },
    {
      partId: "tires_e_run_flat_performance_gen3",
      name: "Lốp Chống Xịt Run-Flat Hiệu Suất Thế Hệ 3",
      description:
        "Công nghệ run-flat tiên tiến, cho phép tiếp tục di chuyển khi bị thủng mà vẫn giữ hiệu suất tốt (ví dụ: Bridgestone DriveGuard Gen 3).",
      rarity: "epic",
      partType: "tires",
      statModifiers: {
        speed: 1,
        acceleration: 0.1,
        handling: 12,
        durability: 30,
      }, // Bền hơn, nặng hơn chút
      imageUrl: "https://i.imgur.com/X5yH7uJ.png", // Placeholder run-flat
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Lốp Chống Xịt Run-Flat Hiệu Suất Thế Hệ 3",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_e_custom_forged_aero_wheels" }, // Kết hợp mâm xe
    {
      partId: "tires_e_custom_forged_aero_wheels",
      name: "Bộ Lốp Kèm Mâm Rèn Khí Động Học Tùy Chỉnh",
      description:
        "Lốp hiệu suất cao đi kèm mâm rèn siêu nhẹ với thiết kế khí động học đặc biệt.",
      rarity: "epic",
      partType: "tires", // Vẫn là lốp nhưng ám chỉ cả bộ
      statModifiers: {
        speed: 5,
        acceleration: 0.25,
        handling: 16,
        durability: -2,
      },
      imageUrl: "https://i.imgur.com/S8tF0gH.png", // Placeholder aero wheels with tires
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Bộ Lốp Kèm Mâm Rèn Khí Động Học Tùy Chỉnh",
  );

  // Legendary Tires (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "tires_l_f1_grade_pirelli_cincurato" }, // Giả định là lốp F1 cho đường ướt
    {
      partId: "tires_l_f1_grade_pirelli_cincurato",
      name: "Lốp Pirelli Cinturato Công Nghệ F1 (Đường Ướt)",
      description:
        "Lốp xe đua Công thức 1 được điều chỉnh cho hypercar, chuyên trị trời mưa.",
      rarity: "legendary",
      partType: "tires",
      statModifiers: {
        speed: 2,
        acceleration: 0.3,
        handling: 25,
        durability: -8,
      }, // Cực bám đường ướt
      imageUrl: "https://i.imgur.com/W3xY9uJ.png", // Placeholder F1 wet tire
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Lốp Pirelli Cinturato Công Nghệ F1 (Đường Ướt)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_l_michelin_cup_3_connect" }, // Lốp Cup 2 Connect có cảm biến
    {
      partId: "tires_l_michelin_cup_3_connect",
      name: "Lốp Michelin Pilot Sport Cup 3 Connect",
      description:
        "Lốp semi-slick thế hệ mới với công nghệ kết nối, theo dõi và tối ưu hiệu suất theo thời gian thực.",
      rarity: "legendary",
      partType: "tires",
      statModifiers: {
        speed: 7,
        acceleration: 0.5,
        handling: 28,
        durability: -10,
      },
      imageUrl: "https://i.imgur.com/K0pWqXs.png", // Placeholder Michelin Cup Connect
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Michelin Pilot Sport Cup 3 Connect");

  await PartDefinition.findOneAndUpdate(
    { partId: "tires_l_airless_concept_tweel" }, // Lốp không hơi
    {
      partId: "tires_l_airless_concept_tweel",
      name: "Lốp Concept Không Hơi (Tweel)",
      description:
        "Công nghệ lốp không cần bơm hơi, loại bỏ nguy cơ xịt lốp và siêu bền (ví dụ: Michelin Tweel).",
      rarity: "legendary",
      partType: "tires",
      statModifiers: {
        speed: -2,
        acceleration: -0.1,
        handling: 10,
        durability: 100,
      }, // Có thể nặng hơn, nhưng siêu bền
      imageUrl: "https://i.imgur.com/C5dF8gH.png", // Placeholder Tweel
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lốp Concept Không Hơi (Tweel)");

  // --- ECUs ---

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_c_oem_standard_map" },
    {
      partId: "ecu_c_oem_standard_map",
      name: "ECU Map Zin Theo Xe",
      description:
        "Chương trình điều khiển động cơ cơ bản từ nhà sản xuất, đảm bảo vận hành ổn định.",
      rarity: "common",
      partType: "ecu",
      statModifiers: {
        speed: 1,
        acceleration: 0.02,
        handling: 0,
        durability: 2,
      },
      imageUrl: "https://i.imgur.com/oPqRsTu_ecu.png", // Placeholder generic ECU
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: ECU Map Zin Theo Xe");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_c_basic_reflash_chip" },
    {
      partId: "ecu_c_basic_reflash_chip",
      name: "Chip Reflash ECU Cơ Bản",
      description:
        "Một bản reflash nhẹ nhàng để cải thiện một chút phản hồi động cơ.",
      rarity: "common",
      partType: "ecu",
      statModifiers: {
        speed: 3,
        acceleration: 0.05,
        handling: 1,
        durability: 0,
      },
      imageUrl: "https://i.imgur.com/nCXZgYg_ecu.png", // Placeholder ECU chip
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Chip Reflash ECU Cơ Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_c_economy_tune_module" },
    {
      partId: "ecu_c_economy_tune_module",
      name: "Module Tune Tiết Kiệm Nhiên Liệu",
      description:
        "Tối ưu hóa việc phun xăng để giảm tiêu hao nhiên liệu, có thể hy sinh chút ít công suất.",
      rarity: "common",
      partType: "ecu",
      statModifiers: {
        speed: -1,
        acceleration: -0.03,
        handling: 0,
        durability: 3,
      },
      imageUrl: "https://i.imgur.com/sKLMno4_ecu.png", // Placeholder economy ECU
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Module Tune Tiết Kiệm Nhiên Liệu");

  // Uncommon ECUs (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_uc_stage1_performance_chip" },
    {
      partId: "ecu_uc_stage1_performance_chip",
      name: "Chip Hiệu Suất Stage 1",
      description:
        "Bản nâng cấp ECU phổ biến, giải phóng thêm một phần công suất tiềm ẩn của động cơ.",
      rarity: "uncommon",
      partType: "ecu",
      statModifiers: {
        speed: 8,
        acceleration: 0.15,
        handling: 1,
        durability: -1,
      },
      imageUrl: "https://i.imgur.com/aBcDeFg_ecu.png", // Placeholder Stage 1 ECU
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Chip Hiệu Suất Stage 1");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_uc_piggyback_controller_basic" },
    {
      partId: "ecu_uc_piggyback_controller_basic",
      name: "Bộ Điều Khiển Piggyback Cơ Bản",
      description:
        "Can thiệp vào tín hiệu cảm biến để điều chỉnh thông số động cơ, dễ lắp đặt.",
      rarity: "uncommon",
      partType: "ecu",
      statModifiers: {
        speed: 6,
        acceleration: 0.1,
        handling: 0,
        durability: 0,
      },
      imageUrl: "https://i.imgur.com/hIjKlMn_ecu.png", // Placeholder Piggyback ECU
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Điều Khiển Piggyback Cơ Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_uc_throttle_response_enhancer" },
    {
      partId: "ecu_uc_throttle_response_enhancer",
      name: "Bộ Tăng Cường Phản Hồi Ga",
      description:
        'Giúp bướm ga phản ứng nhanh nhạy hơn, tạo cảm giác xe "bốc" hơn.',
      rarity: "uncommon",
      partType: "ecu",
      statModifiers: {
        speed: 2,
        acceleration: 0.2,
        handling: 2,
        durability: -1,
      }, // Chỉ tăng cảm giác, ít ảnh hưởng công suất thực
      imageUrl: "https://i.imgur.com/oPqRsTu_ecu.png", // Placeholder throttle enhancer
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Tăng Cường Phản Hồi Ga");

  // Rare ECUs (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_r_standalone_street_tune" },
    {
      partId: "ecu_r_standalone_street_tune",
      name: "ECU Độc Lập Tune Đường Phố (Ví dụ: Haltech Elite 550)",
      description:
        "ECU thay thế hoàn toàn, cho phép tùy chỉnh sâu các thông số động cơ cho mục đích đường phố.",
      rarity: "rare",
      partType: "ecu",
      statModifiers: {
        speed: 15,
        acceleration: 0.3,
        handling: 2,
        durability: -2,
      },
      imageUrl: "https://i.imgur.com/sTuVwXy_ecu.png", // Placeholder Standalone ECU
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: ECU Độc Lập Tune Đường Phố");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_r_racechip_gts_black" },
    {
      partId: "ecu_r_racechip_gts_black",
      name: "RaceChip GTS Black",
      description:
        "Chip tuning cao cấp từ RaceChip, tối ưu hóa đáng kể công suất và mô-men xoắn.",
      rarity: "rare",
      partType: "ecu",
      statModifiers: {
        speed: 18,
        acceleration: 0.35,
        handling: 1,
        durability: -3,
      },
      imageUrl: "https://i.imgur.com/dEfGhIj_ecu.png", // Placeholder RaceChip
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: RaceChip GTS Black");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_r_custom_dyno_tune_map" },
    {
      partId: "ecu_r_custom_dyno_tune_map",
      name: "Map ECU Tùy Chỉnh Trên Dyno",
      description:
        "Bản map được tinh chỉnh chuyên nghiệp trên dàn dyno để đạt hiệu suất tối ưu cho xe cụ thể.",
      rarity: "rare",
      partType: "ecu",
      statModifiers: {
        speed: 20,
        acceleration: 0.4,
        handling: 3,
        durability: -2,
      },
      imageUrl: "https://i.imgur.com/fGhIjKl_ecu.png", // Placeholder dyno tune
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Map ECU Tùy Chỉnh Trên Dyno");

  // Epic ECUs (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_e_motec_m130_standalone" },
    {
      partId: "ecu_e_motec_m130_standalone",
      name: "ECU MoTeC M130 Độc Lập",
      description:
        "ECU chuyên dụng cho xe đua, khả năng tùy chỉnh không giới hạn và thu thập dữ liệu chuyên sâu.",
      rarity: "epic",
      partType: "ecu",
      statModifiers: {
        speed: 28,
        acceleration: 0.6,
        handling: 4,
        durability: -4,
      },
      imageUrl: "https://i.imgur.com/jKlMnOp_ecu.png", // Placeholder MoTeC ECU
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: ECU MoTeC M130 Độc Lập");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_e_syvecs_s7i_standalone_pro" },
    {
      partId: "ecu_e_syvecs_s7i_standalone_pro",
      name: "ECU Syvecs S7i Độc Lập Pro",
      description:
        "Một trong những ECU aftermarket mạnh mẽ nhất, tích hợp nhiều tính năng kiểm soát nâng cao.",
      rarity: "epic",
      partType: "ecu",
      statModifiers: {
        speed: 30,
        acceleration: 0.65,
        handling: 5,
        durability: -5,
      },
      imageUrl: "https://i.imgur.com/kLmNoPq_ecu.png", // Placeholder Syvecs ECU
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: ECU Syvecs S7i Độc Lập Pro");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_e_bosch_motorsport_mdg1" },
    {
      partId: "ecu_e_bosch_motorsport_mdg1",
      name: "ECU Bosch Motorsport MDG1",
      description:
        "Công nghệ ECU từ Bosch Motorsport, được tin dùng trong nhiều giải đua chuyên nghiệp.",
      rarity: "epic",
      partType: "ecu",
      statModifiers: {
        speed: 25,
        acceleration: 0.55,
        handling: 3,
        durability: 0,
      }, // Bosch thường tập trung độ tin cậy
      imageUrl: "https://i.imgur.com/mNoPqRs_ecu.png", // Placeholder Bosch ECU
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: ECU Bosch Motorsport MDG1");

  // Legendary ECUs (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_l_cosworth_antares_8_pro_race" },
    {
      partId: "ecu_l_cosworth_antares_8_pro_race",
      name: "ECU Cosworth Antares 8 Pro Race",
      description:
        "ECU đỉnh cao từ Cosworth, sử dụng trong các giải đua F1 và hypercar, khả năng xử lý dữ liệu cực nhanh.",
      rarity: "legendary",
      partType: "ecu",
      statModifiers: {
        speed: 35,
        acceleration: 0.8,
        handling: 6,
        durability: -3,
      },
      imageUrl: "https://i.imgur.com/nOpQrSt_ecu.png", // Placeholder Cosworth ECU
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: ECU Cosworth Antares 8 Pro Race");

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_l_magneti_marelli_marvel_12_f1_spec" },
    {
      partId: "ecu_l_magneti_marelli_marvel_12_f1_spec",
      name: "ECU Magneti Marelli Marvel 12 (F1 Spec)",
      description:
        "Công nghệ ECU trực tiếp từ đường đua Công thức 1, tối ưu hóa tuyệt đối cho hiệu suất.",
      rarity: "legendary",
      partType: "ecu",
      statModifiers: {
        speed: 40,
        acceleration: 0.9,
        handling: 7,
        durability: -6,
      }, // Đồ F1 thường mỏng manh
      imageUrl: "https://i.imgur.com/pQrStUv_ecu.png", // Placeholder F1 ECU
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: ECU Magneti Marelli Marvel 12 (F1 Spec)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "ecu_l_ai_predictive_quantum_processor" },
    {
      partId: "ecu_l_ai_predictive_quantum_processor",
      name: "Bộ Xử Lý Lượng Tử AI Tiên Đoán",
      description:
        "ECU thử nghiệm với trí tuệ nhân tạo và xử lý lượng tử, có khả năng tiên đoán và thích ứng với mọi điều kiện lái.",
      rarity: "legendary",
      partType: "ecu",
      statModifiers: {
        speed: 30,
        acceleration: 1.2,
        handling: 8,
        durability: 5,
      }, // AI giúp tối ưu và bảo vệ
      imageUrl: "https://i.imgur.com/qRsTuVw_ecu.png", // Placeholder Quantum AI ECU
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Xử Lý Lượng Tử AI Tiên Đoán");

  // --- Nitro ---

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_c_basic_5lb_single_shot" },
    {
      partId: "nitro_c_basic_5lb_single_shot",
      name: "Bình Nitro Cơ Bản 5lb (1 Lần Phun)",
      description:
        "Một cú hích nhỏ từ bình NOS 5lb, đủ cho một pha bứt tốc ngắn.",
      rarity: "common",
      partType: "nitro",
      statModifiers: {
        speed: 20,
        acceleration: 0.4,
        handling: -2,
        durability: -1,
      },
      imageUrl: "https://i.imgur.com/JkL0pWq_nitro.png", // Placeholder small nitro tank
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bình Nitro Cơ Bản 5lb (1 Lần Phun)");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_c_diy_backyard_kit" },
    {
      partId: "nitro_c_diy_backyard_kit",
      name: "Bộ Nitro Tự Chế Sân Sau",
      description: "Hệ thống NOS tự chế, không ổn định lắm nhưng giá rẻ.",
      rarity: "common",
      partType: "nitro",
      statModifiers: {
        speed: 15,
        acceleration: 0.3,
        handling: -3,
        durability: -3,
      }, // Kém ổn định
      imageUrl: "https://i.imgur.com/A9sD4eF_nitro.png", // Placeholder DIY nitro kit
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Nitro Tự Chế Sân Sau");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_c_small_purge_valve" },
    {
      partId: "nitro_c_small_purge_valve",
      name: "Van Xả Nitro Nhỏ",
      description:
        "Van xả cơ bản giúp loại bỏ không khí khỏi đường ống NOS, tăng chút hiệu quả.",
      rarity: "common",
      partType: "nitro", // Có thể coi là phụ kiện nitro
      statModifiers: {
        speed: 5,
        acceleration: 0.1,
        handling: 0,
        durability: 0,
      }, // Ít ảnh hưởng trực tiếp
      imageUrl: "https://i.imgur.com/N1mZ2kO_nitro.png", // Placeholder purge valve
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Van Xả Nitro Nhỏ");

  // Uncommon Nitro Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_uc_street_legal_10lb_kit_nos" }, // NOS là một thương hiệu nổi tiếng
    {
      partId: "nitro_uc_street_legal_10lb_kit_nos",
      name: "Bộ Nitro Đường Phố 10lb (NOS Brand)",
      description:
        "Hệ thống NOS 10lb đáng tin cậy từ thương hiệu NOS, hợp pháp cho đường phố.",
      rarity: "uncommon",
      partType: "nitro",
      statModifiers: {
        speed: 30,
        acceleration: 0.6,
        handling: -3,
        durability: -2,
      },
      imageUrl: "https://i.imgur.com/X5yH7uJ_nitro.png", // Placeholder NOS brand tank
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Nitro Đường Phố 10lb (NOS Brand)");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_uc_progressive_controller_basic" },
    {
      partId: "nitro_uc_progressive_controller_basic",
      name: "Bộ Điều Khiển Nitro Lũy Tiến Cơ Bản",
      description:
        "Cho phép điều chỉnh lượng NOS phun theo thời gian, giúp kiểm soát tốt hơn.",
      rarity: "uncommon",
      partType: "nitro",
      statModifiers: {
        speed: 25,
        acceleration: 0.7,
        handling: -1,
        durability: -1,
      }, // Cải thiện handling khi dùng nitro
      imageUrl: "https://i.imgur.com/S8tF0gH_nitro.png", // Placeholder progressive controller
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Điều Khiển Nitro Lũy Tiến Cơ Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_uc_bottle_warmer_standard" },
    {
      partId: "nitro_uc_bottle_warmer_standard",
      name: "Bộ Hâm Nóng Bình Nitro Tiêu Chuẩn",
      description:
        "Giữ cho bình NOS ở nhiệt độ tối ưu, đảm bảo áp suất phun ổn định.",
      rarity: "uncommon",
      partType: "nitro",
      statModifiers: {
        speed: 10,
        acceleration: 0.2,
        handling: 0,
        durability: 1,
      }, // Tăng hiệu quả NOS
      imageUrl: "https://i.imgur.com/W3xY9uJ_nitro.png", // Placeholder bottle warmer
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Hâm Nóng Bình Nitro Tiêu Chuẩn");

  // Rare Nitro Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_r_zex_blackout_kit_12lb" }, // ZEX là một thương hiệu khác
    {
      partId: "nitro_r_zex_blackout_kit_12lb",
      name: "Bộ Nitro ZEX Blackout 12lb",
      description:
        "Hệ thống phun nitro hiệu suất cao từ ZEX, thiết kế màu đen hầm hố.",
      rarity: "rare",
      partType: "nitro",
      statModifiers: {
        speed: 45,
        acceleration: 0.9,
        handling: -4,
        durability: -3,
      },
      imageUrl: "https://i.imgur.com/K0pWqXs_nitro.png", // Placeholder ZEX kit
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Nitro ZEX Blackout 12lb");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_r_nx_proton_fly_by_wire_kit" }, // Nitrous Express (NX)
    {
      partId: "nitro_r_nx_proton_fly_by_wire_kit",
      name: "Bộ Nitro NX Proton Fly-By-Wire",
      description:
        "Hệ thống phun nitro tiên tiến của Nitrous Express, tương thích với bướm ga điện tử.",
      rarity: "rare",
      partType: "nitro",
      statModifiers: {
        speed: 50,
        acceleration: 1.0,
        handling: -3,
        durability: -2,
      },
      imageUrl: "https://i.imgur.com/C5dF8gH_nitro.png", // Placeholder NX kit
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Nitro NX Proton Fly-By-Wire");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_r_dual_stage_direct_port_injection" },
    {
      partId: "nitro_r_dual_stage_direct_port_injection",
      name: "Hệ Thống Nitro Hai Giai Đoạn Phun Trực Tiếp",
      description:
        "Phun NOS trực tiếp vào từng xi-lanh với hai giai đoạn, cho sức mạnh cực lớn và chính xác.",
      rarity: "rare",
      partType: "nitro",
      statModifiers: {
        speed: 60,
        acceleration: 1.3,
        handling: -5,
        durability: -4,
      },
      imageUrl: "https://i.imgur.com/oPqRsTu_nitro_direct.png", // Placeholder direct port nitro
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Nitro Hai Giai Đoạn Phun Trực Tiếp",
  );

  // Epic Nitro Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_e_holley_efi_dominator_nos_control" }, // Holley EFI
    {
      partId: "nitro_e_holley_efi_dominator_nos_control",
      name: "Bộ Điều Khiển Nitro Holley EFI Dominator",
      description:
        "Kết hợp ECU Holley Dominator với khả năng kiểm soát hệ thống NOS cực kỳ phức tạp và chính xác.",
      rarity: "epic",
      partType: "nitro", // Có thể coi là một phần của ECU hoặc Nitro tùy bro
      statModifiers: {
        speed: 70,
        acceleration: 1.6,
        handling: -4,
        durability: 0,
      }, // ECU tốt giúp kiểm soát
      imageUrl: "https://i.imgur.com/nCXZgYg_nitro_holley.png", // Placeholder Holley NOS control
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Bộ Điều Khiển Nitro Holley EFI Dominator",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_e_cryo2_intercooler_sprayer_kit" }, // Phun CO2 làm mát Intercooler
    {
      partId: "nitro_e_cryo2_intercooler_sprayer_kit",
      name: "Bộ Phun CO2 Lạnh Làm Mát Intercooler (CryO2)",
      description:
        "Sử dụng CO2 lỏng để làm mát khí nạp, tăng mật độ oxy và hiệu quả NOS/Turbo.",
      rarity: "epic",
      partType: "nitro", // Hoặc một loại phụ trợ động cơ mới
      statModifiers: {
        speed: 15,
        acceleration: 0.5,
        handling: 0,
        durability: 2,
      }, // Gián tiếp tăng hiệu suất động cơ
      imageUrl: "https://i.imgur.com/sKLMno4_nitro_cryo.png", // Placeholder CryO2 kit
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Bộ Phun CO2 Lạnh Làm Mát Intercooler (CryO2)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_e_multi_stage_progressive_race_system_25lb" },
    {
      partId: "nitro_e_multi_stage_progressive_race_system_25lb",
      name: "Hệ Thống Nitro Đua Đa Giai Đoạn Lũy Tiến 25lb",
      description:
        "Hệ thống NOS 25lb cực lớn với nhiều giai đoạn phun và điều khiển lũy tiến, dành cho xe đua chuyên nghiệp.",
      rarity: "epic",
      partType: "nitro",
      statModifiers: {
        speed: 85,
        acceleration: 2.0,
        handling: -6,
        durability: -5,
      },
      imageUrl: "https://i.imgur.com/aBcDeFg_nitro_multistage.png", // Placeholder multi-stage nitro
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Nitro Đua Đa Giai Đoạn Lũy Tiến 25lb",
  );

  // Legendary Nitro Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_l_plasma_injection_nos_system" },
    {
      partId: "nitro_l_plasma_injection_nos_system",
      name: "Hệ Thống Nitro Phun Plasma",
      description:
        "Công nghệ NOS thử nghiệm sử dụng plasma để ion hóa hỗn hợp nhiên liệu, tăng cường sức mạnh vụ nổ.",
      rarity: "legendary",
      partType: "nitro",
      statModifiers: {
        speed: 100,
        acceleration: 2.5,
        handling: -8,
        durability: -7,
      },
      imageUrl: "https://i.imgur.com/hIjKlMn_nitro_plasma.png", // Placeholder plasma nitro
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Nitro Phun Plasma");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_l_rocket_fuel_hybrid_boost" }, // Kết hợp nhiên liệu tên lửa :))
    {
      partId: "nitro_l_rocket_fuel_hybrid_boost",
      name: "Bộ Tăng Tốc Hybrid Nhiên Liệu Tên Lửa",
      description:
        "Một hệ thống điên rồ kết hợp NOS với một lượng nhỏ nhiên liệu tên lửa để tạo ra cú đẩy không tưởng.",
      rarity: "legendary",
      partType: "nitro",
      statModifiers: {
        speed: 120,
        acceleration: 3.0,
        handling: -10,
        durability: -10,
      }, // Cực mạnh nhưng cũng cực hại
      imageUrl: "https://i.imgur.com/oPqRsTu_nitro_rocket.png", // Placeholder rocket fuel nitro
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Tăng Tốc Hybrid Nhiên Liệu Tên Lửa");

  await PartDefinition.findOneAndUpdate(
    { partId: "nitro_l_temporal_distortion_boost_experimental" }, // Chế cho vui :))
    {
      partId: "nitro_l_temporal_distortion_boost_experimental",
      name: "Bộ Tăng Tốc Bẻ Cong Thời Gian (Thử Nghiệm)",
      description:
        "Một thiết bị bí ẩn được đồn đại là có thể bẻ cong không-thời gian trong khoảnh khắc, tạo ra sự tăng tốc phi lý.",
      rarity: "legendary",
      partType: "nitro",
      statModifiers: {
        speed: 90,
        acceleration: 2.2,
        handling: -5,
        durability: 10,
      }, // Có thể có hiệu ứng phụ khó lường
      imageUrl: "https://i.imgur.com/sTuVwXy_nitro_temporal.png", // Placeholder temporal nitro
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Bộ Tăng Tốc Bẻ Cong Thời Gian (Thử Nghiệm)",
  );

  // --- Chassis ---

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_c_steel_unibody_standard" },
    {
      partId: "chassis_c_steel_unibody_standard",
      name: "Khung Gầm Unibody Thép Tiêu Chuẩn",
      description:
        "Kết cấu unibody (thân vỏ liền khung) bằng thép phổ thông, cân bằng giữa chi phí và độ cứng.",
      rarity: "common",
      partType: "chassis",
      statModifiers: {
        speed: 0,
        acceleration: -0.05,
        handling: 3,
        durability: 8,
      }, // Thép thường nặng
      imageUrl: "https://i.imgur.com/placeholder_chassis_unibody.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Khung Gầm Unibody Thép Tiêu Chuẩn");

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_c_body_on_frame_truck" },
    {
      partId: "chassis_c_body_on_frame_truck",
      name: "Khung Gầm Rời Body-on-Frame (Xe Tải)",
      description:
        "Khung gầm rời truyền thống cho xe tải và SUV, rất bền và chịu tải tốt.",
      rarity: "common",
      partType: "chassis",
      statModifiers: {
        speed: -2,
        acceleration: -0.1,
        handling: -3,
        durability: 25,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_truck.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Khung Gầm Rời Body-on-Frame (Xe Tải)");

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_c_reinforced_subframe_basic" },
    {
      partId: "chassis_c_reinforced_subframe_basic",
      name: "Khung Phụ Gia Cố Cơ Bản",
      description:
        "Gia cố thêm cho khung phụ, tăng một chút độ cứng ở các điểm chịu lực.",
      rarity: "common",
      partType: "chassis",
      statModifiers: { speed: 0, acceleration: 0, handling: 2, durability: 5 },
      imageUrl: "https://i.imgur.com/placeholder_chassis_subframe.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Khung Phụ Gia Cố Cơ Bản");

  // Uncommon Chassis (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_uc_aluminum_unibody_sport" },
    {
      partId: "chassis_uc_aluminum_unibody_sport",
      name: "Khung Gầm Unibody Nhôm Thể Thao",
      description:
        "Sử dụng nhôm để giảm trọng lượng và tăng độ cứng, cải thiện khả năng vận hành.",
      rarity: "uncommon",
      partType: "chassis",
      statModifiers: {
        speed: 2,
        acceleration: 0.1,
        handling: 7,
        durability: 3,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_alu_unibody.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Khung Gầm Unibody Nhôm Thể Thao");

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_uc_steel_space_frame_lightweight" },
    {
      partId: "chassis_uc_steel_space_frame_lightweight",
      name: "Khung Không Gian Thép Siêu Nhẹ",
      description:
        "Kết cấu khung ống thép được tối ưu hóa để giảm trọng lượng mà vẫn đảm bảo độ cứng.",
      rarity: "uncommon",
      partType: "chassis",
      statModifiers: {
        speed: 1,
        acceleration: 0.05,
        handling: 6,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_spaceframe_steel.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Khung Không Gian Thép Siêu Nhẹ");

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_uc_stiffened_performance_platform" },
    {
      partId: "chassis_uc_stiffened_performance_platform",
      name: "Nền Tảng Hiệu Suất Được Gia Cố Độ Cứng",
      description:
        "Nâng cấp độ cứng xoắn của nền tảng xe, giúp xe ổn định hơn khi vào cua.",
      rarity: "uncommon",
      partType: "chassis",
      statModifiers: { speed: 0, acceleration: 0, handling: 8, durability: 7 },
      imageUrl: "https://i.imgur.com/placeholder_chassis_stiff.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Nền Tảng Hiệu Suất Được Gia Cố Độ Cứng");

  // Rare Chassis (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_r_carbon_reinforced_polymer_crp_monocoque" },
    {
      partId: "chassis_r_carbon_reinforced_polymer_crp_monocoque",
      name: "Khung Gầm Monocoque Polymer Gia Cố Carbon (CRP)",
      description:
        "Sử dụng vật liệu composite CRP cho khoang lái liền khối, cứng và nhẹ hơn nhôm.",
      rarity: "rare",
      partType: "chassis",
      statModifiers: {
        speed: 4,
        acceleration: 0.2,
        handling: 12,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_crp.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Khung Gầm Monocoque Polymer Gia Cố Carbon (CRP)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_r_aluminum_space_frame_racing_spec" },
    {
      partId: "chassis_r_aluminum_space_frame_racing_spec",
      name: "Khung Không Gian Nhôm (Bản Đua)",
      description:
        "Khung không gian bằng hợp kim nhôm cao cấp, được thiết kế cho xe đua, rất nhẹ và cứng.",
      rarity: "rare",
      partType: "chassis",
      statModifiers: {
        speed: 3,
        acceleration: 0.15,
        handling: 14,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_alu_spaceframe.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Khung Không Gian Nhôm (Bản Đua)");

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_r_active_roll_stabilization_system" },
    {
      partId: "chassis_r_active_roll_stabilization_system",
      name: "Hệ Thống Chống Lật Chủ Động",
      description:
        "Sử dụng các thanh ổn định chủ động để giảm thiểu độ nghiêng thân xe khi vào cua.",
      rarity: "rare",
      partType: "chassis", // Có thể coi là một phần của hệ thống treo cao cấp
      statModifiers: { speed: 1, acceleration: 0, handling: 10, durability: 3 },
      imageUrl: "https://i.imgur.com/placeholder_chassis_active_roll.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Chống Lật Chủ Động");

  // Epic Chassis (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_e_full_carbon_fiber_monocoque_gt" },
    {
      partId: "chassis_e_full_carbon_fiber_monocoque_gt",
      name: "Khung Gầm Monocoque Full Carbon Fiber (GT Spec)",
      description:
        "Toàn bộ khoang lái được làm từ sợi carbon nguyên khối, công nghệ trên siêu xe GT.",
      rarity: "epic",
      partType: "chassis",
      statModifiers: {
        speed: 7,
        acceleration: 0.3,
        handling: 18,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_full_carbon.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Khung Gầm Monocoque Full Carbon Fiber (GT Spec)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_e_titanium_reinforced_carbon_tub" },
    {
      partId: "chassis_e_titanium_reinforced_carbon_tub",
      name: "Khoang Lái Carbon Gia Cố Titan (Carbon Tub)",
      description:
        "Khoang lái dạng 'bồn tắm' bằng carbon, được gia cố thêm titan ở các điểm chịu lực chính.",
      rarity: "epic",
      partType: "chassis",
      statModifiers: {
        speed: 5,
        acceleration: 0.25,
        handling: 16,
        durability: 20,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_carbon_titanium.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Khoang Lái Carbon Gia Cố Titan (Carbon Tub)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_e_adaptive_aerodynamic_underbody" },
    {
      partId: "chassis_e_adaptive_aerodynamic_underbody",
      name: "Gầm Xe Khí Động Học Thích Ứng",
      description:
        "Hệ thống gầm xe với các cánh gió và khe khuếch tán có thể tự điều chỉnh để tối ưu lực ép và giảm lực cản.",
      rarity: "epic",
      partType: "chassis", // Hoặc Bodykit
      statModifiers: {
        speed: 6,
        acceleration: 0.1,
        handling: 15,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_adaptive_aero.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Gầm Xe Khí Động Học Thích Ứng");

  // Legendary Chassis (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_l_carbotanium_monocoque_hypercar" }, // Carbotanium là vật liệu Pagani dùng
    {
      partId: "chassis_l_carbotanium_monocoque_hypercar",
      name: "Khung Gầm Monocoque Carbotanium (Hypercar)",
      description:
        "Sự kết hợp giữa sợi carbon và titan (Carbotanium), siêu nhẹ, siêu cứng, công nghệ độc quyền trên hypercar.",
      rarity: "legendary",
      partType: "chassis",
      statModifiers: {
        speed: 10,
        acceleration: 0.4,
        handling: 22,
        durability: 18,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_carbotanium.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Khung Gầm Monocoque Carbotanium (Hypercar)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_l_graphene_infused_carbon_prototype" },
    {
      partId: "chassis_l_graphene_infused_carbon_prototype",
      name: "Khung Gầm Carbon Pha Graphene (Nguyên Mẫu)",
      description:
        "Khung gầm thử nghiệm sử dụng vật liệu Graphene để đạt độ cứng và nhẹ chưa từng có.",
      rarity: "legendary",
      partType: "chassis",
      statModifiers: {
        speed: 12,
        acceleration: 0.5,
        handling: 25,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/placeholder_chassis_graphene.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Khung Gầm Carbon Pha Graphene (Nguyên Mẫu)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "chassis_l_active_mass_damper_system_f1_derived" },
    {
      partId: "chassis_l_active_mass_damper_system_f1_derived",
      name: "Hệ Thống Giảm Chấn Khối Lượng Chủ Động (Công Nghệ F1)",
      description:
        "Một hệ thống phức tạp sử dụng khối lượng di chuyển để triệt tiêu rung động và duy trì sự ổn định thân xe ở mức cực đoan, lấy cảm hứng từ F1.",
      rarity: "legendary",
      partType: "chassis",
      statModifiers: {
        speed: 3,
        acceleration: 0.1,
        handling: 20,
        durability: 10,
      }, // Handling rất cao
      imageUrl: "https://i.imgur.com/placeholder_chassis_mass_damper.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Giảm Chấn Khối Lượng Chủ Động (Công Nghệ F1)",
  );

  // --- bodykit ---

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_c_street_lip_spoiler" },
    {
      partId: "bodykit_c_street_lip_spoiler",
      name: "Cánh Lướt Gió Dạng Môi (Lip Spoiler)",
      description:
        "Một chi tiết nhỏ giúp tăng vẻ thể thao và cải thiện chút ít khí động học.",
      rarity: "common",
      partType: "bodykit",
      statModifiers: { speed: 1, acceleration: 0, handling: 2, durability: 1 },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_lip.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Cánh Lướt Gió Dạng Môi (Lip Spoiler)");

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_c_side_skirts_basic" },
    {
      partId: "bodykit_c_side_skirts_basic",
      name: "Ốp Hông Cơ Bản (Side Skirts)",
      description:
        "Ốp thêm vào hai bên sườn xe, tạo cảm giác gầm xe thấp hơn và thể thao hơn.",
      rarity: "common",
      partType: "bodykit",
      statModifiers: { speed: 0, acceleration: 0, handling: 1, durability: 2 },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_sideskirt.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Ốp Hông Cơ Bản (Side Skirts)");

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_c_rear_diffuser_simple" },
    {
      partId: "bodykit_c_rear_diffuser_simple",
      name: "Bộ Khuếch Tán Sau Đơn Giản",
      description:
        "Giúp luồng không khí thoát ra mượt mà hơn, tăng chút ổn định.",
      rarity: "common",
      partType: "bodykit",
      statModifiers: { speed: 1, acceleration: 0, handling: 2, durability: 0 },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_diffuser.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Khuếch Tán Sau Đơn Giản");

  // Uncommon Bodykits (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_uc_gt_wing_aluminum" },
    {
      partId: "bodykit_uc_gt_wing_aluminum",
      name: "Cánh Gió GT Nhôm",
      description:
        "Cánh gió lớn bằng nhôm, tăng lực ép xuống đáng kể cho đuôi xe.",
      rarity: "uncommon",
      partType: "bodykit",
      statModifiers: { speed: -1, acceleration: 0, handling: 7, durability: 3 }, // Cản gió nhưng tăng bám đường
      imageUrl: "https://i.imgur.com/placeholder_bodykit_gtwing_alu.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Cánh Gió GT Nhôm");

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_uc_widebody_fender_flares_abs" },
    {
      partId: "bodykit_uc_widebody_fender_flares_abs",
      name: "Ốp Vè Widebody Nhựa ABS",
      description:
        "Mở rộng thân xe với ốp vè bằng nhựa ABS, tạo dáng vẻ hầm hố (ví dụ: Rocket Bunny style).",
      rarity: "uncommon",
      partType: "bodykit",
      statModifiers: {
        speed: -1,
        acceleration: -0.05,
        handling: 6,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_wide_abs.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Ốp Vè Widebody Nhựa ABS");

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_uc_front_splitter_carbon_look" },
    {
      partId: "bodykit_uc_front_splitter_carbon_look",
      name: "Cản Trước Sợi Carbon (Carbon Look)",
      description:
        "Cản trước với líp chia gió bằng vật liệu giả carbon, cải thiện khí động học phần đầu xe.",
      rarity: "uncommon",
      partType: "bodykit",
      statModifiers: {
        speed: 2,
        acceleration: 0.05,
        handling: 4,
        durability: 2,
      },
      imageUrl:
        "https://i.imgur.com/placeholder_bodykit_splitter_carbonlook.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Cản Trước Sợi Carbon (Carbon Look)");

  // Rare Bodykits (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_r_liberty_walk_style_full_kit" }, // Liberty Walk là hãng độ widebody nổi tiếng
    {
      partId: "bodykit_r_liberty_walk_style_full_kit",
      name: "Full Kit Body Phong Cách Liberty Walk",
      description:
        "Bộ widebody hoàn chỉnh phong cách Liberty Walk với các chi tiết tán rivet đặc trưng.",
      rarity: "rare",
      partType: "bodykit",
      statModifiers: {
        speed: -2,
        acceleration: -0.1,
        handling: 10,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_lbwk.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Full Kit Body Phong Cách Liberty Walk");

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_r_carbon_fiber_gt_wing_adjustable" },
    {
      partId: "bodykit_r_carbon_fiber_gt_wing_adjustable",
      name: "Cánh Gió GT Sợi Carbon Điều Chỉnh Được",
      description:
        "Cánh gió GT làm từ sợi carbon siêu nhẹ, có thể điều chỉnh góc tấn để tối ưu lực ép.",
      rarity: "rare",
      partType: "bodykit",
      statModifiers: {
        speed: 0,
        acceleration: 0,
        handling: 14,
        durability: -2,
      }, // Carbon nhẹ nhưng dễ vỡ hơn
      imageUrl: "https://i.imgur.com/placeholder_bodykit_gtwing_carbon.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Cánh Gió GT Sợi Carbon Điều Chỉnh Được");

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_r_vented_carbon_hood_race" },
    {
      partId: "bodykit_r_vented_carbon_hood_race",
      name: "Nắp Ca-pô Carbon Có Khe Thoát Gió (Đua)",
      description:
        "Nắp ca-pô bằng sợi carbon với các khe thoát nhiệt, giúp làm mát động cơ và giảm trọng lượng.",
      rarity: "rare",
      partType: "bodykit",
      statModifiers: {
        speed: 1,
        acceleration: 0.1,
        handling: 3,
        durability: 1,
      }, // Tản nhiệt tốt có thể tăng độ bền động cơ nhẹ
      imageUrl: "https://i.imgur.com/placeholder_bodykit_hood_carbon.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Nắp Ca-pô Carbon Có Khe Thoát Gió (Đua)",
  );

  // Epic Bodykits (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_e_mansory_style_full_carbon_conversion" }, // Mansory là hãng độ xa xỉ
    {
      partId: "bodykit_e_mansory_style_full_carbon_conversion",
      name: "Bộ Conversion Full Carbon Phong Cách Mansory",
      description:
        "Thay thế toàn bộ các tấm thân vỏ bằng sợi carbon theo phong cách độ của Mansory, cực kỳ đắt đỏ và độc đáo.",
      rarity: "epic",
      partType: "bodykit",
      statModifiers: {
        speed: 3,
        acceleration: 0.2,
        handling: 16,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_mansory.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Bộ Conversion Full Carbon Phong Cách Mansory",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_e_active_aerodynamics_package_pro" },
    {
      partId: "bodykit_e_active_aerodynamics_package_pro",
      name: "Gói Khí Động Học Chủ Động Chuyên Nghiệp",
      description:
        "Bao gồm cánh gió trước, sau và các cánh tà tự động điều chỉnh góc tấn theo tốc độ và lực phanh (như trên Pagani Huayra).",
      rarity: "epic",
      partType: "bodykit",
      statModifiers: {
        speed: 5,
        acceleration: 0.15,
        handling: 20,
        durability: 0,
      },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_active_aero_epic.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Gói Khí Động Học Chủ Động Chuyên Nghiệp",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_e_time_attack_custom_widebody_kevlar" },
    {
      partId: "bodykit_e_time_attack_custom_widebody_kevlar",
      name: "Widebody Tùy Chỉnh Time Attack (Vật Liệu Kevlar)",
      description:
        "Bộ widebody siêu rộng được thiết kế riêng cho đua Time Attack, làm từ Kevlar siêu bền và nhẹ.",
      rarity: "epic",
      partType: "bodykit",
      statModifiers: {
        speed: 2,
        acceleration: 0.1,
        handling: 18,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_timeattack_kevlar.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Widebody Tùy Chỉnh Time Attack (Vật Liệu Kevlar)",
  );

  // Legendary Bodykits (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_l_n_largo_novitec_full_conversion" }, // Novitec N-Largo là gói độ nổi tiếng
    {
      partId: "bodykit_l_n_largo_novitec_full_conversion",
      name: "Full Conversion Novitec N-Largo",
      description:
        "Gói độ thân rộng N-Largo trứ danh từ Novitec, biến siêu xe thành một tác phẩm nghệ thuật tốc độ.",
      rarity: "legendary",
      partType: "bodykit",
      statModifiers: {
        speed: 4,
        acceleration: 0.2,
        handling: 22,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_novitec.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Full Conversion Novitec N-Largo");

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_l_prototype_adaptive_morphing_skin" },
    {
      partId: "bodykit_l_prototype_adaptive_morphing_skin",
      name: "Thân Vỏ Biến Hình Thích Ứng (Nguyên Mẫu)",
      description:
        "Công nghệ thân vỏ thử nghiệm có khả năng thay đổi hình dạng một cách tinh vi để tối ưu khí động học ở mọi dải tốc độ.",
      rarity: "legendary",
      partType: "bodykit",
      statModifiers: {
        speed: 8,
        acceleration: 0.3,
        handling: 25,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_bodykit_morphing.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Thân Vỏ Biến Hình Thích Ứng (Nguyên Mẫu)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "bodykit_l_zenvo_centripetal_wing_active_aero" }, // Cánh gió của Zenvo TSR-S
    {
      partId: "bodykit_l_zenvo_centripetal_wing_active_aero",
      name: "Cánh Gió Hướng Tâm Zenvo & Khí Động Học Chủ Động",
      description:
        "Cánh gió sau độc đáo có khả năng nghiêng khi vào cua để tạo lực ép bất đối xứng, kết hợp các yếu tố khí động học chủ động khác.",
      rarity: "legendary",
      partType: "bodykit",
      statModifiers: {
        speed: 2,
        acceleration: 0.1,
        handling: 28,
        durability: 3,
      }, // Cực kỳ hiệu quả khi cua
      imageUrl: "https://i.imgur.com/placeholder_bodykit_zenvo_wing.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Cánh Gió Hướng Tâm Zenvo & Khí Động Học Chủ Động",
  );

  // --- Brakes ---

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_c_standard_drum" },
    {
      partId: "brakes_c_standard_drum",
      name: "Phanh Tang Trống Tiêu Chuẩn",
      description:
        "Hệ thống phanh tang trống cơ bản, thường thấy trên các xe phổ thông đời cũ.",
      rarity: "common",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 3, durability: 10 },
      imageUrl: "https://i.imgur.com/placeholder_brakes_drum.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Phanh Tang Trống Tiêu Chuẩn");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_c_solid_disc_oem" },
    {
      partId: "brakes_c_solid_disc_oem",
      name: "Phanh Đĩa Đặc OEM",
      description:
        "Phanh đĩa đặc tiêu chuẩn theo xe, hiệu quả hơn phanh tang trống.",
      rarity: "common",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 5, durability: 8 },
      imageUrl: "https://i.imgur.com/placeholder_brakes_solid_disc.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Phanh Đĩa Đặc OEM");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_c_basic_pads_street" },
    {
      partId: "brakes_c_basic_pads_street",
      name: "Má Phanh Đường Phố Cơ Bản",
      description:
        "Má phanh tiêu chuẩn cho việc đi lại hàng ngày, cân bằng giữa hiệu suất và độ bền.",
      rarity: "common",
      partType: "brakes", // Coi như một thành phần của hệ thống phanh
      statModifiers: { speed: 0, acceleration: 0, handling: 2, durability: 5 }, // Chỉ má phanh thì ảnh hưởng ít hơn
      imageUrl: "https://i.imgur.com/placeholder_brakes_pads.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Má Phanh Đường Phố Cơ Bản");

  // Uncommon Brakes (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_uc_vented_disc_front" },
    {
      partId: "brakes_uc_vented_disc_front",
      name: "Phanh Đĩa Thông Gió (Trước)",
      description:
        "Đĩa phanh trước có rãnh thông gió giúp tản nhiệt tốt hơn, cải thiện hiệu suất phanh.",
      rarity: "uncommon",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 8, durability: 6 },
      imageUrl: "https://i.imgur.com/placeholder_brakes_vented_disc.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Phanh Đĩa Thông Gió (Trước)");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_uc_performance_pads_street_sport" },
    {
      partId: "brakes_uc_performance_pads_street_sport",
      name: "Má Phanh Hiệu Suất Đường Phố/Thể Thao",
      description:
        "Má phanh với hợp chất cải tiến, tăng lực phanh và khả năng chịu nhiệt.",
      rarity: "uncommon",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 4, durability: 2 },
      imageUrl: "https://i.imgur.com/placeholder_brakes_pads_sport.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Má Phanh Hiệu Suất Đường Phố/Thể Thao");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_uc_braided_steel_lines" },
    {
      partId: "brakes_uc_braided_steel_lines",
      name: "Dây Dầu Phanh Thép Bện",
      description:
        "Thay thế dây dầu cao su bằng dây thép bện, giúp cảm giác phanh chắc chắn và chính xác hơn.",
      rarity: "uncommon",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 3, durability: 7 },
      imageUrl: "https://i.imgur.com/placeholder_brakes_lines.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Dây Dầu Phanh Thép Bện");

  // Rare Brakes (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_r_slotted_drilled_rotors_performance" },
    {
      partId: "brakes_r_slotted_drilled_rotors_performance",
      name: "Đĩa Phanh Khoan Lỗ Xẻ Rãnh Hiệu Suất",
      description:
        "Đĩa phanh được khoan lỗ và xẻ rãnh giúp tản nhiệt tối đa và loại bỏ mạt phanh, lý tưởng cho lái xe thể thao (ví dụ: StopTech Rotors).",
      rarity: "rare",
      partType: "brakes",
      statModifiers: { speed: 1, acceleration: 0, handling: 12, durability: 3 },
      imageUrl: "https://i.imgur.com/placeholder_brakes_slotted_drilled.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Đĩa Phanh Khoan Lỗ Xẻ Rãnh Hiệu Suất");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_r_brembo_4piston_calipers_street" }, // Brembo là thương hiệu phanh nổi tiếng
    {
      partId: "brakes_r_brembo_4piston_calipers_street",
      name: "Cùm Phanh Brembo 4 Piston (Đường Phố)",
      description:
        "Cùm phanh hiệu suất cao từ Brembo với 4 piston, tăng lực phanh đáng kể.",
      rarity: "rare",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 15, durability: 5 },
      imageUrl: "https://i.imgur.com/placeholder_brakes_brembo_4pot.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Cùm Phanh Brembo 4 Piston (Đường Phố)");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_r_hawk_hp_plus_pads_autocross" }, // Hawk Performance là hãng má phanh
    {
      partId: "brakes_r_hawk_hp_plus_pads_autocross",
      name: "Má Phanh Hawk HP Plus (Autocross/Track)",
      description:
        "Má phanh hiệu suất cao dành cho autocross và track day nhẹ, độ bám tốt khi nóng.",
      rarity: "rare",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 7, durability: -2 }, // Nhanh mòn hơn
      imageUrl: "https://i.imgur.com/placeholder_brakes_pads_hawk.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Má Phanh Hawk HP Plus (Autocross/Track)",
  );

  // Epic Brakes (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_e_carbon_ceramic_rotors_supercar" },
    {
      partId: "brakes_e_carbon_ceramic_rotors_supercar",
      name: "Đĩa Phanh Gốm Carbon (Siêu Xe)",
      description:
        'Công nghệ phanh đỉnh cao trên siêu xe, siêu nhẹ, chịu nhiệt cực tốt và không bị "fade".',
      rarity: "epic",
      partType: "brakes",
      statModifiers: {
        speed: 2,
        acceleration: 0.1,
        handling: 20,
        durability: 15,
      }, // Rất bền nhưng đắt
      imageUrl: "https://i.imgur.com/placeholder_brakes_carbon_ceramic.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Đĩa Phanh Gốm Carbon (Siêu Xe)");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_e_ap_racing_6piston_pro_race_calipers" }, // AP Racing
    {
      partId: "brakes_e_ap_racing_6piston_pro_race_calipers",
      name: "Cùm Phanh AP Racing 6 Piston Pro Race",
      description:
        "Cùm phanh 6 piston chuyên dụng cho xe đua từ AP Racing, lực phanh cực mạnh và ổn định.",
      rarity: "epic",
      partType: "brakes",
      statModifiers: {
        speed: 1,
        acceleration: 0,
        handling: 22,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_brakes_ap_6pot.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Cùm Phanh AP Racing 6 Piston Pro Race");

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_e_endless_rf650_racing_fluid_and_pads" }, // Endless là hãng phanh Nhật
    {
      partId: "brakes_e_endless_rf650_racing_fluid_and_pads",
      name: "Bộ Dầu và Má Phanh Đua Endless RF650",
      description:
        "Dầu phanh chịu nhiệt độ sôi cực cao và má phanh đua chuyên nghiệp từ Endless.",
      rarity: "epic",
      partType: "brakes",
      statModifiers: { speed: 0, acceleration: 0, handling: 10, durability: 3 }, // Cải thiện độ ổn định của hệ thống
      imageUrl: "https://i.imgur.com/placeholder_brakes_endless_kit.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Dầu và Má Phanh Đua Endless RF650");

  // Legendary Brakes (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_l_f1_carbon_carbon_system_experimental" },
    {
      partId: "brakes_l_f1_carbon_carbon_system_experimental",
      name: "Hệ Thống Phanh Carbon-Carbon F1 (Thử Nghiệm)",
      description:
        "Công nghệ phanh Carbon-Carbon siêu nhẹ và hiệu suất cực đỉnh từ Công thức 1, được điều chỉnh cho hypercar.",
      rarity: "legendary",
      partType: "brakes",
      statModifiers: {
        speed: 3,
        acceleration: 0.2,
        handling: 28,
        durability: 20,
      },
      imageUrl: "https://i.imgur.com/placeholder_brakes_f1_carbon.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Phanh Carbon-Carbon F1 (Thử Nghiệm)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_l_regenerative_braking_hyper_efficiency" },
    {
      partId: "brakes_l_regenerative_braking_hyper_efficiency",
      name: "Hệ Thống Phanh Tái Tạo Năng Lượng Siêu Hiệu Quả",
      description:
        "Không chỉ phanh mạnh mẽ mà còn tái tạo lượng lớn năng lượng, thường thấy trên xe hybrid/điện hiệu suất cao.",
      rarity: "legendary",
      partType: "brakes",
      statModifiers: {
        speed: 1,
        acceleration: 0.1,
        handling: 25,
        durability: 25,
      }, // Giúp sạc lại pin/nitro?
      imageUrl: "https://i.imgur.com/placeholder_brakes_regenerative.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Phanh Tái Tạo Năng Lượng Siêu Hiệu Quả",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "brakes_l_ai_predictive_braking_system" },
    {
      partId: "brakes_l_ai_predictive_braking_system",
      name: "Hệ Thống Phanh Tiên Đoán AI",
      description:
        "Sử dụng AI để phân tích điều kiện đường và hành vi lái, tự động điều chỉnh lực phanh tối ưu cho từng bánh xe.",
      rarity: "legendary",
      partType: "brakes",
      statModifiers: {
        speed: 0,
        acceleration: 0,
        handling: 30,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/placeholder_brakes_ai.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Phanh Tiên Đoán AI");

  // --- Suspension ---

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_c_macpherson_strut_oem" },
    {
      partId: "susp_c_macpherson_strut_oem",
      name: "Hệ Thống Treo MacPherson OEM",
      description:
        "Kiểu treo độc lập phổ biến, đơn giản và tiết kiệm chi phí, thường thấy trên xe du lịch.",
      rarity: "common",
      partType: "suspension",
      statModifiers: { speed: 0, acceleration: 0, handling: 4, durability: 8 },
      imageUrl: "https://i.imgur.com/placeholder_susp_macpherson.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Treo MacPherson OEM");

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_c_torsion_beam_rear_basic" },
    {
      partId: "susp_c_torsion_beam_rear_basic",
      name: "Thanh Xoắn Treo Sau Cơ Bản",
      description:
        "Hệ thống treo phụ thuộc đơn giản cho cầu sau, thường dùng trên xe cỡ nhỏ giá rẻ.",
      rarity: "common",
      partType: "suspension",
      statModifiers: {
        speed: -1,
        acceleration: 0,
        handling: 2,
        durability: 10,
      }, // Ít linh hoạt bằng treo độc lập
      imageUrl: "https://i.imgur.com/placeholder_susp_torsion.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Thanh Xoắn Treo Sau Cơ Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_c_standard_coil_springs" },
    {
      partId: "susp_c_standard_coil_springs",
      name: "Lò Xo Cuộn Tiêu Chuẩn",
      description:
        "Bộ lò xo cuộn cơ bản, cung cấp khả năng giảm xóc và chịu tải vừa phải.",
      rarity: "common",
      partType: "suspension",
      statModifiers: { speed: 0, acceleration: 0, handling: 1, durability: 5 }, // Chỉ lò xo thì ảnh hưởng ít
      imageUrl: "https://i.imgur.com/placeholder_susp_springs.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lò Xo Cuộn Tiêu Chuẩn");

  // Uncommon Suspension (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "susp_uc_double_wishbone_front_street" },
    {
      partId: "susp_uc_double_wishbone_front_street",
      name: "Hệ Thống Treo Tay Đòn Kép (Trước - Đường Phố)",
      description:
        "Kiểu treo độc lập tiên tiến hơn MacPherson, cải thiện độ bám và ổn định khi vào cua.",
      rarity: "uncommon",
      partType: "suspension",
      statModifiers: {
        speed: 0,
        acceleration: 0.05,
        handling: 8,
        durability: 6,
      },
      imageUrl: "https://i.imgur.com/placeholder_susp_doublewishbone.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Treo Tay Đòn Kép (Trước - Đường Phố)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_uc_lowering_springs_sport" },
    {
      partId: "susp_uc_lowering_springs_sport",
      name: "Lò Xo Hạ Gầm Thể Thao",
      description:
        "Bộ lò xo giúp hạ thấp trọng tâm xe, tăng vẻ thể thao và cải thiện khả năng xử lý.",
      rarity: "uncommon",
      partType: "suspension",
      statModifiers: { speed: 1, acceleration: 0, handling: 6, durability: 2 }, // Gầm thấp dễ cạ
      imageUrl: "https://i.imgur.com/placeholder_susp_lowering.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Lò Xo Hạ Gầm Thể Thao");

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_uc_performance_shock_absorbers" },
    {
      partId: "susp_uc_performance_shock_absorbers",
      name: "Giảm Xóc Hiệu Suất Cao",
      description:
        "Bộ giảm xóc được tinh chỉnh để kiểm soát dao động tốt hơn, giúp xe ổn định trên đường không bằng phẳng.",
      rarity: "uncommon",
      partType: "suspension",
      statModifiers: { speed: 0, acceleration: 0, handling: 7, durability: 7 },
      imageUrl: "https://i.imgur.com/placeholder_susp_shocks.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Giảm Xóc Hiệu Suất Cao");

  // Rare Suspension (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "susp_r_coilover_kit_adjustable_height_damping" }, // Coilovers
    {
      partId: "susp_r_coilover_kit_adjustable_height_damping",
      name: "Bộ Phuộc Coilovers Điều Chỉnh Độ Cao & Độ Cứng",
      description:
        "Hệ thống treo hiệu suất cao cho phép tùy chỉnh độ cao gầm và độ cứng/mềm của giảm xóc (ví dụ: Tein Flex Z).",
      rarity: "rare",
      partType: "suspension",
      statModifiers: {
        speed: 1,
        acceleration: 0.1,
        handling: 15,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_susp_coilovers.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Bộ Phuộc Coilovers Điều Chỉnh Độ Cao & Độ Cứng",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_r_air_suspension_kit_basic_control" }, // Treo khí nén
    {
      partId: "susp_r_air_suspension_kit_basic_control",
      name: "Bộ Treo Khí Nén Điều Khiển Cơ Bản",
      description:
        "Hệ thống treo khí nén cho phép nâng hạ gầm linh hoạt, tạo dáng xe độc đáo (ví dụ: Air Lift Performance).",
      rarity: "rare",
      partType: "suspension",
      statModifiers: {
        speed: -1,
        acceleration: -0.05,
        handling: 10,
        durability: 12,
      }, // Có thể nặng hơn và handling không bằng coilover đua
      imageUrl: "https://i.imgur.com/placeholder_susp_air.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Treo Khí Nén Điều Khiển Cơ Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_r_heavy_duty_offroad_lift_kit" },
    {
      partId: "susp_r_heavy_duty_offroad_lift_kit",
      name: "Bộ Nâng Gầm Off-road Hạng Nặng",
      description:
        "Tăng khoảng sáng gầm xe đáng kể, lò xo và giảm xóc chịu tải nặng cho địa hình khắc nghiệt (ví dụ: Old Man Emu).",
      rarity: "rare",
      partType: "suspension",
      statModifiers: {
        speed: -3,
        acceleration: -0.15,
        handling: 5,
        durability: 25,
      }, // Handling đường nhựa giảm
      imageUrl: "https://i.imgur.com/placeholder_susp_liftkit.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Nâng Gầm Off-road Hạng Nặng");

  // Epic Suspension (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "susp_e_ohlins_road_track_coilovers" }, // Öhlins là thương hiệu cao cấp
    {
      partId: "susp_e_ohlins_road_track_coilovers",
      name: "Bộ Coilovers Öhlins Road & Track",
      description:
        "Hệ thống treo đỉnh cao từ Öhlins, kết hợp hoàn hảo giữa hiệu suất đường đua và sự thoải mái hàng ngày.",
      rarity: "epic",
      partType: "suspension",
      statModifiers: {
        speed: 2,
        acceleration: 0.15,
        handling: 20,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_susp_ohlins.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Coilovers Öhlins Road & Track");

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_e_magnetic_ride_control_adaptive_dampers" }, // Treo từ tính
    {
      partId: "susp_e_magnetic_ride_control_adaptive_dampers",
      name: "Giảm Xóc Thích Ứng Điều Khiển Từ Tính (MagneRide)",
      description:
        "Công nghệ giảm xóc sử dụng chất lỏng từ biến, điều chỉnh độ cứng/mềm gần như tức thời (ví dụ: trên Corvette, Audi R8).",
      rarity: "epic",
      partType: "suspension",
      statModifiers: {
        speed: 1,
        acceleration: 0.05,
        handling: 18,
        durability: 12,
      },
      imageUrl: "https://i.imgur.com/placeholder_susp_magnetic.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Giảm Xóc Thích Ứng Điều Khiển Từ Tính (MagneRide)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_e_kw_clubsport_3way_coilovers_race" }, // KW Suspensions
    {
      partId: "susp_e_kw_clubsport_3way_coilovers_race",
      name: "Bộ Coilovers KW Clubsport 3-Way (Đua)",
      description:
        "Hệ thống treo chuyên dụng cho đường đua từ KW, tùy chỉnh 3 chiều (nén tốc độ cao/thấp, hồi), hiệu suất tối đa.",
      rarity: "epic",
      partType: "suspension",
      statModifiers: {
        speed: 3,
        acceleration: 0.2,
        handling: 22,
        durability: 3,
      }, // Tập trung hiệu suất, ít bền hơn
      imageUrl: "https://i.imgur.com/placeholder_susp_kw.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Coilovers KW Clubsport 3-Way (Đua)");

  // Legendary Suspension (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "susp_l_active_hydraulic_roll_pitch_control_f1tech" },
    {
      partId: "susp_l_active_hydraulic_roll_pitch_control_f1tech",
      name: "Hệ Thống Treo Thủy Lực Chủ Động Kiểm Soát Lắc Ngang/Dọc (Công Nghệ F1)",
      description:
        "Hệ thống treo thủy lực cực kỳ phức tạp, loại bỏ gần như hoàn toàn dao động thân xe, giữ xe phẳng tuyệt đối (lấy cảm hứng từ F1 thập niên 90).",
      rarity: "legendary",
      partType: "suspension",
      statModifiers: {
        speed: 2,
        acceleration: 0.1,
        handling: 28,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/placeholder_susp_active_hydraulic.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Treo Thủy Lực Chủ Động Kiểm Soát Lắc Ngang/Dọc",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_l_predictive_adaptive_suspension_ai_link" },
    {
      partId: "susp_l_predictive_adaptive_suspension_ai_link",
      name: "Hệ Thống Treo Thích Ứng Tiên Đoán Kết Nối AI",
      description:
        "Sử dụng camera và AI để quét mặt đường phía trước và điều chỉnh hệ thống treo trước khi xe đi qua, mang lại sự êm ái và kiểm soát tối thượng (ví dụ: Mercedes Magic Body Control).",
      rarity: "legendary",
      partType: "suspension",
      statModifiers: {
        speed: 0,
        acceleration: 0,
        handling: 25,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/placeholder_susp_predictive_ai.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Treo Thích Ứng Tiên Đoán Kết Nối AI",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "susp_l_multimatic_dssv_dampers_hypercar_spec" }, // Multimatic DSSV dùng trên Ford GT, Aston Martin Vulcan
    {
      partId: "susp_l_multimatic_dssv_dampers_hypercar_spec",
      name: "Giảm Xóc Multimatic DSSV (Hypercar Spec)",
      description:
        "Công nghệ giảm xóc van ống đệm độc quyền của Multimatic, mang lại hiệu suất và độ chính xác vượt trội, được tin dùng trên nhiều hypercar và xe đua GT.",
      rarity: "legendary",
      partType: "suspension",
      statModifiers: {
        speed: 4,
        acceleration: 0.25,
        handling: 30,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_susp_multimatic.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Giảm Xóc Multimatic DSSV (Hypercar Spec)",
  );

  // --- Exhaust ---

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_c_oem_standard_muffler" },
    {
      partId: "exhaust_c_oem_standard_muffler",
      name: "Ống Xả Zin Kèm Giảm Thanh Tiêu Chuẩn",
      description:
        "Hệ thống xả nguyên bản theo xe, tập trung vào việc giảm tiếng ồn và khí thải.",
      rarity: "common",
      partType: "exhaust",
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 5 }, // Zin thường bền
      imageUrl: "https://i.imgur.com/placeholder_exhaust_oem.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Ống Xả Zin Kèm Giảm Thanh Tiêu Chuẩn");

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_c_aftermarket_catback_basic" },
    {
      partId: "exhaust_c_aftermarket_catback_basic",
      name: "Pô Cat-back Độ Cơ Bản",
      description:
        "Hệ thống xả cat-back (từ sau bộ xử lý khí thải) aftermarket, cải thiện chút âm thanh và lưu thông khí.",
      rarity: "common",
      partType: "exhaust",
      statModifiers: {
        speed: 1,
        acceleration: 0.03,
        handling: 0,
        durability: 2,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_catback.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Pô Cat-back Độ Cơ Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_c_chrome_tip_cosmetic" },
    {
      partId: "exhaust_c_chrome_tip_cosmetic",
      name: "Chụp Ống Xả Chrome (Trang Trí)",
      description: "Chỉ là chi tiết trang trí cho đầu ống xả, tăng vẻ thẩm mỹ.",
      rarity: "common",
      partType: "exhaust", // Hoặc cosmetic
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 1 },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_tip.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Chụp Ống Xả Chrome (Trang Trí)");

  // Uncommon Exhaust (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_uc_sport_muffler_stainless" },
    {
      partId: "exhaust_uc_sport_muffler_stainless",
      name: "Bộ Giảm Thanh Thể Thao Inox",
      description:
        "Bộ giảm thanh hiệu suất làm từ inox, cho âm thanh trầm ấm và cải thiện lưu lượng khí xả.",
      rarity: "uncommon",
      partType: "exhaust",
      statModifiers: {
        speed: 2,
        acceleration: 0.05,
        handling: 0,
        durability: 7,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_sport_muffler.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Giảm Thanh Thể Thao Inox");

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_uc_performance_headers_short_tube" },
    {
      partId: "exhaust_uc_performance_headers_short_tube",
      name: "Cổ Góp Hiệu Suất (Ống Ngắn)",
      description:
        "Cổ góp (headers) ống ngắn giúp cải thiện dòng chảy khí xả từ động cơ.",
      rarity: "uncommon",
      partType: "exhaust",
      statModifiers: {
        speed: 3,
        acceleration: 0.08,
        handling: 0,
        durability: 4,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_headers_short.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Cổ Góp Hiệu Suất (Ống Ngắn)");

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_uc_cat_delete_pipe_offroad" }, // Loại bỏ bộ xử lý khí thải
    {
      partId: "exhaust_uc_cat_delete_pipe_offroad",
      name: "Ống Xả Bỏ Bầu Xúc Tác (Off-road)",
      description:
        "Ống thay thế loại bỏ bộ xử lý khí thải, tăng công suất và tiếng pô (chỉ dùng cho off-road/đua).",
      rarity: "uncommon",
      partType: "exhaust",
      statModifiers: {
        speed: 4,
        acceleration: 0.1,
        handling: 0,
        durability: -2,
      }, // Có thể ảnh hưởng tiêu chuẩn khí thải
      imageUrl: "https://i.imgur.com/placeholder_exhaust_catdelete.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Ống Xả Bỏ Bầu Xúc Tác (Off-road)");

  // Rare Exhaust (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_r_borla_atak_catback_system" }, // Borla ATAK là dòng pô cho âm thanh lớn
    {
      partId: "exhaust_r_borla_atak_catback_system",
      name: "Hệ Thống Cat-back Borla ATAK",
      description:
        "Hệ thống xả cat-back từ Borla với công nghệ ATAK cho âm thanh cực kỳ mạnh mẽ và uy lực.",
      rarity: "rare",
      partType: "exhaust",
      statModifiers: {
        speed: 5,
        acceleration: 0.12,
        handling: 0,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_borla.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Cat-back Borla ATAK");

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_r_akrapovic_titanium_slip_on" }, // Akrapovič là thương hiệu pô titan cao cấp
    {
      partId: "exhaust_r_akrapovic_titanium_slip_on",
      name: "Pô Slip-on Akrapovič Titanium",
      description:
        "Ống xả slip-on bằng Titanium siêu nhẹ từ Akrapovič, cải thiện hiệu suất và âm thanh đặc trưng.",
      rarity: "rare",
      partType: "exhaust",
      statModifiers: {
        speed: 6,
        acceleration: 0.15,
        handling: 1,
        durability: 12,
      }, // Titan bền và nhẹ
      imageUrl: "https://i.imgur.com/placeholder_exhaust_akrapovic.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Pô Slip-on Akrapovič Titanium");

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_r_valvetronic_muffler_system_remote" }, // Pô có van đóng mở
    {
      partId: "exhaust_r_valvetronic_muffler_system_remote",
      name: "Hệ Thống Pô Valvetronic (Có Remote)",
      description:
        "Hệ thống xả với van điều khiển điện tử, cho phép thay đổi âm thanh từ êm ái sang gầm rú bằng remote.",
      rarity: "rare",
      partType: "exhaust",
      statModifiers: {
        speed: 4,
        acceleration: 0.1,
        handling: 0,
        durability: 6,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_valvetronic.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Pô Valvetronic (Có Remote)");

  // Epic Exhaust (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_e_full_titanium_race_exhaust_no_cats" },
    {
      partId: "exhaust_e_full_titanium_race_exhaust_no_cats",
      name: "Hệ Thống Xả Đua Full Titanium (Không Bầu)",
      description:
        "Toàn bộ hệ thống xả từ cổ góp đến ống tiêu bằng titanium, loại bỏ hoàn toàn bầu xúc tác, siêu nhẹ và cho âm thanh giải đua.",
      rarity: "epic",
      partType: "exhaust",
      statModifiers: {
        speed: 10,
        acceleration: 0.25,
        handling: 1,
        durability: 5,
      }, // Nhẹ nhưng có thể ồn
      imageUrl:
        "https://i.imgur.com/placeholder_exhaust_full_titanium_race.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Xả Đua Full Titanium (Không Bầu)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_e_inconel_f1_style_headers_and_exhaust" }, // Inconel là vật liệu dùng trong F1
    {
      partId: "exhaust_e_inconel_f1_style_headers_and_exhaust",
      name: "Cổ Góp và Pô Kiểu F1 (Vật Liệu Inconel)",
      description:
        "Hệ thống xả làm từ Inconel siêu chịu nhiệt và nhẹ, thiết kế lấy cảm hứng từ xe đua F1, cho âm thanh tần số cao độc đáo.",
      rarity: "epic",
      partType: "exhaust",
      statModifiers: {
        speed: 12,
        acceleration: 0.3,
        handling: 0,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_inconel_f1.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Cổ Góp và Pô Kiểu F1 (Vật Liệu Inconel)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_e_active_sound_tuning_system_customizable" },
    {
      partId: "exhaust_e_active_sound_tuning_system_customizable",
      name: "Hệ Thống Điều Chỉnh Âm Thanh Xả Chủ Động (Tùy Biến)",
      description:
        "Sử dụng loa và bộ xử lý để tạo ra hoặc tùy chỉnh âm thanh ống xả theo ý muốn, từ tiếng V8 đến F1.",
      rarity: "epic",
      partType: "exhaust", // Hoặc một loại phụ kiện âm thanh
      statModifiers: {
        speed: 2,
        acceleration: 0.05,
        handling: 0,
        durability: 3,
      }, // Chủ yếu là âm thanh
      imageUrl: "https://i.imgur.com/placeholder_exhaust_active_sound.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Điều Chỉnh Âm Thanh Xả Chủ Động (Tùy Biến)",
  );

  // Legendary Exhaust (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_l_kreissieg_f1_scream_valvetronic_hypercar" }, // Kreissieg nổi tiếng với pô F1 cho siêu xe
    {
      partId: "exhaust_l_kreissieg_f1_scream_valvetronic_hypercar",
      name: "Pô Kreissieg F1 Scream Valvetronic (Hypercar)",
      description:
        "Tuyệt tác ống xả từ Kreissieg, tái tạo âm thanh gào thét của động cơ F1 V10/V12, có van điều khiển.",
      rarity: "legendary",
      partType: "exhaust",
      statModifiers: {
        speed: 15,
        acceleration: 0.35,
        handling: 1,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_kreissieg.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Pô Kreissieg F1 Scream Valvetronic (Hypercar)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_l_custom_3d_printed_titanium_variable_geometry" },
    {
      partId: "exhaust_l_custom_3d_printed_titanium_variable_geometry",
      name: "Hệ Thống Xả Titan In 3D Hình Học Biến Thiên Tùy Chỉnh",
      description:
        "Hệ thống xả được in 3D từ titan, với các van và đường ống có hình học biến thiên để tối ưu hóa luồng khí ở mọi dải vòng tua.",
      rarity: "legendary",
      partType: "exhaust",
      statModifiers: {
        speed: 18,
        acceleration: 0.4,
        handling: 2,
        durability: 12,
      },
      imageUrl: "https://i.imgur.com/placeholder_exhaust_3dprint_titanium.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Xả Titan In 3D Hình Học Biến Thiên Tùy Chỉnh",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "exhaust_l_plasma_afterburner_system_experimental" },
    {
      partId: "exhaust_l_plasma_afterburner_system_experimental",
      name: "Hệ Thống Xả Đốt Tăng Lực Plasma (Thử Nghiệm)",
      description:
        "Một công nghệ điên rồ phun plasma vào luồng khí xả để tạo hiệu ứng 'đốt tăng lực' như máy bay chiến đấu, tăng tốc tức thời.",
      rarity: "legendary",
      partType: "exhaust", // Hoặc Nitro
      statModifiers: {
        speed: 25,
        acceleration: 0.6,
        handling: -2,
        durability: -5,
      }, // Rất mạnh nhưng có thể không ổn định
      imageUrl:
        "https://i.imgur.com/placeholder_exhaust_plasma_afterburner.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Xả Đốt Tăng Lực Plasma (Thử Nghiệm)",
  );

  // --- Transmission ---

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_c_manual_5_speed_oem" },
    {
      partId: "trans_c_manual_5_speed_oem",
      name: "Hộp Số Sàn 5 Cấp OEM",
      description:
        "Hộp số sàn 5 cấp tiêu chuẩn, mang lại cảm giác lái truyền thống.",
      rarity: "common",
      partType: "transmission",
      statModifiers: {
        speed: 0,
        acceleration: 0.05,
        handling: 1,
        durability: 10,
      }, // Tăng tốc cải thiện nhẹ do người lái kiểm soát
      imageUrl: "https://i.imgur.com/placeholder_trans_manual5.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hộp Số Sàn 5 Cấp OEM");

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_c_auto_4_speed_conventional" },
    {
      partId: "trans_c_auto_4_speed_conventional",
      name: "Hộp Số Tự Động 4 Cấp Truyền Thống",
      description:
        "Hộp số tự động 4 cấp cơ bản, tiện lợi cho việc di chuyển trong đô thị.",
      rarity: "common",
      partType: "transmission",
      statModifiers: {
        speed: -1,
        acceleration: -0.1,
        handling: 0,
        durability: 8,
      }, // Tự động đời cũ thường ì hơn
      imageUrl: "https://i.imgur.com/placeholder_trans_auto4.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hộp Số Tự Động 4 Cấp Truyền Thống");

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_c_cvt_basic_eco" },
    {
      partId: "trans_c_cvt_basic_eco",
      name: "Hộp Số CVT Cơ Bản (Tiết Kiệm)",
      description:
        "Hộp số vô cấp CVT cơ bản, tối ưu hóa cho việc tiết kiệm nhiên liệu và vận hành mượt mà.",
      rarity: "common",
      partType: "transmission",
      statModifiers: {
        speed: 0,
        acceleration: -0.05,
        handling: 0,
        durability: 6,
      }, // CVT thường không cho cảm giác bốc
      imageUrl: "https://i.imgur.com/placeholder_trans_cvt.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hộp Số CVT Cơ Bản (Tiết Kiệm)");

  // Uncommon Transmissions (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "trans_uc_manual_6_speed_sport_clutch" },
    {
      partId: "trans_uc_manual_6_speed_sport_clutch",
      name: "Hộp Số Sàn 6 Cấp Kèm Ly Hợp Thể Thao",
      description:
        "Hộp số sàn 6 cấp với bộ ly hợp thể thao, sang số nhanh và chính xác hơn.",
      rarity: "uncommon",
      partType: "transmission",
      statModifiers: {
        speed: 1,
        acceleration: 0.2,
        handling: 2,
        durability: 7,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_manual6_sport.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hộp Số Sàn 6 Cấp Kèm Ly Hợp Thể Thao");

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_uc_auto_6_speed_tiptronic" }, // Tiptronic là tên gọi của Porsche/VW cho chế độ bán tự động
    {
      partId: "trans_uc_auto_6_speed_tiptronic",
      name: "Hộp Số Tự Động 6 Cấp (Chế Độ Bán Tự Động)",
      description:
        "Hộp số tự động 6 cấp có chế độ chuyển số tay, cân bằng giữa tiện nghi và thể thao.",
      rarity: "uncommon",
      partType: "transmission",
      statModifiers: {
        speed: 0,
        acceleration: 0.1,
        handling: 1,
        durability: 9,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_auto6_tiptronic.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Tự Động 6 Cấp (Chế Độ Bán Tự Động)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_uc_short_shifter_kit_manual" },
    {
      partId: "trans_uc_short_shifter_kit_manual",
      name: "Bộ Cần Số Ngắn (Short Shifter) Cho Số Sàn",
      description:
        "Giảm hành trình cần số, giúp việc sang số trên hộp số sàn nhanh và dứt khoát hơn.",
      rarity: "uncommon",
      partType: "transmission", // Phụ kiện cho hộp số
      statModifiers: {
        speed: 0,
        acceleration: 0.1,
        handling: 1,
        durability: 3,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_shortshifter.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Bộ Cần Số Ngắn (Short Shifter) Cho Số Sàn",
  );

  // Rare Transmissions (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "trans_r_dct_7_speed_performance" }, // Dual-Clutch Transmission
    {
      partId: "trans_r_dct_7_speed_performance",
      name: "Hộp Số Ly Hợp Kép 7 Cấp Hiệu Suất (DCT)",
      description:
        "Hộp số ly hợp kép 7 cấp sang số cực nhanh và mượt mà, thường thấy trên xe thể thao (ví dụ: VW DSG, Porsche PDK đời đầu).",
      rarity: "rare",
      partType: "transmission",
      statModifiers: {
        speed: 2,
        acceleration: 0.35,
        handling: 2,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_dct7.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Ly Hợp Kép 7 Cấp Hiệu Suất (DCT)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_r_sequential_manual_6_speed_dogbox_street" }, // Dog-box là hộp số tuần tự không đồng tốc
    {
      partId: "trans_r_sequential_manual_6_speed_dogbox_street",
      name: "Hộp Số Sàn Tuần Tự 6 Cấp Dog-box (Đường Phố)",
      description:
        "Hộp số tuần tự kiểu dog-box cho phép sang số cực nhanh không cần côn (khi đã quen), mang lại cảm giác xe đua.",
      rarity: "rare",
      partType: "transmission",
      statModifiers: {
        speed: 1,
        acceleration: 0.4,
        handling: 3,
        durability: 2,
      }, // Có thể khó sử dụng và kém bền nếu dùng sai
      imageUrl: "https://i.imgur.com/placeholder_trans_dogbox.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Sàn Tuần Tự 6 Cấp Dog-box (Đường Phố)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_r_performance_torque_converter_high_stall" },
    {
      partId: "trans_r_performance_torque_converter_high_stall",
      name: "Biến Mô Hiệu Suất Cao (High Stall)",
      description:
        "Biến mô cho hộp số tự động với điểm stall cao hơn, giúp xe đề pa nhanh hơn trong các cuộc đua drag.",
      rarity: "rare",
      partType: "transmission",
      statModifiers: {
        speed: -1,
        acceleration: 0.3,
        handling: -1,
        durability: 4,
      }, // Cải thiện tăng tốc từ đứng yên
      imageUrl: "https://i.imgur.com/placeholder_trans_torqueconverter.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Biến Mô Hiệu Suất Cao (High Stall)");

  // Epic Transmissions (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "trans_e_pdk_8_speed_porsche_tuned" }, // Porsche Doppelkupplung (PDK)
    {
      partId: "trans_e_pdk_8_speed_porsche_tuned",
      name: "Hộp Số Ly Hợp Kép 8 Cấp PDK (Porsche Tuned)",
      description:
        "Hộp số PDK trứ danh của Porsche, được tinh chỉnh để đạt tốc độ sang số và độ tin cậy tối đa.",
      rarity: "epic",
      partType: "transmission",
      statModifiers: {
        speed: 3,
        acceleration: 0.5,
        handling: 3,
        durability: 8,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_pdk8.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Ly Hợp Kép 8 Cấp PDK (Porsche Tuned)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_e_sequential_race_gearbox_paddle_shift_carbon" },
    {
      partId: "trans_e_sequential_race_gearbox_paddle_shift_carbon",
      name: "Hộp Số Đua Tuần Tự Lẫy Chuyển Số Carbon",
      description:
        "Hộp số tuần tự chuyên dụng cho xe đua với lẫy chuyển số bằng sợi carbon, siêu nhẹ và sang số tức thì.",
      rarity: "epic",
      partType: "transmission",
      statModifiers: {
        speed: 2,
        acceleration: 0.6,
        handling: 4,
        durability: 4,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_sequential_race.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Đua Tuần Tự Lẫy Chuyển Số Carbon",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_e_zf_8hp_performance_recalibration_supercar" }, // ZF 8HP rất phổ biến trên xe sang/hiệu suất cao
    {
      partId: "trans_e_zf_8hp_performance_recalibration_supercar",
      name: "Hộp Số ZF 8HP Hiệu Chỉnh Hiệu Suất (Siêu Xe)",
      description:
        "Hộp số tự động 8 cấp ZF 8HP được hiệu chỉnh lại phần mềm và cơ khí cho các ứng dụng siêu xe, sang số nhanh và thông minh.",
      rarity: "epic",
      partType: "transmission",
      statModifiers: {
        speed: 1,
        acceleration: 0.45,
        handling: 2,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_zf8hp.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số ZF 8HP Hiệu Chỉnh Hiệu Suất (Siêu Xe)",
  );

  // Legendary Transmissions (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "trans_l_graziano_lera_7_speed_dct_hypercar_f1_tech" }, // Graziano cung cấp hộp số cho nhiều hypercar
    {
      partId: "trans_l_graziano_lera_7_speed_dct_hypercar_f1_tech",
      name: "Hộp Số Graziano Lera 7 Cấp DCT (Hypercar F1 Tech)",
      description:
        "Hộp số ly hợp kép 7 cấp từ Graziano, ứng dụng công nghệ F1, được sử dụng trên nhiều hypercar hàng đầu.",
      rarity: "legendary",
      partType: "transmission",
      statModifiers: {
        speed: 4,
        acceleration: 0.7,
        handling: 5,
        durability: 6,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_graziano_dct.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Graziano Lera 7 Cấp DCT (Hypercar F1 Tech)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_l_x_trac_p1159_sequential_gt_endurance" }, // Xtrac là nhà cung cấp hộp số đua hàng đầu
    {
      partId: "trans_l_x_trac_p1159_sequential_gt_endurance",
      name: "Hộp Số Tuần Tự Xtrac P1159 (GT Endurance)",
      description:
        "Hộp số tuần tự siêu bền bỉ từ Xtrac, được thiết kế cho các giải đua sức bền GT, chịu được mô-men xoắn cực lớn.",
      rarity: "legendary",
      partType: "transmission",
      statModifiers: {
        speed: 3,
        acceleration: 0.65,
        handling: 4,
        durability: 18,
      },
      imageUrl: "https://i.imgur.com/placeholder_trans_xtrac_sequential.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Tuần Tự Xtrac P1159 (GT Endurance)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "trans_l_seamless_shift_gearbox_prototype_experimental" },
    {
      partId: "trans_l_seamless_shift_gearbox_prototype_experimental",
      name: "Hộp Số Sang Số Liền Mạch (Nguyên Mẫu Thử Nghiệm)",
      description:
        "Công nghệ hộp số thử nghiệm cho phép sang số gần như không có độ trễ, duy trì lực kéo liên tục (tương tự F1 Seamless Shift).",
      rarity: "legendary",
      partType: "transmission",
      statModifiers: {
        speed: 5,
        acceleration: 0.8,
        handling: 3,
        durability: 3,
      }, // Công nghệ mới có thể chưa ổn định
      imageUrl: "https://i.imgur.com/placeholder_trans_seamless.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hộp Số Sang Số Liền Mạch (Nguyên Mẫu Thử Nghiệm)",
  );

  // --- Cooling ---

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_c_oem_radiator_fan_basic" },
    {
      partId: "cooling_c_oem_radiator_fan_basic",
      name: "Quạt và Két Nước OEM Cơ Bản",
      description:
        "Hệ thống làm mát tiêu chuẩn theo xe, đủ cho nhu cầu sử dụng hàng ngày.",
      rarity: "common",
      partType: "cooling",
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 5 },
      imageUrl: "https://i.imgur.com/placeholder_cooling_oem.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Quạt và Két Nước OEM Cơ Bản");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_c_oem_thermostat_standard" },
    {
      partId: "cooling_c_oem_thermostat_standard",
      name: "Van Hằng Nhiệt OEM Tiêu Chuẩn",
      description:
        "Van hằng nhiệt tiêu chuẩn, duy trì nhiệt độ động cơ ổn định.",
      rarity: "common",
      partType: "cooling", // Thành phần của hệ thống làm mát
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 3 },
      imageUrl: "https://i.imgur.com/placeholder_cooling_thermostat.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Van Hằng Nhiệt OEM Tiêu Chuẩn");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_c_oem_coolant_standard" },
    {
      partId: "cooling_c_oem_coolant_standard",
      name: "Nước Làm Mát OEM Tiêu Chuẩn",
      description:
        "Nước làm mát tiêu chuẩn, giúp truyền nhiệt từ động cơ đến két nước.",
      rarity: "common",
      partType: "cooling",
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 2 },
      imageUrl: "https://i.imgur.com/placeholder_cooling_coolant.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Nước Làm Mát OEM Tiêu Chuẩn");

  // Uncommon Cooling Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_uc_aluminum_radiator_performance" },
    {
      partId: "cooling_uc_aluminum_radiator_performance",
      name: "Két Nước Nhôm Hiệu Suất Cao",
      description:
        "Két nước làm từ nhôm, tản nhiệt tốt hơn so với két nước tiêu chuẩn.",
      rarity: "uncommon",
      partType: "cooling",
      statModifiers: {
        speed: 1,
        acceleration: 0.03,
        handling: 0,
        durability: 7,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_alu_radiator.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Két Nước Nhôm Hiệu Suất Cao");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_uc_electric_fan_high_flow" },
    {
      partId: "cooling_uc_electric_fan_high_flow",
      name: "Quạt Điện Hiệu Suất Cao",
      description:
        "Quạt điện mạnh mẽ hơn, tăng cường khả năng làm mát khi xe đứng yên hoặc di chuyển chậm.",
      rarity: "uncommon",
      partType: "cooling",
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 6 },
      imageUrl: "https://i.imgur.com/placeholder_cooling_electric_fan.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Quạt Điện Hiệu Suất Cao");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_uc_low_temp_thermostat" },
    {
      partId: "cooling_uc_low_temp_thermostat",
      name: "Van Hằng Nhiệt Nhiệt Độ Thấp",
      description:
        "Mở sớm hơn, giúp động cơ hoạt động ở nhiệt độ thấp hơn, giảm nguy cơ quá nhiệt.",
      rarity: "uncommon",
      partType: "cooling",
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 8 },
      imageUrl:
        "https://i.imgur.com/placeholder_cooling_low_temp_thermostat.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Van Hằng Nhiệt Nhiệt Độ Thấp");

  // Rare Cooling Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_r_oil_cooler_performance" },
    {
      partId: "cooling_r_oil_cooler_performance",
      name: "Bộ Làm Mát Dầu Hiệu Suất Cao",
      description:
        "Giúp làm mát dầu động cơ, đặc biệt quan trọng khi vận hành ở cường độ cao (ví dụ: trên đường đua).",
      rarity: "rare",
      partType: "cooling",
      statModifiers: {
        speed: 2,
        acceleration: 0.05,
        handling: 0,
        durability: 12,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_oil_cooler.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Làm Mát Dầu Hiệu Suất Cao");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_r_high_performance_coolant_additive" },
    {
      partId: "cooling_r_high_performance_coolant_additive",
      name: "Phụ Gia Nước Làm Mát Hiệu Suất Cao",
      description:
        "Phụ gia giúp nước làm mát tản nhiệt hiệu quả hơn và chống ăn mòn.",
      rarity: "rare",
      partType: "cooling",
      statModifiers: {
        speed: 1,
        acceleration: 0.03,
        handling: 0,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_coolant_additive.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Phụ Gia Nước Làm Mát Hiệu Suất Cao");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_r_larger_capacity_radiator_aluminum" },
    {
      partId: "cooling_r_larger_capacity_radiator_aluminum",
      name: "Két Nước Nhôm Dung Tích Lớn",
      description:
        "Két nước nhôm với dung tích lớn hơn, tăng khả năng làm mát tổng thể.",
      rarity: "rare",
      partType: "cooling",
      statModifiers: { speed: 0, acceleration: 0, handling: 0, durability: 15 },
      imageUrl: "https://i.imgur.com/placeholder_cooling_large_radiator.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Két Nước Nhôm Dung Tích Lớn");

  // Epic Cooling Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_e_dual_pass_radiator_race_spec" },
    {
      partId: "cooling_e_dual_pass_radiator_race_spec",
      name: "Két Nước Dual-Pass (Đua)",
      description:
        "Thiết kế dual-pass giúp nước làm mát đi qua két nước hai lần, tăng hiệu quả tản nhiệt.",
      rarity: "epic",
      partType: "cooling",
      statModifiers: {
        speed: 3,
        acceleration: 0.08,
        handling: 0,
        durability: 18,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_dual_pass.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Két Nước Dual-Pass (Đua)");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_e_electric_water_pump_performance" },
    {
      partId: "cooling_e_electric_water_pump_performance",
      name: "Bơm Nước Điện Hiệu Suất Cao",
      description:
        "Bơm nước điện giúp kiểm soát lưu lượng nước làm mát chính xác hơn và giảm tải cho động cơ.",
      rarity: "epic",
      partType: "cooling",
      statModifiers: {
        speed: 2,
        acceleration: 0.05,
        handling: 0,
        durability: 12,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_electric_pump.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bơm Nước Điện Hiệu Suất Cao");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_e_intercooler_upgrade_turbo_supercharged" }, // Intercooler cho xe có turbo/supercharger
    {
      partId: "cooling_e_intercooler_upgrade_turbo_supercharged",
      name: "Nâng Cấp Intercooler (Turbo/Supercharged)",
      description:
        "Bộ làm mát khí nạp lớn hơn và hiệu quả hơn, giúp giảm nhiệt độ khí nạp cho xe có turbo hoặc supercharger.",
      rarity: "epic",
      partType: "cooling", // Hoặc Forced Induction
      statModifiers: {
        speed: 4,
        acceleration: 0.1,
        handling: 0,
        durability: 15,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_intercooler.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Nâng Cấp Intercooler (Turbo/Supercharged)",
  );

  // Legendary Cooling Systems (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_l_cryo_cooling_system_experimental" },
    {
      partId: "cooling_l_cryo_cooling_system_experimental",
      name: "Hệ Thống Làm Mát Cryo (Thử Nghiệm)",
      description:
        "Sử dụng nitơ lỏng hoặc các chất làm lạnh cực mạnh để làm mát động cơ đến nhiệt độ siêu thấp, tăng công suất đáng kể (thường thấy trên xe đua drag).",
      rarity: "legendary",
      partType: "cooling",
      statModifiers: {
        speed: 8,
        acceleration: 0.2,
        handling: 0,
        durability: 5,
      }, // Mạnh nhưng có thể không bền
      imageUrl: "https://i.imgur.com/placeholder_cooling_cryo.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Làm Mát Cryo (Thử Nghiệm)");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_l_liquid_to_air_intercooler_formula1_tech" },
    {
      partId: "cooling_l_liquid_to_air_intercooler_formula1_tech",
      name: "Intercooler Nước-Gió (Công Nghệ F1)",
      description:
        "Sử dụng chất lỏng để làm mát khí nạp, nhỏ gọn và hiệu quả hơn intercooler thông thường, thường thấy trên xe F1.",
      rarity: "legendary",
      partType: "cooling", // Hoặc Forced Induction
      statModifiers: {
        speed: 6,
        acceleration: 0.15,
        handling: 0,
        durability: 10,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_liquid_air.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Intercooler Nước-Gió (Công Nghệ F1)");

  await PartDefinition.findOneAndUpdate(
    { partId: "cooling_l_ai_predictive_cooling_system" },
    {
      partId: "cooling_l_ai_predictive_cooling_system",
      name: "Hệ Thống Làm Mát Tiên Đoán AI",
      description:
        "Sử dụng AI để phân tích điều kiện lái và thời tiết, tự động điều chỉnh hệ thống làm mát để duy trì nhiệt độ động cơ tối ưu.",
      rarity: "legendary",
      partType: "cooling",
      statModifiers: {
        speed: 5,
        acceleration: 0.12,
        handling: 0,
        durability: 20,
      },
      imageUrl: "https://i.imgur.com/placeholder_cooling_ai.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Hệ Thống Làm Mát Tiên Đoán AI");

  // --- Forced Induction ---

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_c_small_bolt_on_turbo_kit_low_boost" },
    {
      partId: "fi_c_small_bolt_on_turbo_kit_low_boost",
      name: "Bộ Turbo Lắp Ráp Nhỏ (Boost Thấp)",
      description:
        "Bộ turbo aftermarket cơ bản, dễ lắp đặt, tăng một chút công suất với áp suất nén thấp.",
      rarity: "common",
      partType: "forced_induction",
      statModifiers: {
        speed: 10,
        acceleration: 0.25,
        handling: -1,
        durability: -2,
      }, // Tăng công suất nhẹ
      imageUrl: "https://i.imgur.com/placeholder_fi_small_turbo.png",
      gachaWeight: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Bộ Turbo Lắp Ráp Nhỏ (Boost Thấp)");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_c_mini_roots_supercharger_low_psi" },
    {
      partId: "fi_c_mini_roots_supercharger_low_psi",
      name: "Siêu Nạp Mini Kiểu Roots (PSI Thấp)",
      description:
        "Bộ siêu nạp kiểu Roots nhỏ gọn, tăng công suất ở vòng tua thấp và không có turbo lag.",
      rarity: "common",
      partType: "forced_induction",
      statModifiers: {
        speed: 8,
        acceleration: 0.3,
        handling: -2,
        durability: -1,
      }, // Ít lag, tăng accel tốt ở tua thấp
      imageUrl: "https://i.imgur.com/placeholder_fi_mini_supercharger.png",
      gachaWeight: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Siêu Nạp Mini Kiểu Roots (PSI Thấp)");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_c_oem_replacement_turbo_stock_spec" },
    {
      partId: "fi_c_oem_replacement_turbo_stock_spec",
      name: "Turbo Thay Thế OEM (Thông Số Zin)",
      description:
        "Turbo thay thế cho các xe có sẵn turbo từ nhà máy, thông số tương đương zin.",
      rarity: "common",
      partType: "forced_induction",
      statModifiers: {
        speed: 5,
        acceleration: 0.1,
        handling: 0,
        durability: 3,
      }, // Khôi phục hiệu suất gốc
      imageUrl: "https://i.imgur.com/placeholder_fi_oem_turbo.png",
      gachaWeight: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Turbo Thay Thế OEM (Thông Số Zin)");

  // Uncommon Forced Induction (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "fi_uc_garrett_gt28r_turbo_street_tune" }, // Garrett là hãng turbo nổi tiếng
    {
      partId: "fi_uc_garrett_gt28r_turbo_street_tune",
      name: "Turbo Garrett GT28R (Tune Đường Phố)",
      description:
        "Turbo Garrett GT28R phổ biến, phản hồi nhanh, phù hợp cho xe đường phố cần thêm sức mạnh.",
      rarity: "uncommon",
      partType: "forced_induction",
      statModifiers: {
        speed: 20,
        acceleration: 0.5,
        handling: -2,
        durability: -3,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_garrett_gt28.png",
      gachaWeight: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Turbo Garrett GT28R (Tune Đường Phố)");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_uc_eaton_m90_supercharger_gen_v" }, // Eaton là nhà sản xuất supercharger lớn
    {
      partId: "fi_uc_eaton_m90_supercharger_gen_v",
      name: "Siêu Nạp Eaton M90 Thế Hệ V",
      description:
        "Siêu nạp kiểu Roots từ Eaton, thế hệ thứ 5, tăng công suất đều đặn trên toàn dải vòng tua.",
      rarity: "uncommon",
      partType: "forced_induction",
      statModifiers: {
        speed: 15,
        acceleration: 0.6,
        handling: -3,
        durability: -2,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_eaton_m90.png",
      gachaWeight: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Siêu Nạp Eaton M90 Thế Hệ V");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_uc_variable_vane_turbo_vvt_diesel" },
    {
      partId: "fi_uc_variable_vane_turbo_vvt_diesel",
      name: "Turbo Cánh Biến Thiên (VVT - Máy Dầu)",
      description:
        "Turbo với cánh có thể thay đổi góc tấn, giảm turbo lag và tối ưu hiệu suất cho động cơ diesel.",
      rarity: "uncommon",
      partType: "forced_induction",
      statModifiers: {
        speed: 12,
        acceleration: 0.4,
        handling: -1,
        durability: 5,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_vvt_turbo.png",
      gachaWeight: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Turbo Cánh Biến Thiên (VVT - Máy Dầu)");

  // Rare Forced Induction (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "fi_r_borgwarner_efr_7163_twin_scroll_turbo" }, // BorgWarner EFR series
    {
      partId: "fi_r_borgwarner_efr_7163_twin_scroll_turbo",
      name: "Turbo BorgWarner EFR 7163 Twin-Scroll",
      description:
        "Turbo hiệu suất cao dòng EFR của BorgWarner với công nghệ twin-scroll, phản hồi cực nhanh và giải phóng công suất lớn.",
      rarity: "rare",
      partType: "forced_induction",
      statModifiers: {
        speed: 35,
        acceleration: 0.8,
        handling: -3,
        durability: -5,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_borgwarner_efr.png",
      gachaWeight: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Turbo BorgWarner EFR 7163 Twin-Scroll");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_r_whipple_twin_screw_supercharger_2_9l" }, // Whipple superchargers
    {
      partId: "fi_r_whipple_twin_screw_supercharger_2_9l",
      name: "Siêu Nạp Trục Vít Kép Whipple 2.9L",
      description:
        "Siêu nạp kiểu trục vít kép từ Whipple, hiệu quả nén khí cao, mang lại lượng lớn công suất tức thì.",
      rarity: "rare",
      partType: "forced_induction",
      statModifiers: {
        speed: 30,
        acceleration: 0.9,
        handling: -4,
        durability: -4,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_whipple_supercharger.png",
      gachaWeight: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Siêu Nạp Trục Vít Kép Whipple 2.9L");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_r_precision_turbo_pte_6266_ball_bearing" }, // Precision Turbo
    {
      partId: "fi_r_precision_turbo_pte_6266_ball_bearing",
      name: "Turbo Precision PTE 6266 (Bạc Đạn)",
      description:
        "Turbo Precision nổi tiếng trong giới xe độ, bạc đạn bi giúp giảm ma sát và tăng tốc độ phản hồi của turbo.",
      rarity: "rare",
      partType: "forced_induction",
      statModifiers: {
        speed: 40,
        acceleration: 0.7,
        handling: -3,
        durability: -6,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_precision_turbo.png",
      gachaWeight: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Turbo Precision PTE 6266 (Bạc Đạn)");

  // Epic Forced Induction (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "fi_e_garrett_gtx_gen2_gtx3582r_turbo" },
    {
      partId: "fi_e_garrett_gtx_gen2_gtx3582r_turbo",
      name: "Turbo Garrett GTX Gen2 GTX3582R",
      description:
        "Turbo Garrett dòng GTX thế hệ thứ 2, thiết kế cánh nén khí động học tiên tiến, cho công suất rất lớn và dải hoạt động rộng.",
      rarity: "epic",
      partType: "forced_induction",
      statModifiers: {
        speed: 55,
        acceleration: 1.2,
        handling: -5,
        durability: -8,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_garrett_gtx.png",
      gachaWeight: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Turbo Garrett GTX Gen2 GTX3582R");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_e_procharger_f1x_centrifugal_supercharger_race" }, // ProCharger
    {
      partId: "fi_e_procharger_f1x_centrifugal_supercharger_race",
      name: "Siêu Nạp Ly Tâm ProCharger F-1X (Đua)",
      description:
        "Siêu nạp ly tâm ProCharger F-1X, được thiết kế cho các ứng dụng đua xe công suất cực cao, tăng công suất theo vòng tua máy.",
      rarity: "epic",
      partType: "forced_induction",
      statModifiers: {
        speed: 50,
        acceleration: 1.1,
        handling: -6,
        durability: -7,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_procharger.png",
      gachaWeight: 18,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Part: Siêu Nạp Ly Tâm ProCharger F-1X (Đua)");

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_e_compound_turbo_system_sequential_custom" }, // Hệ thống turbo kép tuần tự
    {
      partId: "fi_e_compound_turbo_system_sequential_custom",
      name: "Hệ Thống Compound Turbo Tuần Tự Tùy Chỉnh",
      description:
        "Sử dụng hai turbo với kích thước khác nhau hoạt động tuần tự (một nhỏ cho vòng tua thấp, một lớn cho vòng tua cao) để giảm thiểu turbo lag và tối đa hóa công suất.",
      rarity: "epic",
      partType: "forced_induction",
      statModifiers: {
        speed: 60,
        acceleration: 1.4,
        handling: -4,
        durability: -9,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_compound_turbo.png",
      gachaWeight: 16,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Compound Turbo Tuần Tự Tùy Chỉnh",
  );

  // Legendary Forced Induction (3 món)
  await PartDefinition.findOneAndUpdate(
    { partId: "fi_l_electric_supercharger_hybrid_boost_f1_derived" },
    {
      partId: "fi_l_electric_supercharger_hybrid_boost_f1_derived",
      name: "Siêu Nạp Điện Hỗ Trợ Hybrid (Công Nghệ F1)",
      description:
        "Siêu nạp điện (E-charger) loại bỏ hoàn toàn turbo lag, kết hợp với hệ thống hybrid để cung cấp mô-men xoắn tức thì, công nghệ lấy từ F1.",
      rarity: "legendary",
      partType: "forced_induction",
      statModifiers: {
        speed: 70,
        acceleration: 1.8,
        handling: -3,
        durability: -5,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_electric_supercharger.png",
      gachaWeight: 7,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Siêu Nạp Điện Hỗ Trợ Hybrid (Công Nghệ F1)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_l_anti_lag_system_wrc_spec_turbo_bang_bang" }, // Hệ thống ALS (Bang-Bang)
    {
      partId: "fi_l_anti_lag_system_wrc_spec_turbo_bang_bang",
      name: "Turbo Kèm Hệ Thống Chống Trễ WRC (Bang-Bang)",
      description:
        'Hệ thống Anti-Lag giữ cho turbo luôn quay ở tốc độ cao ngay cả khi không đạp ga, loại bỏ turbo lag hoàn toàn, tạo ra tiếng nổ "bang-bang" đặc trưng của xe WRC.',
      rarity: "legendary",
      partType: "forced_induction",
      statModifiers: {
        speed: 65,
        acceleration: 2.0,
        handling: -6,
        durability: -12,
      }, // Rất hại động cơ và turbo
      imageUrl: "https://i.imgur.com/placeholder_fi_als_turbo.png",
      gachaWeight: 5,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Turbo Kèm Hệ Thống Chống Trễ WRC (Bang-Bang)",
  );

  await PartDefinition.findOneAndUpdate(
    { partId: "fi_l_quad_electric_motor_direct_drive_boost_experimental" },
    {
      partId: "fi_l_quad_electric_motor_direct_drive_boost_experimental",
      name: "Hệ Thống Tăng Áp 4 Motor Điện Dẫn Động Trực Tiếp (Thử Nghiệm)",
      description:
        "Một hệ thống thử nghiệm điên rồ sử dụng 4 motor điện nhỏ công suất cao gắn trực tiếp vào trục turbo/supercharger, cung cấp lực đẩy không tưởng và không độ trễ.",
      rarity: "legendary",
      partType: "forced_induction",
      statModifiers: {
        speed: 80,
        acceleration: 2.5,
        handling: -5,
        durability: -10,
      },
      imageUrl: "https://i.imgur.com/placeholder_fi_quad_electric_boost.png",
      gachaWeight: 4,
    },
    { upsert: true, new: true },
  );
  console.log(
    "✅ Seeded/Updated Part: Hệ Thống Tăng Áp 4 Motor Điện Dẫn Động Trực Tiếp (Thử Nghiệm)",
  );
  console.log("Finished seeding Cars and Parts.");
}

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ Kết nối MongoDB thành công.");
    seedCarParts().then(() => {
      console.log("🌱 Seeding Parts complete.");
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
  });

// node src/database/seeds/seedCarParts.js
