const mongoose = require("mongoose");
const CarModel = require("../../models/CarModel"); // Đường dẫn tới model CarModel
require("dotenv").config();

async function seedGachaItems() {
  console.log("Seeding Cars and Parts...");

  // --- Common ---

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_vios_2018" },
    {
      modelId: "toyota_vios_2018",
      name: "Toyota Vios 2018",
      description:
        "Chiếc sedan bền bỉ, lựa chọn hàng đầu cho gia đình và chạy dịch vụ.",
      brand: "Toyota",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 13,
        handling: 60,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/qpQIThH.png",
      gachaWeight: 300,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Vios 2018");

  await CarModel.findOneAndUpdate(
    { modelId: "hyundai_grand_i10_2017" },
    {
      modelId: "hyundai_grand_i10_2017",
      name: "Hyundai Grand i10 2017",
      description:
        "Nhỏ gọn, tiết kiệm nhiên liệu, dễ dàng luồn lách trong phố đông.",
      brand: "Hyundai",
      rarity: "common",
      baseStats: {
        speed: 165,
        acceleration: 14,
        handling: 65,
        durability: 100,
      },
      imageUrl: "https://i.imgur.com/Lpk9x1i.png",
      gachaWeight: 290,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Hyundai Grand i10 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "kia_morning_si_2016" },
    {
      modelId: "kia_morning_si_2016",
      name: "Kia Morning Si 2016",
      description:
        "Mẫu xe đô thị được ưa chuộng với thiết kế năng động và nhiều tiện ích.",
      brand: "Kia",
      rarity: "common",
      baseStats: {
        speed: 160,
        acceleration: 14,
        handling: 63,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/YlGNJZz.png",
      gachaWeight: 280,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Kia Morning Si 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "chevrolet_spark_2015" },
    {
      modelId: "chevrolet_spark_2015",
      name: "Chevrolet Spark 2015",
      description:
        "Chiếc hatchback nhỏ nhắn, giá cả phải chăng cho người mới bắt đầu.",
      brand: "Chevrolet",
      rarity: "common",
      baseStats: { speed: 155, acceleration: 15, handling: 60, durability: 95 },
      imageUrl: "https://i.imgur.com/CVqY9k3.png",
      gachaWeight: 270,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Chevrolet Spark 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "mitsubishi_mirage_2017" },
    {
      modelId: "mitsubishi_mirage_2017",
      name: "Mitsubishi Mirage 2017",
      description: "Nổi tiếng với khả năng tiết kiệm nhiên liệu vượt trội.",
      brand: "Mitsubishi",
      rarity: "common",
      baseStats: {
        speed: 167,
        acceleration: 13,
        handling: 62,
        durability: 100,
      },
      imageUrl: "https://i.imgur.com/p0zZz5B.png",
      gachaWeight: 260,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mitsubishi Mirage 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "suzuki_celerio_2018" },
    {
      modelId: "suzuki_celerio_2018",
      name: "Suzuki Celerio 2018",
      description:
        "Không gian nội thất rộng rãi đáng ngạc nhiên so với kích thước.",
      brand: "Suzuki",
      rarity: "common",
      baseStats: { speed: 150, acceleration: 15, handling: 66, durability: 90 },
      imageUrl: "https://i.imgur.com/BXt3eWw.png",
      gachaWeight: 250,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Suzuki Celerio 2018");

  await CarModel.findOneAndUpdate(
    { modelId: "vinfast_fadil_base_2019" },
    {
      modelId: "vinfast_fadil_base_2019",
      name: "VinFast Fadil Base 2019",
      description: "Niềm tự hào xe Việt, vận hành ổn định và an toàn.",
      brand: "VinFast",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 12,
        handling: 68,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/u2b7d8K.png", // Ảnh Fadil nói chung
      gachaWeight: 240,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: VinFast Fadil Base 2019");

  await CarModel.findOneAndUpdate(
    { modelId: "honda_brio_2019" },
    {
      modelId: "honda_brio_2019",
      name: "Honda Brio 2019",
      description:
        "Thiết kế thể thao, mang lại cảm giác lái thú vị trong phân khúc.",
      brand: "Honda",
      rarity: "common",
      baseStats: {
        speed: 160,
        acceleration: 13,
        handling: 67,
        durability: 100,
      },
      imageUrl: "https://i.imgur.com/xJ2nJ9M.png",
      gachaWeight: 230,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Honda Brio 2019");

  await CarModel.findOneAndUpdate(
    { modelId: "ford_fiesta_2016_trend" },
    {
      modelId: "ford_fiesta_2016_trend",
      name: "Ford Fiesta Trend 2016",
      description: "Cảm giác lái chắc chắn và nhiều công nghệ hỗ trợ.",
      brand: "Ford",
      rarity: "common",
      baseStats: {
        speed: 175,
        acceleration: 11,
        handling: 70,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/uR28n5f.png",
      gachaWeight: 220,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ford Fiesta Trend 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "nissan_sunny_2017_xl" },
    {
      modelId: "nissan_sunny_2017_xl",
      name: "Nissan Sunny XL 2017",
      description: "Không gian rộng rãi, đặc biệt là hàng ghế sau thoải mái.",
      brand: "Nissan",
      rarity: "common",
      baseStats: {
        speed: 168,
        acceleration: 13,
        handling: 58,
        durability: 115,
      },
      imageUrl: "https://i.imgur.com/kM4h9vT.png",
      gachaWeight: 210,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Nissan Sunny XL 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "mazda_2_2015_sedan" },
    {
      modelId: "mazda_2_2015_sedan",
      name: "Mazda 2 Sedan 2015",
      description: "Thiết kế Kodo thanh lịch, vận hành êm ái.",
      brand: "Mazda",
      rarity: "common",
      baseStats: {
        speed: 172,
        acceleration: 12,
        handling: 69,
        durability: 100,
      },
      imageUrl: "https://i.imgur.com/c8IIjDQ.png",
      gachaWeight: 200,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mazda 2 Sedan 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_wigo_2018" },
    {
      modelId: "toyota_wigo_2018",
      name: "Toyota Wigo 2018",
      description:
        "Nhỏ gọn, thực dụng, một lựa chọn đáng cân nhắc cho việc di chuyển hàng ngày.",
      brand: "Toyota",
      rarity: "common",
      baseStats: { speed: 150, acceleration: 15, handling: 64, durability: 95 },
      imageUrl: "https://i.imgur.com/2fN0N0u.png",
      gachaWeight: 190,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Wigo 2018");

  await CarModel.findOneAndUpdate(
    { modelId: "hyundai_accent_2016_blue" },
    {
      modelId: "hyundai_accent_2016_blue",
      name: "Hyundai Accent Blue 2016",
      description: "Thiết kế trẻ trung, trang bị khá tốt trong tầm giá.",
      brand: "Hyundai",
      rarity: "common",
      baseStats: {
        speed: 180,
        acceleration: 11,
        handling: 66,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/VbVb6qR.png",
      gachaWeight: 180,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Hyundai Accent Blue 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "kia_rio_2015_sedan" },
    {
      modelId: "kia_rio_2015_sedan",
      name: "Kia Rio Sedan 2015",
      description:
        "Một chiếc sedan hạng B với kiểu dáng khá ưa nhìn và thực dụng.",
      brand: "Kia",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 12,
        handling: 63,
        durability: 100,
      },
      imageUrl: "https://i.imgur.com/U5kF2Yn.png",
      gachaWeight: 170,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Kia Rio Sedan 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "mitsubishi_attrage_2016" },
    {
      modelId: "mitsubishi_attrage_2016",
      name: "Mitsubishi Attrage 2016",
      description:
        "Tiết kiệm nhiên liệu và không gian nội thất rộng rãi là điểm mạnh.",
      brand: "Mitsubishi",
      rarity: "common",
      baseStats: {
        speed: 165,
        acceleration: 14,
        handling: 60,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/4H3gYqZ.png",
      gachaWeight: 160,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mitsubishi Attrage 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "suzuki_swift_2014" },
    {
      modelId: "suzuki_swift_2014",
      name: "Suzuki Swift 2014",
      description: "Kiểu dáng cá tính, nhỏ gọn, mang đậm phong cách châu Âu.",
      brand: "Suzuki",
      rarity: "common",
      baseStats: { speed: 160, acceleration: 13, handling: 70, durability: 90 },
      imageUrl: "https://i.imgur.com/tJzSO1D.png",
      gachaWeight: 150,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Suzuki Swift 2014");

  await CarModel.findOneAndUpdate(
    { modelId: "chevrolet_aveo_2017" },
    {
      modelId: "chevrolet_aveo_2017",
      name: "Chevrolet Aveo 2017",
      description: "Mẫu sedan giá rẻ, đáp ứng nhu cầu cơ bản của người dùng.",
      brand: "Chevrolet",
      rarity: "common",
      baseStats: {
        speed: 160,
        acceleration: 14,
        handling: 58,
        durability: 100,
      },
      imageUrl: "https://i.imgur.com/j8Xv1N3.png",
      gachaWeight: 140,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Chevrolet Aveo 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "honda_city_2015" },
    {
      modelId: "honda_city_2015",
      name: "Honda City 2015",
      description:
        "Bền bỉ, giữ giá, một lựa chọn thông minh trong phân khúc sedan hạng B.",
      brand: "Honda",
      rarity: "common",
      baseStats: {
        speed: 175,
        acceleration: 11,
        handling: 68,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/2g3hKkG.png",
      gachaWeight: 130,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Honda City 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "ford_ecosport_2016" },
    {
      modelId: "ford_ecosport_2016",
      name: "Ford EcoSport 2016",
      description: "Mẫu SUV đô thị tiên phong, gầm cao và linh hoạt.",
      brand: "Ford",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 12,
        handling: 65,
        durability: 115,
      },
      imageUrl: "https://i.imgur.com/yQhY6g0.png",
      gachaWeight: 120,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ford EcoSport 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "nissan_navara_2015_vl" },
    {
      modelId: "nissan_navara_2015_vl",
      name: "Nissan Navara VL 2015",
      description:
        "Chiếc bán tải mạnh mẽ, đáng tin cậy cho cả công việc và gia đình.",
      brand: "Nissan",
      rarity: "common",
      baseStats: {
        speed: 180,
        acceleration: 11,
        handling: 55,
        durability: 140,
      },
      imageUrl: "https://i.imgur.com/6j5R0eY.png",
      gachaWeight: 110,
      castrolValue: 2, // Bán tải có thể cho giá trị cao hơn chút
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Nissan Navara VL 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "mazda_3_2014_hatchback" },
    {
      modelId: "mazda_3_2014_hatchback",
      name: "Mazda 3 Hatchback 2014",
      description:
        "Kiểu dáng hatchback thể thao, linh hoạt và tiết kiệm nhiên liệu.",
      brand: "Mazda",
      rarity: "common",
      baseStats: {
        speed: 185,
        acceleration: 10,
        handling: 72,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/p69jAGY.png",
      gachaWeight: 105,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mazda 3 Hatchback 2014");

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_corolla_altis_2013" },
    {
      modelId: "toyota_corolla_altis_2013",
      name: "Toyota Corolla Altis 2013",
      description:
        "Một tượng đài về sự bền bỉ và tin cậy trong phân khúc sedan hạng C.",
      brand: "Toyota",
      rarity: "common",
      baseStats: {
        speed: 190,
        acceleration: 11,
        handling: 65,
        durability: 120,
      },
      imageUrl: "https://i.imgur.com/8S794sR.png",
      gachaWeight: 100,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Corolla Altis 2013");

  await CarModel.findOneAndUpdate(
    { modelId: "hyundai_elantra_2015" },
    {
      modelId: "hyundai_elantra_2015",
      name: "Hyundai Elantra 2015",
      description:
        "Thiết kế 'Điêu khắc dòng chảy' cá tính, nhiều trang bị tiện nghi.",
      brand: "Hyundai",
      rarity: "common",
      baseStats: {
        speed: 195,
        acceleration: 10,
        handling: 68,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/d1jT0mG.png",
      gachaWeight: 98,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Hyundai Elantra 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "kia_k3_2014_sedan" }, // K3 là tên cũ của Cerato ở một số thị trường
    {
      modelId: "kia_k3_2014_sedan",
      name: "Kia K3 Sedan 2014",
      description: "Ngoại hình bắt mắt, lựa chọn hấp dẫn trong phân khúc C.",
      brand: "Kia",
      rarity: "common",
      baseStats: {
        speed: 190,
        acceleration: 10,
        handling: 67,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/kWTb3oA.png",
      gachaWeight: 96,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Kia K3 Sedan 2014");

  await CarModel.findOneAndUpdate(
    { modelId: "chevrolet_cruze_2016_lt" },
    {
      modelId: "chevrolet_cruze_2016_lt",
      name: "Chevrolet Cruze LT 2016",
      description: "Khung gầm chắc chắn, cảm giác lái đầm chắc kiểu Mỹ.",
      brand: "Chevrolet",
      rarity: "common",
      baseStats: {
        speed: 185,
        acceleration: 11,
        handling: 63,
        durability: 115,
      },
      imageUrl: "https://i.imgur.com/fL4pX7G.png",
      gachaWeight: 94,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Chevrolet Cruze LT 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "mitsubishi_lancer_2013_fortis" }, // Lancer Fortis là một biến thể
    {
      modelId: "mitsubishi_lancer_2013_fortis",
      name: "Mitsubishi Lancer Fortis 2013",
      description:
        "Thiết kế thể thao, gợi nhớ đến huyền thoại Lancer Evolution.",
      brand: "Mitsubishi",
      rarity: "common",
      baseStats: {
        speed: 190,
        acceleration: 10,
        handling: 70,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/w4sY2Xv.png",
      gachaWeight: 92,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mitsubishi Lancer Fortis 2013");

  await CarModel.findOneAndUpdate(
    { modelId: "suzuki_ertiga_2017" },
    {
      modelId: "suzuki_ertiga_2017",
      name: "Suzuki Ertiga 2017",
      description: "Mẫu MPV 7 chỗ thực dụng, phù hợp cho nhu cầu gia đình.",
      brand: "Suzuki",
      rarity: "common",
      baseStats: {
        speed: 160,
        acceleration: 13,
        handling: 60,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/YVqG7oQ.png",
      gachaWeight: 90,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Suzuki Ertiga 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "isuzu_dmax_2014" },
    {
      modelId: "isuzu_dmax_2014",
      name: "Isuzu D-Max 2014",
      description:
        "Chiếc bán tải nổi tiếng với động cơ Diesel bền bỉ và tiết kiệm.",
      brand: "Isuzu",
      rarity: "common",
      baseStats: {
        speed: 175,
        acceleration: 12,
        handling: 50,
        durability: 150,
      },
      imageUrl: "https://i.imgur.com/hP8g9C7.png",
      gachaWeight: 88,
      castrolValue: 2,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Isuzu D-Max 2014");

  await CarModel.findOneAndUpdate(
    { modelId: "ford_ranger_xls_2015" },
    {
      modelId: "ford_ranger_xls_2015",
      name: "Ford Ranger XLS 2015",
      description: "Phiên bản tiêu chuẩn của vua bán tải, mạnh mẽ và đa dụng.",
      brand: "Ford",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 12,
        handling: 55,
        durability: 145,
      },
      imageUrl: "https://i.imgur.com/K3tH7uW.png", // Ảnh Ranger XLS
      gachaWeight: 86,
      castrolValue: 2,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ford Ranger XLS 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_hilux_2013_e" },
    {
      modelId: "toyota_hilux_2013_e",
      name: "Toyota Hilux E 2013",
      description:
        "Chiếc bán tải không thể phá hủy, đồng hành trên mọi nẻo đường.",
      brand: "Toyota",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 13,
        handling: 52,
        durability: 160,
      },
      imageUrl: "https://i.imgur.com/6k7T4WJ.png",
      gachaWeight: 84,
      castrolValue: 2,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Hilux E 2013");

  await CarModel.findOneAndUpdate(
    { modelId: "mitsubishi_triton_2016" },
    {
      modelId: "mitsubishi_triton_2016",
      name: "Mitsubishi Triton 2016",
      description: "Thiết kế J-line độc đáo, khả năng vận hành linh hoạt.",
      brand: "Mitsubishi",
      rarity: "common",
      baseStats: {
        speed: 178,
        acceleration: 11,
        handling: 58,
        durability: 135,
      },
      imageUrl: "https://i.imgur.com/9YgJg2m.png",
      gachaWeight: 82,
      castrolValue: 2,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mitsubishi Triton 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "chevrolet_colorado_2017_lt" },
    {
      modelId: "chevrolet_colorado_2017_lt",
      name: "Chevrolet Colorado LT 2017",
      description: "Mẫu bán tải Mỹ với động cơ Duramax mạnh mẽ.",
      brand: "Chevrolet",
      rarity: "common",
      baseStats: {
        speed: 180,
        acceleration: 10,
        handling: 53,
        durability: 140,
      },
      imageUrl: "https://i.imgur.com/fWbRm4R.png",
      gachaWeight: 80,
      castrolValue: 2,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Chevrolet Colorado LT 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "mazda_bt50_2015" },
    {
      modelId: "mazda_bt50_2015",
      name: "Mazda BT-50 2015",
      description:
        "Sự kết hợp giữa tiện nghi của xe du lịch và sức mạnh của bán tải.",
      brand: "Mazda",
      rarity: "common",
      baseStats: {
        speed: 175,
        acceleration: 11,
        handling: 60,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/N3Y7f9k.png",
      gachaWeight: 78,
      castrolValue: 2,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mazda BT-50 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_innova_2012_g" },
    {
      modelId: "toyota_innova_2012_g",
      name: "Toyota Innova G 2012",
      description:
        "Mẫu MPV 'thần thánh', lựa chọn tối ưu cho kinh doanh vận tải.",
      brand: "Toyota",
      rarity: "common",
      baseStats: {
        speed: 160,
        acceleration: 14,
        handling: 55,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/UjO9QAZ.png",
      gachaWeight: 76,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Innova G 2012");

  await CarModel.findOneAndUpdate(
    { modelId: "kia_rondo_2016_gat" },
    {
      modelId: "kia_rondo_2016_gat",
      name: "Kia Rondo GAT 2016",
      description: "MPV 5+2 chỗ linh hoạt, nhiều trang bị và giá cả hợp lý.",
      brand: "Kia",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 12,
        handling: 62,
        durability: 115,
      },
      imageUrl: "https://i.imgur.com/v3iXj6k.png",
      gachaWeight: 74,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Kia Rondo GAT 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "suzuki_ciaz_2016" },
    {
      modelId: "suzuki_ciaz_2016",
      name: "Suzuki Ciaz 2016",
      description:
        "Sedan hạng B rộng rãi bậc nhất phân khúc, nhập khẩu Thái Lan.",
      brand: "Suzuki",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 13,
        handling: 64,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/Xv7Rk79.png",
      gachaWeight: 72,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Suzuki Ciaz 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "peugeot_208_2015" },
    {
      modelId: "peugeot_208_2015",
      name: "Peugeot 208 2015",
      description:
        "Hatchback phong cách Pháp, thiết kế độc đáo và nội thất i-Cockpit.",
      brand: "Peugeot",
      rarity: "common",
      baseStats: {
        speed: 180,
        acceleration: 11,
        handling: 73,
        durability: 100,
      },
      imageUrl: "https://i.imgur.com/QYnQ8xM.png",
      gachaWeight: 70,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Peugeot 208 2015");

  await CarModel.findOneAndUpdate(
    { modelId: "renault_logan_2017" },
    {
      modelId: "renault_logan_2017",
      name: "Renault Logan 2017",
      description: "Mẫu sedan thực dụng, rộng rãi với mức giá dễ tiếp cận.",
      brand: "Renault",
      rarity: "common",
      baseStats: {
        speed: 165,
        acceleration: 14,
        handling: 57,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/gN9LwE6.png",
      gachaWeight: 68,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Renault Logan 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "ssangyong_tivoli_2016" },
    {
      modelId: "ssangyong_tivoli_2016",
      name: "SsangYong Tivoli 2016",
      description:
        "SUV cỡ nhỏ đến từ Hàn Quốc với thiết kế lạ mắt và nhiều tính năng.",
      brand: "SsangYong",
      rarity: "common",
      baseStats: {
        speed: 170,
        acceleration: 12,
        handling: 66,
        durability: 105,
      },
      imageUrl: "https://i.imgur.com/pD8GfKw.png",
      gachaWeight: 66,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: SsangYong Tivoli 2016");

  await CarModel.findOneAndUpdate(
    { modelId: "baic_q7_2018" }, // Xe Tàu giá rẻ
    {
      modelId: "baic_q7_2018",
      name: "BAIC Q7 2018",
      description: "Mẫu SUV Trung Quốc với thiết kế học hỏi và nhiều 'option'.",
      brand: "BAIC",
      rarity: "common",
      baseStats: { speed: 160, acceleration: 15, handling: 55, durability: 90 },
      imageUrl: "https://i.imgur.com/c0a1zH7.png",
      gachaWeight: 64,
      castrolValue: 1,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: BAIC Q7 2018");

  // --- UnCommon ---

  await CarModel.findOneAndUpdate(
    { modelId: "honda_civic_2021_lx" },
    {
      modelId: "honda_civic_2021_lx",
      name: "Honda Civic LX 2021",
      description: "Thiết kế hiện đại, vận hành êm ái và đáng tin cậy.",
      brand: "Honda",
      rarity: "uncommon",
      baseStats: { speed: 200, acceleration: 9, handling: 75, durability: 115 },
      imageUrl: "https://i.imgur.com/kP5gH5L.png",
      gachaWeight: 100,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Honda Civic LX 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "mazda_cx5_2020_touring" },
    {
      modelId: "mazda_cx5_2020_touring",
      name: "Mazda CX-5 Touring 2020",
      description:
        "SUV 5 chỗ với thiết kế Kodo đặc trưng, nội thất sang trọng và cảm giác lái thú vị.",
      brand: "Mazda",
      rarity: "uncommon",
      baseStats: {
        speed: 195,
        acceleration: 10,
        handling: 70,
        durability: 125,
      },
      imageUrl: "https://i.imgur.com/NkD9zY8.png",
      gachaWeight: 95,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mazda CX-5 Touring 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_corolla_cross_2021_g" },
    {
      modelId: "toyota_corolla_cross_2021_g",
      name: "Toyota Corolla Cross G 2021",
      description:
        "Mẫu SUV đô thị hoàn toàn mới, không gian rộng rãi và nhiều công nghệ an toàn.",
      brand: "Toyota",
      rarity: "uncommon",
      baseStats: {
        speed: 185,
        acceleration: 11,
        handling: 68,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/uHjPj4G.png",
      gachaWeight: 90,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Corolla Cross G 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "kia_seltos_2022_luxury" },
    {
      modelId: "kia_seltos_2022_luxury",
      name: "Kia Seltos Luxury 2022",
      description:
        "Thiết kế trẻ trung, năng động cùng nhiều tùy chọn màu sắc cá tính.",
      brand: "Kia",
      rarity: "uncommon",
      baseStats: {
        speed: 190,
        acceleration: 10,
        handling: 72,
        durability: 120,
      },
      imageUrl: "https://i.imgur.com/JtQvF1A.png",
      gachaWeight: 88,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Kia Seltos Luxury 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "hyundai_kona_2021_se" },
    {
      modelId: "hyundai_kona_2021_se",
      name: "Hyundai Kona SE 2021",
      description:
        "SUV cỡ nhỏ với phong cách thiết kế độc đáo và khả năng vận hành linh hoạt.",
      brand: "Hyundai",
      rarity: "uncommon",
      baseStats: { speed: 190, acceleration: 9, handling: 76, durability: 118 },
      imageUrl: "https://i.imgur.com/9VfE7cD.png",
      gachaWeight: 86,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Hyundai Kona SE 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "ford_territory_2023_trend" },
    {
      modelId: "ford_territory_2023_trend",
      name: "Ford Territory Trend 2023",
      description:
        "Mẫu SUV 5 chỗ mới của Ford, không gian rộng và nhiều công nghệ.",
      brand: "Ford",
      rarity: "uncommon",
      baseStats: {
        speed: 180,
        acceleration: 11,
        handling: 67,
        durability: 135,
      },
      imageUrl: "https://i.imgur.com/2YlWq3X.png",
      gachaWeight: 84,
      castrolValue: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ford Territory Trend 2023");

  await CarModel.findOneAndUpdate(
    { modelId: "mitsubishi_outlander_2022_cvt" },
    {
      modelId: "mitsubishi_outlander_2022_cvt",
      name: "Mitsubishi Outlander CVT 2022",
      description: "Thiết kế Dynamic Shield mạnh mẽ, không gian 5+2 linh hoạt.",
      brand: "Mitsubishi",
      rarity: "uncommon",
      baseStats: {
        speed: 190,
        acceleration: 10,
        handling: 65,
        durability: 140,
      },
      imageUrl: "https://i.imgur.com/u8fLq3E.png",
      gachaWeight: 82,
      castrolValue: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mitsubishi Outlander CVT 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "vinfast_lux_a20_base_2020" },
    {
      modelId: "vinfast_lux_a20_base_2020",
      name: "VinFast LUX A2.0 Base 2020",
      description: "Sedan hạng E đầu tiên của VinFast, mang đậm dấu ấn Việt.",
      brand: "VinFast",
      rarity: "uncommon",
      baseStats: { speed: 230, acceleration: 8, handling: 70, durability: 130 }, // Tốc độ thực tế có thể bị giới hạn
      imageUrl: "https://i.imgur.com/qO3kHYP.png",
      gachaWeight: 80,
      castrolValue: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: VinFast LUX A2.0 Base 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "subaru_forester_2021_is" },
    {
      modelId: "subaru_forester_2021_is",
      name: "Subaru Forester i-S 2021",
      description:
        "SUV an toàn với hệ dẫn động S-AWD trứ danh và công nghệ EyeSight.",
      brand: "Subaru",
      rarity: "uncommon",
      baseStats: {
        speed: 188,
        acceleration: 10,
        handling: 78,
        durability: 135,
      },
      imageUrl: "https://i.imgur.com/Zf8jLg0.png",
      gachaWeight: 78,
      castrolValue: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Subaru Forester i-S 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "peugeot_3008_allure_2021" },
    {
      modelId: "peugeot_3008_allure_2021",
      name: "Peugeot 3008 Allure 2021",
      description:
        "SUV Pháp với thiết kế cá tính, nội thất i-Cockpit hiện đại.",
      brand: "Peugeot",
      rarity: "uncommon",
      baseStats: { speed: 200, acceleration: 9, handling: 74, durability: 120 },
      imageUrl: "https://i.imgur.com/Xh7MqoA.png",
      gachaWeight: 76,
      castrolValue: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Peugeot 3008 Allure 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "nissan_kicks_2023_e_power" },
    {
      modelId: "nissan_kicks_2023_e_power",
      name: "Nissan Kicks e-POWER 2023",
      description:
        "SUV đô thị với công nghệ e-POWER độc đáo, vận hành như xe điện.",
      brand: "Nissan",
      rarity: "uncommon",
      baseStats: { speed: 170, acceleration: 9, handling: 77, durability: 115 }, // Tốc độ không quá cao nhưng tăng tốc tốt
      imageUrl: "https://i.imgur.com/4R0d7gN.png",
      gachaWeight: 74,
      castrolValue: 4,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Nissan Kicks e-POWER 2023");

  await CarModel.findOneAndUpdate(
    { modelId: "volkswagen_tcross_2022_elegance" },
    {
      modelId: "volkswagen_tcross_2022_elegance",
      name: "Volkswagen T-Cross Elegance 2022",
      description: "SUV đô thị nhỏ gọn từ Đức, chất lượng và an toàn.",
      brand: "Volkswagen",
      rarity: "uncommon",
      baseStats: {
        speed: 180,
        acceleration: 10,
        handling: 75,
        durability: 125,
      },
      imageUrl: "https://i.imgur.com/xGjK7aT.png",
      gachaWeight: 72,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Volkswagen T-Cross Elegance 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "mg_zs_2021_luxury" },
    {
      modelId: "mg_zs_2021_luxury",
      name: "MG ZS Luxury 2021",
      description: "SUV Anh Quốc với nhiều trang bị và mức giá cạnh tranh.",
      brand: "MG",
      rarity: "uncommon",
      baseStats: {
        speed: 175,
        acceleration: 11,
        handling: 70,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/yD4hF8A.png",
      gachaWeight: 70,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: MG ZS Luxury 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "honda_hrv_2022_g" },
    {
      modelId: "honda_hrv_2022_g",
      name: "Honda HR-V G 2022",
      description:
        "SUV cỡ B thế hệ mới, thiết kế coupe SUV và không gian linh hoạt.",
      brand: "Honda",
      rarity: "uncommon",
      baseStats: {
        speed: 180,
        acceleration: 10,
        handling: 73,
        durability: 120,
      },
      imageUrl: "https://i.imgur.com/3ZkF7Xm.png",
      gachaWeight: 68,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Honda HR-V G 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_raize_2022" },
    {
      modelId: "toyota_raize_2022",
      name: "Toyota Raize 2022",
      description: "SUV đô thị cỡ nhỏ, năng động và đầy đủ tiện nghi.",
      brand: "Toyota",
      rarity: "uncommon",
      baseStats: {
        speed: 170,
        acceleration: 10,
        handling: 74,
        durability: 110,
      }, // Động cơ turbo nhỏ
      imageUrl: "https://i.imgur.com/gH0Jk4L.png",
      gachaWeight: 66,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Raize 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "kia_sonet_2022_premium" },
    {
      modelId: "kia_sonet_2022_premium",
      name: "Kia Sonet Premium 2022",
      description:
        "Mẫu A-SUV nhỏ nhất của Kia, trang bị hiện đại và thiết kế bắt mắt.",
      brand: "Kia",
      rarity: "uncommon",
      baseStats: {
        speed: 175,
        acceleration: 11,
        handling: 71,
        durability: 115,
      },
      imageUrl: "https://i.imgur.com/vN5sK2J.png",
      gachaWeight: 64,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Kia Sonet Premium 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "hyundai_creta_2022_standard" },
    {
      modelId: "hyundai_creta_2022_standard",
      name: "Hyundai Creta Standard 2022",
      description:
        "Thiết kế 'Parametric Jewel' ấn tượng, không gian thực dụng.",
      brand: "Hyundai",
      rarity: "uncommon",
      baseStats: {
        speed: 180,
        acceleration: 10,
        handling: 70,
        durability: 125,
      },
      imageUrl: "https://i.imgur.com/zM6tU8K.png",
      gachaWeight: 62,
      castrolValue: 3,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Hyundai Creta Standard 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "ford_everest_2021_sport" },
    {
      modelId: "ford_everest_2021_sport",
      name: "Ford Everest Sport 2021",
      description:
        "SUV 7 chỗ mạnh mẽ với vẻ ngoài thể thao và khả năng off-road tốt.",
      brand: "Ford",
      rarity: "uncommon",
      baseStats: {
        speed: 175,
        acceleration: 11,
        handling: 60,
        durability: 155,
      },
      imageUrl: "https://i.imgur.com/RjP5kLq.png",
      gachaWeight: 60,
      castrolValue: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ford Everest Sport 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "mitsubishi_pajero_sport_2020_dakar" },
    {
      modelId: "mitsubishi_pajero_sport_2020_dakar",
      name: "Mitsubishi Pajero Sport Dakar 2020",
      description:
        "SUV 7 chỗ đích thực, kế thừa tinh hoa từ huyền thoại Dakar Rally.",
      brand: "Mitsubishi",
      rarity: "uncommon",
      baseStats: {
        speed: 180,
        acceleration: 10,
        handling: 62,
        durability: 160,
      },
      imageUrl: "https://i.imgur.com/l9gHk4W.png",
      gachaWeight: 58,
      castrolValue: 5,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mitsubishi Pajero Sport Dakar 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "vinfast_lux_sa20_plus_2021" },
    {
      modelId: "vinfast_lux_sa20_plus_2021",
      name: "VinFast LUX SA2.0 Plus 2021",
      description:
        "SUV 7 chỗ sang trọng của VinFast, nền tảng BMW X5 và động cơ mạnh mẽ.",
      brand: "VinFast",
      rarity: "uncommon",
      baseStats: { speed: 220, acceleration: 8, handling: 68, durability: 145 },
      imageUrl: "https://i.imgur.com/Q7wO3xP.png",
      gachaWeight: 56,
      castrolValue: 6,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: VinFast LUX SA2.0 Plus 2021");

  // --- Rare ---

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_camry_2022_xse" },
    {
      modelId: "toyota_camry_2022_xse",
      name: "Toyota Camry XSE 2022",
      description:
        "Phiên bản thể thao của Camry, kết hợp sự sang trọng và cảm giác lái năng động.",
      brand: "Toyota",
      rarity: "rare",
      baseStats: { speed: 225, acceleration: 7, handling: 75, durability: 135 },
      imageUrl: "https://i.imgur.com/SKu1g1p.png",
      gachaWeight: 70,
      castrolValue: 8,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota Camry XSE 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "honda_accord_2021_sport" },
    {
      modelId: "honda_accord_2021_sport",
      name: "Honda Accord Sport 2021",
      description:
        "Sedan hạng D với động cơ Turbo mạnh mẽ và thiết kế lịch lãm.",
      brand: "Honda",
      rarity: "rare",
      baseStats: { speed: 230, acceleration: 7, handling: 77, durability: 130 },
      imageUrl: "https://i.imgur.com/NlFRE08.png",
      gachaWeight: 68,
      castrolValue: 8,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Honda Accord Sport 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "mazda_6_2020_signature" },
    {
      modelId: "mazda_6_2020_signature",
      name: "Mazda 6 Signature 2020",
      description:
        "Đỉnh cao của dòng sedan Mazda, nội thất da Nappa và động cơ SkyActiv-G Turbo.",
      brand: "Mazda",
      rarity: "rare",
      baseStats: { speed: 240, acceleration: 6, handling: 78, durability: 125 },
      imageUrl: "https://i.imgur.com/Ue2Y9fh.png",
      gachaWeight: 66,
      castrolValue: 9,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mazda 6 Signature 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "kia_k5_gtline_2022" }, // K5 là tên mới của Optima
    {
      modelId: "kia_k5_gtline_2022",
      name: "Kia K5 GT-Line 2022",
      description:
        "Thiết kế fastback táo bạo, nhiều công nghệ và lựa chọn động cơ mạnh.",
      brand: "Kia",
      rarity: "rare",
      baseStats: { speed: 235, acceleration: 7, handling: 76, durability: 128 },
      imageUrl: "https://i.imgur.com/YmSu71R.png",
      gachaWeight: 64,
      castrolValue: 8,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Kia K5 GT-Line 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "hyundai_sonata_nline_2021" },
    {
      modelId: "hyundai_sonata_nline_2021",
      name: "Hyundai Sonata N-Line 2021",
      description:
        "Phiên bản hiệu suất cao của Sonata, mang đến trải nghiệm lái phấn khích.",
      brand: "Hyundai",
      rarity: "rare",
      baseStats: { speed: 245, acceleration: 6, handling: 79, durability: 122 },
      imageUrl: "https://i.imgur.com/kO3iN7M.png",
      gachaWeight: 62,
      castrolValue: 9,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Hyundai Sonata N-Line 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "vinfast_president_2021" },
    {
      modelId: "vinfast_president_2021",
      name: "VinFast President 2021",
      description:
        "SUV hạng sang đầu bảng của VinFast, động cơ V8 mạnh mẽ và số lượng giới hạn.",
      brand: "VinFast",
      rarity: "rare",
      baseStats: { speed: 250, acceleration: 6, handling: 65, durability: 150 }, // Tốc độ có thể giới hạn
      imageUrl: "https://i.imgur.com/VbN9gLz.png",
      gachaWeight: 50, // Hiếm hơn chút
      castrolValue: 15,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: VinFast President 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "mercedes_benz_glc300_2022" },
    {
      modelId: "mercedes_benz_glc300_2022",
      name: "Mercedes-Benz GLC 300 4MATIC 2022",
      description:
        "SUV hạng sang cỡ nhỏ, cân bằng giữa sự thoải mái, công nghệ và khả năng vận hành.",
      brand: "Mercedes-Benz",
      rarity: "rare",
      baseStats: { speed: 240, acceleration: 6, handling: 74, durability: 140 },
      imageUrl: "https://i.imgur.com/h7J1tOr.png",
      gachaWeight: 58,
      castrolValue: 10,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mercedes-Benz GLC 300 4MATIC 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "bmw_x3_xdrive30i_2022" },
    {
      modelId: "bmw_x3_xdrive30i_2022",
      name: "BMW X3 xDrive30i 2022",
      description:
        "Đối thủ cạnh tranh của GLC 300, mang đến cảm giác lái thể thao đặc trưng của BMW.",
      brand: "BMW",
      rarity: "rare",
      baseStats: { speed: 240, acceleration: 6, handling: 76, durability: 138 },
      imageUrl: "https://i.imgur.com/w5fQ7xL.png",
      gachaWeight: 57,
      castrolValue: 10,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: BMW X3 xDrive30i 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "audi_q5_2021_premiumplus" },
    {
      modelId: "audi_q5_2021_premiumplus",
      name: "Audi Q5 Premium Plus 2021",
      description:
        "SUV hạng sang với hệ dẫn động Quattro nổi tiếng và thiết kế tinh tế.",
      brand: "Audi",
      rarity: "rare",
      baseStats: { speed: 237, acceleration: 6, handling: 75, durability: 135 },
      imageUrl: "https://i.imgur.com/YqP8F2s.png",
      gachaWeight: 56,
      castrolValue: 10,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Audi Q5 Premium Plus 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "lexus_nx350_fsport_2023" },
    {
      modelId: "lexus_nx350_fsport_2023",
      name: "Lexus NX 350 F Sport 2023",
      description:
        "SUV hạng sang cỡ nhỏ từ Nhật Bản, độ tin cậy cao và phong cách F Sport thể thao.",
      brand: "Lexus",
      rarity: "rare",
      baseStats: { speed: 200, acceleration: 7, handling: 73, durability: 145 }, // Tập trung vào sự êm ái
      imageUrl: "https://i.imgur.com/y0hG3wJ.png",
      gachaWeight: 55,
      castrolValue: 11,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Lexus NX 350 F Sport 2023");

  await CarModel.findOneAndUpdate(
    { modelId: "volvo_xc60_b5_inscription_2022" },
    {
      modelId: "volvo_xc60_b5_inscription_2022",
      name: "Volvo XC60 B5 Inscription 2022",
      description:
        "An toàn là trên hết, SUV Thụy Điển với thiết kế tối giản và sang trọng.",
      brand: "Volvo",
      rarity: "rare",
      baseStats: { speed: 180, acceleration: 7, handling: 72, durability: 150 }, // Tốc độ giới hạn điện tử
      imageUrl: "https://i.imgur.com/7f8jL3k.png",
      gachaWeight: 54,
      castrolValue: 11,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Volvo XC60 B5 Inscription 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "ford_mustang_ecoboost_2020" },
    {
      modelId: "ford_mustang_ecoboost_2020",
      name: "Ford Mustang EcoBoost 2020",
      description:
        "Sức mạnh từ động cơ tăng áp 2.3L, một lựa chọn 'nhẹ nhàng' hơn của Mustang.",
      brand: "Ford",
      rarity: "rare",
      baseStats: { speed: 240, acceleration: 5, handling: 78, durability: 120 },
      imageUrl:
        "https://hips.hearstapps.com/hmg-prod/images/2020-ford-mustang-ecoboost-coupe-hpp-102-1568989846.jpg",
      gachaWeight: 53,
      castrolValue: 12,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ford Mustang EcoBoost 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "chevrolet_camaro_lt1_2021" },
    {
      modelId: "chevrolet_camaro_lt1_2021",
      name: "Chevrolet Camaro LT1 2021",
      description:
        "Trải nghiệm động cơ V8 của Camaro với mức giá dễ tiếp cận hơn.",
      brand: "Chevrolet",
      rarity: "rare",
      baseStats: { speed: 250, acceleration: 4, handling: 77, durability: 125 }, // Ước lượng
      imageUrl: "https://i.imgur.com/R6hK0mZ.png",
      gachaWeight: 52,
      castrolValue: 13,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Chevrolet Camaro LT1 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "dodge_challenger_rt_2019" },
    {
      modelId: "dodge_challenger_rt_2019",
      name: "Dodge Challenger R/T 2019",
      description: "Cơ bắp Mỹ cổ điển với động cơ HEMI V8 gầm rú.",
      brand: "Dodge",
      rarity: "rare",
      baseStats: { speed: 235, acceleration: 5, handling: 70, durability: 140 },
      imageUrl: "https://i.imgur.com/wXgG4hT.png",
      gachaWeight: 51,
      castrolValue: 14,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Dodge Challenger R/T 2019");

  await CarModel.findOneAndUpdate(
    { modelId: "nissan_370z_nismo_2018" },
    {
      modelId: "nissan_370z_nismo_2018",
      name: "Nissan 370Z Nismo 2018",
      description: "Phiên bản hiệu suất cao của 370Z, tinh chỉnh bởi Nismo.",
      brand: "Nissan",
      rarity: "rare",
      baseStats: { speed: 250, acceleration: 5, handling: 83, durability: 115 },
      imageUrl: "https://i.imgur.com/mYqZ8vD.png",
      gachaWeight: 50,
      castrolValue: 15,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Nissan 370Z Nismo 2018");

  await CarModel.findOneAndUpdate(
    { modelId: "toyota_gr_supra_2020_30" }, // GR Supra 3.0
    {
      modelId: "toyota_gr_supra_2020_30",
      name: "Toyota GR Supra 3.0 2020",
      description:
        "Sự trở lại của một huyền thoại, hợp tác cùng BMW, động cơ 6 xi-lanh thẳng hàng.",
      brand: "Toyota",
      rarity: "rare",
      baseStats: { speed: 250, acceleration: 4, handling: 85, durability: 120 }, // Tốc độ giới hạn
      imageUrl: "https://i.imgur.com/oO8hGkL.png",
      gachaWeight: 49,
      castrolValue: 16,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Toyota GR Supra 3.0 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "alfa_romeo_giulia_quadrifoglio_2019" },
    {
      modelId: "alfa_romeo_giulia_quadrifoglio_2019",
      name: "Alfa Romeo Giulia Quadrifoglio 2019",
      description:
        "Sedan thể thao Ý với trái tim Ferrari, thiết kế quyến rũ và cảm xúc mãnh liệt.",
      brand: "Alfa Romeo",
      rarity: "rare",
      baseStats: {
        speed: 307,
        acceleration: 3.8,
        handling: 88,
        durability: 110,
      },
      imageUrl: "https://i.imgur.com/jQpE7Xm.png",
      gachaWeight: 48,
      castrolValue: 17,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Alfa Romeo Giulia Quadrifoglio 2019");

  await CarModel.findOneAndUpdate(
    { modelId: "jaguar_fpace_svr_2021" },
    {
      modelId: "jaguar_fpace_svr_2021",
      name: "Jaguar F-Pace SVR 2021",
      description:
        "SUV hiệu suất cao từ Anh Quốc, động cơ V8 siêu nạp gầm thét.",
      brand: "Jaguar",
      rarity: "rare",
      baseStats: { speed: 286, acceleration: 4, handling: 76, durability: 130 },
      imageUrl: "https://i.imgur.com/ZlI8uF0.png",
      gachaWeight: 47,
      castrolValue: 18,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Jaguar F-Pace SVR 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "porsche_macan_gts_2022" },
    {
      modelId: "porsche_macan_gts_2022",
      name: "Porsche Macan GTS 2022",
      description:
        "SUV nhỏ gọn nhưng mang đậm DNA thể thao của Porsche, phiên bản GTS mạnh mẽ.",
      brand: "Porsche",
      rarity: "rare",
      baseStats: {
        speed: 272,
        acceleration: 4.3,
        handling: 82,
        durability: 125,
      },
      imageUrl: "https://i.imgur.com/p8KjY7M.png",
      gachaWeight: 46,
      castrolValue: 19,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Porsche Macan GTS 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "maserati_ghibli_s_q4_2018" },
    {
      modelId: "maserati_ghibli_s_q4_2018",
      name: "Maserati Ghibli S Q4 2018",
      description:
        "Sedan hạng sang Ý với âm thanh động cơ quyến rũ và phong cách độc đáo.",
      brand: "Maserati",
      rarity: "rare",
      baseStats: {
        speed: 286,
        acceleration: 4.7,
        handling: 75,
        durability: 120,
      },
      imageUrl: "https://i.imgur.com/bVf0cRk.png",
      gachaWeight: 45,
      castrolValue: 20,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Maserati Ghibli S Q4 2018");

  // --- Epic ---

  await CarModel.findOneAndUpdate(
    { modelId: "porsche_911_gt3_992" },
    {
      modelId: "porsche_911_gt3_992",
      name: "Porsche 911 GT3 (992)",
      description:
        "Cỗ máy đường đua được hợp pháp hóa cho đường phố, tập trung vào cảm giác lái thuần khiết.",
      brand: "Porsche",
      rarity: "epic",
      baseStats: {
        speed: 318,
        acceleration: 3.4,
        handling: 92,
        durability: 130,
      }, // 0-100km/h
      imageUrl: "https://i.imgur.com/xJ5kLPK.png",
      gachaWeight: 25,
      castrolValue: 30,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Porsche 911 GT3 (992)");

  await CarModel.findOneAndUpdate(
    { modelId: "mclaren_gt_2021" },
    {
      modelId: "mclaren_gt_2021",
      name: "McLaren GT 2021",
      description:
        "Sự kết hợp giữa hiệu suất siêu xe và sự thoải mái của một chiếc Grand Tourer.",
      brand: "McLaren",
      rarity: "epic",
      baseStats: {
        speed: 326,
        acceleration: 3.2,
        handling: 88,
        durability: 125,
      },
      imageUrl: "https://i.imgur.com/bE9E9Xm.png",
      gachaWeight: 24,
      castrolValue: 32,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: McLaren GT 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "ferrari_roma_2022" },
    {
      modelId: "ferrari_roma_2022",
      name: "Ferrari Roma 2022",
      description:
        "'La Nuova Dolce Vita' - Vẻ đẹp thanh lịch của Ý và sức mạnh V8 tăng áp kép.",
      brand: "Ferrari",
      rarity: "epic",
      baseStats: {
        speed: 320,
        acceleration: 3.4,
        handling: 87,
        durability: 120,
      },
      imageUrl: "https://i.imgur.com/c8qkD8g.png",
      gachaWeight: 23,
      castrolValue: 35,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ferrari Roma 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "lamborghini_huracan_rwd_2020" }, // RWD (Rear-Wheel Drive)
    {
      modelId: "lamborghini_huracan_rwd_2020",
      name: "Lamborghini Huracan RWD 2020",
      description:
        "Phiên bản dẫn động cầu sau của Huracan, mang lại trải nghiệm lái thuần khiết và đầy thử thách.",
      brand: "Lamborghini",
      rarity: "epic",
      baseStats: {
        speed: 320,
        acceleration: 3.3,
        handling: 90,
        durability: 128,
      },
      imageUrl: "https://i.imgur.com/7s3KUiP.png",
      gachaWeight: 22,
      castrolValue: 38,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Lamborghini Huracan RWD 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "audi_r8_v10_performance_rwd_2021" },
    {
      modelId: "audi_r8_v10_performance_rwd_2021",
      name: "Audi R8 V10 Performance RWD 2021",
      description:
        "Siêu xe hàng ngày với động cơ V10 hút khí tự nhiên và hệ dẫn động cầu sau thú vị.",
      brand: "Audi",
      rarity: "epic",
      baseStats: {
        speed: 329,
        acceleration: 3.7,
        handling: 89,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/kM4fD9O.png",
      gachaWeight: 21,
      castrolValue: 40,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Audi R8 V10 Performance RWD 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "aston_martin_vantage_v8_2019" },
    {
      modelId: "aston_martin_vantage_v8_2019",
      name: "Aston Martin Vantage V8 2019",
      description:
        "Thiết kế săn mồi, động cơ V8 mạnh mẽ từ AMG và sự sang trọng của Anh Quốc.",
      brand: "Aston Martin",
      rarity: "epic",
      baseStats: {
        speed: 314,
        acceleration: 3.6,
        handling: 86,
        durability: 122,
      },
      imageUrl: "https://i.imgur.com/5pFxG9E.png",
      gachaWeight: 20,
      castrolValue: 42,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Aston Martin Vantage V8 2019");

  await CarModel.findOneAndUpdate(
    { modelId: "mercedes_amg_gt_s_2018" },
    {
      modelId: "mercedes_amg_gt_s_2018",
      name: "Mercedes-AMG GT S 2018",
      description:
        "Siêu xe thể thao với động cơ V8 BiTurbo đặt trước, hiệu suất ấn tượng.",
      brand: "Mercedes-AMG",
      rarity: "epic",
      baseStats: {
        speed: 310,
        acceleration: 3.8,
        handling: 88,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/qL9xW8S.png",
      gachaWeight: 19,
      castrolValue: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mercedes-AMG GT S 2018");

  await CarModel.findOneAndUpdate(
    { modelId: "bmw_m8_competition_coupe_2020" },
    {
      modelId: "bmw_m8_competition_coupe_2020",
      name: "BMW M8 Competition Coupe 2020",
      description:
        "Sự sang trọng và sức mạnh đỉnh cao từ BMW M, một chiếc GT hiệu suất khủng.",
      brand: "BMW",
      rarity: "epic",
      baseStats: {
        speed: 305,
        acceleration: 3.2,
        handling: 85,
        durability: 135,
      }, // Tốc độ giới hạn
      imageUrl: "https://i.imgur.com/rP0nK4G.png",
      gachaWeight: 18,
      castrolValue: 48,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: BMW M8 Competition Coupe 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "nissan_gtr_premium_2020_r35" },
    {
      modelId: "nissan_gtr_premium_2020_r35",
      name: "Nissan GT-R Premium 2020 (R35)",
      description:
        "Godzilla! Sát thủ siêu xe với công nghệ và hiệu suất đáng kinh ngạc.",
      brand: "Nissan",
      rarity: "epic",
      baseStats: {
        speed: 315,
        acceleration: 2.9,
        handling: 90,
        durability: 140,
      }, // 0-60 mph
      imageUrl: "https://i.imgur.com/8cXZYjP.png",
      gachaWeight: 17,
      castrolValue: 50,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Nissan GT-R Premium 2020 (R35)");

  await CarModel.findOneAndUpdate(
    { modelId: "chevrolet_corvette_c8_stingray_z51_2020" },
    {
      modelId: "chevrolet_corvette_c8_stingray_z51_2020",
      name: "Chevrolet Corvette C8 Stingray Z51 2020",
      description:
        "Cuộc cách mạng động cơ đặt giữa của Corvette, hiệu suất siêu xe với giá phải chăng.",
      brand: "Chevrolet",
      rarity: "epic",
      baseStats: {
        speed: 312,
        acceleration: 2.9,
        handling: 89,
        durability: 130,
      }, // Với Z51 package
      imageUrl: "https://i.imgur.com/kL2xG7H.png",
      gachaWeight: 16,
      castrolValue: 46,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Chevrolet Corvette C8 Stingray Z51 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "lexus_lc500_performance_2021" },
    {
      modelId: "lexus_lc500_performance_2021",
      name: "Lexus LC500 Performance Package 2021",
      description:
        "Thiết kế coupe GT tuyệt đẹp, động cơ V8 hút khí tự nhiên và sự sang trọng của Lexus.",
      brand: "Lexus",
      rarity: "epic",
      baseStats: {
        speed: 270,
        acceleration: 4.4,
        handling: 84,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/sA7gHjK.png",
      gachaWeight: 15,
      castrolValue: 43,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Lexus LC500 Performance Package 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "jaguar_ftype_r_coupe_2020" },
    {
      modelId: "jaguar_ftype_r_coupe_2020",
      name: "Jaguar F-Type R Coupe 2020",
      description:
        "Tiếng gầm của động cơ V8 siêu nạp và thiết kế quyến rũ đậm chất Anh.",
      brand: "Jaguar",
      rarity: "epic",
      baseStats: {
        speed: 300,
        acceleration: 3.5,
        handling: 87,
        durability: 125,
      },
      imageUrl: "https://i.imgur.com/xT6jK9L.png",
      gachaWeight: 14,
      castrolValue: 47,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Jaguar F-Type R Coupe 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "ford_shelby_gt500_2020_mustang" },
    {
      modelId: "ford_shelby_gt500_2020_mustang",
      name: "Ford Shelby GT500 Mustang 2020",
      description:
        "Phiên bản Mustang mạnh mẽ nhất từng được sản xuất, một con quái vật trên đường thẳng.",
      brand: "Ford",
      rarity: "epic",
      baseStats: {
        speed: 290,
        acceleration: 3.3,
        handling: 80,
        durability: 140,
      }, // Tốc độ giới hạn điện tử
      imageUrl: "https://i.imgur.com/O9pL7Kj.png",
      gachaWeight: 13,
      castrolValue: 52,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ford Shelby GT500 Mustang 2020");

  await CarModel.findOneAndUpdate(
    { modelId: "dodge_viper_acr_2017" },
    {
      modelId: "dodge_viper_acr_2017",
      name: "Dodge Viper ACR 2017",
      description:
        "Cỗ máy đường đua thuần khiết, tập trung vào khí động học và khả năng bám đường.",
      brand: "Dodge",
      rarity: "epic",
      baseStats: {
        speed: 285,
        acceleration: 3.4,
        handling: 93,
        durability: 130,
      }, // Ưu tiên handling
      imageUrl: "https://i.imgur.com/dZ3nK7L.png",
      gachaWeight: 12,
      castrolValue: 55,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Dodge Viper ACR 2017");

  await CarModel.findOneAndUpdate(
    { modelId: "honda_nsx_type_s_2022" },
    {
      modelId: "honda_nsx_type_s_2022",
      name: "Honda NSX Type S 2022",
      description:
        "Phiên bản cuối cùng và mạnh mẽ nhất của NSX thế hệ thứ hai, một lời chia tay huy hoàng.",
      brand: "Honda", // Acura NSX ở một số thị trường
      rarity: "epic",
      baseStats: {
        speed: 307,
        acceleration: 2.9,
        handling: 91,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/9YtO0zK.png",
      gachaWeight: 11,
      castrolValue: 58,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Honda NSX Type S 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "maserati_mc20_2022" },
    {
      modelId: "maserati_mc20_2022",
      name: "Maserati MC20 2022",
      description:
        "Sự trở lại của Maserati trong phân khúc siêu xe với động cơ Nettuno V6 sáng tạo.",
      brand: "Maserati",
      rarity: "epic",
      baseStats: {
        speed: 325,
        acceleration: 2.9,
        handling: 89,
        durability: 120,
      },
      imageUrl: "https://i.imgur.com/nK7uL9O.png",
      gachaWeight: 10,
      castrolValue: 60,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Maserati MC20 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "porsche_taycan_turbo_s_2021" },
    {
      modelId: "porsche_taycan_turbo_s_2021",
      name: "Porsche Taycan Turbo S 2021",
      description:
        "Siêu xe điện đến từ Porsche, tăng tốc kinh hoàng và công nghệ tương lai.",
      brand: "Porsche",
      rarity: "epic",
      baseStats: {
        speed: 260,
        acceleration: 2.8,
        handling: 90,
        durability: 135,
      }, // 0-100km/h
      imageUrl: "https://i.imgur.com/vH5fG8P.png",
      gachaWeight: 9,
      castrolValue: 50,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Porsche Taycan Turbo S 2021");

  await CarModel.findOneAndUpdate(
    { modelId: "audi_rs_e_tron_gt_2022" },
    {
      modelId: "audi_rs_e_tron_gt_2022",
      name: "Audi RS e-tron GT 2022",
      description:
        "Người anh em của Taycan, mang thiết kế Audi và hiệu suất điện mạnh mẽ.",
      brand: "Audi",
      rarity: "epic",
      baseStats: {
        speed: 250,
        acceleration: 3.3,
        handling: 88,
        durability: 133,
      },
      imageUrl: "https://i.imgur.com/L7pG3wS.png",
      gachaWeight: 8,
      castrolValue: 48,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Audi RS e-tron GT 2022");

  await CarModel.findOneAndUpdate(
    { modelId: "lotus_emira_v6_first_edition_2023" },
    {
      modelId: "lotus_emira_v6_first_edition_2023",
      name: "Lotus Emira V6 First Edition 2023",
      description:
        "Chiếc xe thể thao động cơ xăng cuối cùng của Lotus, tập trung vào trải nghiệm lái.",
      brand: "Lotus",
      rarity: "epic",
      baseStats: {
        speed: 290,
        acceleration: 4.2,
        handling: 94,
        durability: 115,
      },
      imageUrl: "https://i.imgur.com/OqJ8sK7.png",
      gachaWeight: 7,
      castrolValue: 45,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Lotus Emira V6 First Edition 2023");

  await CarModel.findOneAndUpdate(
    { modelId: "ferrari_portofino_m_2021" },
    {
      modelId: "ferrari_portofino_m_2021",
      name: "Ferrari Portofino M 2021",
      description:
        "Siêu xe mui trần GT, nâng cấp từ Portofino với hiệu suất và công nghệ cải tiến.",
      brand: "Ferrari",
      rarity: "epic",
      baseStats: {
        speed: 320,
        acceleration: 3.45,
        handling: 86,
        durability: 120,
      },
      imageUrl: "https://i.imgur.com/rT4kJH0.png",
      gachaWeight: 6,
      castrolValue: 50,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ferrari Portofino M 2021");

  // --- Legendary ---

  await CarModel.findOneAndUpdate(
    { modelId: "mclaren_p1_2015" },
    {
      modelId: "mclaren_p1_2015",
      name: "McLaren P1",
      description:
        "Một trong bộ ba 'Holy Trinity' hypercar hybrid, kế thừa tinh thần của huyền thoại F1.",
      brand: "McLaren",
      rarity: "legendary",
      baseStats: {
        speed: 350,
        acceleration: 2.8,
        handling: 94,
        durability: 135,
      }, // Tốc độ giới hạn
      imageUrl: "https://i.imgur.com/pS1gD5Z.png",
      gachaWeight: 5,
      castrolValue: 70,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: McLaren P1");

  await CarModel.findOneAndUpdate(
    { modelId: "ferrari_laferrari_2014" },
    {
      modelId: "ferrari_laferrari_2014",
      name: "Ferrari LaFerrari",
      description:
        "Tuyệt tác hypercar hybrid từ Maranello, động cơ V12 kết hợp công nghệ KERS F1.",
      brand: "Ferrari",
      rarity: "legendary",
      baseStats: {
        speed: 350,
        acceleration: 2.6,
        handling: 95,
        durability: 130,
      }, // Tốc độ ước tính >350
      imageUrl: "https://i.imgur.com/dXZYwQk.png",
      gachaWeight: 4,
      castrolValue: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ferrari LaFerrari");

  await CarModel.findOneAndUpdate(
    { modelId: "porsche_918_spyder_weissach_2015" },
    {
      modelId: "porsche_918_spyder_weissach_2015",
      name: "Porsche 918 Spyder Weissach Package",
      description:
        "Hypercar hybrid của Porsche, gói Weissach tối ưu hiệu suất và giảm trọng lượng.",
      brand: "Porsche",
      rarity: "legendary",
      baseStats: {
        speed: 345,
        acceleration: 2.6,
        handling: 96,
        durability: 140,
      },
      imageUrl: "https://i.imgur.com/s6kL8Pj.png",
      gachaWeight: 4, // Ngang LaFerrari
      castrolValue: 75,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Porsche 918 Spyder Weissach Package");

  await CarModel.findOneAndUpdate(
    { modelId: "bugatti_veyron_supersport_2010" },
    {
      modelId: "bugatti_veyron_supersport_2010",
      name: "Bugatti Veyron Super Sport",
      description:
        "Từng là ông hoàng tốc độ, một biểu tượng của kỹ thuật và sức mạnh W16.",
      brand: "Bugatti",
      rarity: "legendary",
      baseStats: {
        speed: 431,
        acceleration: 2.5,
        handling: 88,
        durability: 150,
      },
      imageUrl: "https://i.imgur.com/wM7nK3D.png",
      gachaWeight: 3,
      castrolValue: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Bugatti Veyron Super Sport");

  await CarModel.findOneAndUpdate(
    { modelId: "koenigsegg_agera_rs_2017" },
    {
      modelId: "koenigsegg_agera_rs_2017",
      name: "Koenigsegg Agera RS",
      description:
        "Kẻ thách thức Veyron, một megacar Thụy Điển với sức mạnh và công nghệ đỉnh cao.",
      brand: "Koenigsegg",
      rarity: "legendary",
      baseStats: {
        speed: 447,
        acceleration: 2.8,
        handling: 90,
        durability: 145,
      }, // Tốc độ kỷ lục
      imageUrl: "https://i.imgur.com/uR5jO6L.png",
      gachaWeight: 3,
      castrolValue: 85,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Koenigsegg Agera RS");

  await CarModel.findOneAndUpdate(
    { modelId: "pagani_huayra_bc_2017" }, // Bản BC (Benny Caiola)
    {
      modelId: "pagani_huayra_bc_2017",
      name: "Pagani Huayra BC",
      description:
        "Phiên bản hardcore của Huayra, nhẹ hơn, mạnh hơn và tập trung vào đường đua.",
      brand: "Pagani",
      rarity: "legendary",
      baseStats: {
        speed: 370,
        acceleration: 2.8,
        handling: 97,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/5qHjJ8M.png",
      gachaWeight: 3,
      castrolValue: 78,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Pagani Huayra BC");

  await CarModel.findOneAndUpdate(
    { modelId: "lamborghini_aventador_svj_2019" },
    {
      modelId: "lamborghini_aventador_svj_2019",
      name: "Lamborghini Aventador SVJ",
      description:
        "SuperVeloce Jota - Phiên bản Aventador đỉnh cao, thống trị Nürburgring.",
      brand: "Lamborghini",
      rarity: "legendary",
      baseStats: {
        speed: 350,
        acceleration: 2.8,
        handling: 93,
        durability: 138,
      }, // Tốc độ >350
      imageUrl: "https://i.imgur.com/8fLwP2N.png",
      gachaWeight: 4,
      castrolValue: 72,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Lamborghini Aventador SVJ");

  await CarModel.findOneAndUpdate(
    { modelId: "ferrari_sf90_stradale_2021" },
    {
      modelId: "ferrari_sf90_stradale_2021",
      name: "Ferrari SF90 Stradale",
      description:
        "Siêu xe PHEV đầu tiên của Ferrari, 1000 mã lực và hiệu suất đáng kinh ngạc.",
      brand: "Ferrari",
      rarity: "legendary",
      baseStats: {
        speed: 340,
        acceleration: 2.5,
        handling: 94,
        durability: 132,
      },
      imageUrl: "https://i.imgur.com/xO0pQ6S.png",
      gachaWeight: 3,
      castrolValue: 82,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ferrari SF90 Stradale");

  await CarModel.findOneAndUpdate(
    { modelId: "mclaren_senna_2019" },
    {
      modelId: "mclaren_senna_2019",
      name: "McLaren Senna",
      description:
        "Đặt tên theo huyền thoại F1 Ayrton Senna, chiếc xe tập trung hoàn toàn vào hiệu suất đường đua.",
      brand: "McLaren",
      rarity: "legendary",
      baseStats: {
        speed: 335,
        acceleration: 2.8,
        handling: 98,
        durability: 125,
      }, // Khí động học là chính
      imageUrl: "https://i.imgur.com/eR7jK2L.png",
      gachaWeight: 2,
      castrolValue: 90,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: McLaren Senna");

  await CarModel.findOneAndUpdate(
    { modelId: "aston_martin_valkyrie_2022" },
    {
      modelId: "aston_martin_valkyrie_2022",
      name: "Aston Martin Valkyrie",
      description:
        "Hypercar hợp tác với Red Bull Racing, công nghệ F1 cho đường phố.",
      brand: "Aston Martin",
      rarity: "legendary",
      baseStats: {
        speed: 402,
        acceleration: 2.5,
        handling: 97,
        durability: 120,
      }, // Tốc độ ước tính
      imageUrl: "https://i.imgur.com/N7pG4xS.png",
      gachaWeight: 2,
      castrolValue: 95,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Aston Martin Valkyrie");

  await CarModel.findOneAndUpdate(
    { modelId: "mercedes_amg_one_2023" },
    {
      modelId: "mercedes_amg_one_2023",
      name: "Mercedes-AMG ONE",
      description:
        "Động cơ F1 đích thực trên một chiếc hypercar đường phố, một kỳ quan kỹ thuật.",
      brand: "Mercedes-AMG",
      rarity: "legendary",
      baseStats: {
        speed: 352,
        acceleration: 2.9,
        handling: 96,
        durability: 128,
      }, // 0-200km/h 7s
      imageUrl: "https://i.imgur.com/KjL0uH7.png",
      gachaWeight: 2,
      castrolValue: 100,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Mercedes-AMG ONE");

  await CarModel.findOneAndUpdate(
    { modelId: "rimac_nevera_2022" },
    {
      modelId: "rimac_nevera_2022",
      name: "Rimac Nevera",
      description:
        "Hypercar điện Croatia, phá vỡ hàng loạt kỷ lục về tốc độ và tăng tốc.",
      brand: "Rimac",
      rarity: "legendary",
      baseStats: {
        speed: 412,
        acceleration: 1.85,
        handling: 93,
        durability: 135,
      }, // 0-100km/h
      imageUrl: "https://i.imgur.com/rU9pK8D.png",
      gachaWeight: 2,
      castrolValue: 98,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Rimac Nevera");

  await CarModel.findOneAndUpdate(
    { modelId: "ssc_tuatara_2020" },
    {
      modelId: "ssc_tuatara_2020",
      name: "SSC Tuatara",
      description:
        "Hypercar Mỹ với mục tiêu phá kỷ lục tốc độ thế giới, thiết kế khí động học ấn tượng.",
      brand: "SSC North America",
      rarity: "legendary",
      baseStats: {
        speed: 475,
        acceleration: 2.5,
        handling: 89,
        durability: 130,
      }, // Tốc độ đạt được trong thử nghiệm (có tranh cãi)
      imageUrl: "https://i.imgur.com/oQ5xV6J.png",
      gachaWeight: 1,
      castrolValue: 110,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: SSC Tuatara");

  await CarModel.findOneAndUpdate(
    { modelId: "hennessey_venom_f5_2022" },
    {
      modelId: "hennessey_venom_f5_2022",
      name: "Hennessey Venom F5",
      description:
        "Được đặt tên theo cơn lốc F5, hypercar Mỹ với mục tiêu tốc độ trên 300 mph.",
      brand: "Hennessey",
      rarity: "legendary",
      baseStats: {
        speed: 483,
        acceleration: 2.6,
        handling: 87,
        durability: 133,
      }, // Tốc độ mục tiêu >300mph (483km/h)
      imageUrl: "https://i.imgur.com/yP0kL7G.png",
      gachaWeight: 1,
      castrolValue: 105,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Hennessey Venom F5");

  await CarModel.findOneAndUpdate(
    { modelId: "lamborghini_sian_fkp_37_2020" },
    {
      modelId: "lamborghini_sian_fkp_37_2020",
      name: "Lamborghini Sián FKP 37",
      description:
        "Siêu xe hybrid đầu tiên của Lamborghini, kết hợp động cơ V12 và siêu tụ điện.",
      brand: "Lamborghini",
      rarity: "legendary",
      baseStats: {
        speed: 350,
        acceleration: 2.8,
        handling: 92,
        durability: 136,
      }, // Tốc độ >350
      imageUrl: "https://i.imgur.com/xR7jL3k.png",
      gachaWeight: 3,
      castrolValue: 80,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Lamborghini Sián FKP 37");

  await CarModel.findOneAndUpdate(
    { modelId: "ferrari_812_competizione_2022" },
    {
      modelId: "ferrari_812_competizione_2022",
      name: "Ferrari 812 Competizione",
      description:
        "Phiên bản giới hạn, mạnh mẽ hơn của 812 Superfast, động cơ V12 hút khí tự nhiên đỉnh cao.",
      brand: "Ferrari",
      rarity: "legendary",
      baseStats: {
        speed: 340,
        acceleration: 2.85,
        handling: 94,
        durability: 128,
      },
      imageUrl: "https://i.imgur.com/7sK9jLp.png",
      gachaWeight: 3,
      castrolValue: 88,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Ferrari 812 Competizione");

  await CarModel.findOneAndUpdate(
    { modelId: "porsche_911_gt2_rs_991_2018" },
    {
      modelId: "porsche_911_gt2_rs_991_2018",
      name: "Porsche 911 GT2 RS (991.2)",
      description:
        "Chiếc 911 mạnh nhất và nhanh nhất từng được sản xuất (tại thời điểm ra mắt).",
      brand: "Porsche",
      rarity: "legendary",
      baseStats: {
        speed: 340,
        acceleration: 2.8,
        handling: 97,
        durability: 130,
      },
      imageUrl: "https://i.imgur.com/vM4nK8D.png",
      gachaWeight: 4,
      castrolValue: 77,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Porsche 911 GT2 RS (991.2)");

  await CarModel.findOneAndUpdate(
    { modelId: "mclaren_765lt_2021" },
    {
      modelId: "mclaren_765lt_2021",
      name: "McLaren 765LT",
      description:
        "Phiên bản 'Longtail' của 720S, nhẹ hơn, mạnh hơn và tập trung vào hiệu suất.",
      brand: "McLaren",
      rarity: "legendary",
      baseStats: {
        speed: 330,
        acceleration: 2.8,
        handling: 96,
        durability: 127,
      },
      imageUrl: "https://i.imgur.com/uO9xW5R.png",
      gachaWeight: 3,
      castrolValue: 83,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: McLaren 765LT");

  await CarModel.findOneAndUpdate(
    { modelId: "koenigsegg_gemera_2023" },
    {
      modelId: "koenigsegg_gemera_2023",
      name: "Koenigsegg Gemera",
      description:
        "Mega-GT 4 chỗ đầu tiên trên thế giới, 1700 mã lực và công nghệ Freevalve đột phá.",
      brand: "Koenigsegg",
      rarity: "legendary",
      baseStats: {
        speed: 400,
        acceleration: 1.9,
        handling: 90,
        durability: 140,
      }, // 0-100km/h
      imageUrl: "https://i.imgur.com/9jK8lO0.png",
      gachaWeight: 1,
      castrolValue: 120,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Koenigsegg Gemera");

  await CarModel.findOneAndUpdate(
    { modelId: "pagani_zonda_cinque_roadster_2009" }, // Một huyền thoại
    {
      modelId: "pagani_zonda_cinque_roadster_2009",
      name: "Pagani Zonda Cinque Roadster",
      description:
        "Chỉ 5 chiếc được sản xuất, một trong những Zonda hiếm và đáng mơ ước nhất.",
      brand: "Pagani",
      rarity: "legendary",
      baseStats: {
        speed: 349,
        acceleration: 3.4,
        handling: 95,
        durability: 125,
      },
      imageUrl: "https://i.imgur.com/eY7jK0P.png",
      gachaWeight: 1,
      castrolValue: 115,
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Car: Pagani Zonda Cinque Roadster");

  // --- Mythic ---
}

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ Kết nối MongoDB thành công.");
    seedGachaItems().then(() => {
      console.log("🌱 Seeding Cars model complete.");
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
  });

// node src/database/seeds/seedCarsModel.js
