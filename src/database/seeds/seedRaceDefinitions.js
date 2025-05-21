const mongoose = require("mongoose");
const RaceDefinition = require("../../models/RaceDefinition");
const NpcRacer = require("../../models/NPCRacer"); // Sửa tên model nếu bro dùng tên khác
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

async function seedRaceDefs() {
  console.log("Seeding Race Definitions and NPC Racers...");

  // Tạo NPC mẫu trước nếu chưa có
  const npc1 = await NpcRacer.findOneAndUpdate(
    { npcId: "chi_dau_racing_girl" },
    {
      npcId: "chi_dau_racing_girl",
      name: "Chị Dậu racing girl",
      bio: "Nhìn thấy anh Dậu bị địa chủ bắt đi, tức nước vỡ bờ, chị leo lên chiếc Toyota Vios 2018 đuổi theo bọn địa chủ quyết mang anh Dậu trở về.",
      preferredCarModelIds: ["toyota_vios_2018"], // Ví dụ modelId xe common
      baseSkillLevel: 30,
      dialogues: {
        preRace: [
          "Chồng tôi đau ốm, các người không được phép hành hạ!",
          "Mày trói ngay chồng bà đi, bà cho mày xem!",
        ],
        postWin: [
          "Thua thì nín",
          "Cuộc sống như 1 điệu nhảy Tango, tao lùi 1 bước thì mày chỉ được tiến 1 bước",
        ],
        postLoss: ["Giỏi thì đua lại?"],
      },
    },
    { upsert: true, new: true },
  );
  console.log(`✅ Seeded/Updated NPC: ${npc1.name}`);

  const npc2 = await NpcRacer.findOneAndUpdate(
    { npcId: "lao_hac" },
    {
      npcId: "lao_hac",
      name: "Lão Hạc",
      bio: "Bán được cậu vàng, lão quyết định tậu 2 chiếc Civic và CX5 làm trùm đường đua.",
      preferredCarModelIds: ["honda_civic_2021_lx", "mazda_cx5_2020_touring"], // Xe uncommon
      baseSkillLevel: 60,
    },
    { upsert: true, new: true },
  );
  console.log(`✅ Seeded/Updated NPC: ${npc2.name}`);

  await RaceDefinition.findOneAndUpdate(
    { tournamentId: "giai_tan_binh_01" },
    {
      tournamentId: "giai_tan_binh_01",
      name: "Giải Đua Tân Binh - Phố Vắng",
      description: "Giải đấu khởi đầu cho các tay đua mới.",
      type: "NPC_SOLO_CHALLENGE",
      difficulty: 2,
      npcOpponentIds: [npc1.npcId], // Sử dụng npcId từ NPC đã tạo
      entryFee: 100,
      carRequirements: {
        rarity: "common", // Chỉ xe common
        minTotalStats: 0, // Không yêu cầu stats
      },
      trackInfo: {
        name: "Đường Phố Đêm Vắng",
        defaultWeather: "sunny",
        laps: 3, // Thêm số vòng đua
      },
      rewards: {
        vnd: { min: 500, max: 1000 },
        xp: { min: 10, max: 25 },
      },
      requiredLevel: 1, // Yêu cầu level 1
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Race: Giải Đua Tân Binh - Phố Vắng");

  await RaceDefinition.findOneAndUpdate(
    { tournamentId: "thach_dau_ky_su_01" },
    {
      tournamentId: "thach_dau_ky_su_01",
      name: "Thách Đấu Cao Tốc",
      description: "Thử thách tốc độ trên xa lộ.",
      type: "NPC_SOLO_CHALLENGE",
      difficulty: 5,
      npcOpponentIds: [npc2.npcId],
      entryFee: 500,
      carRequirements: {
        rarity: "uncommon", // Yêu cầu xe uncommon
        minTotalStats: 400, // Ví dụ
      },
      trackInfo: {
        name: "Xa Lộ Xuyên Màn Đêm",
        defaultWeather: "rainy",
        laps: 5,
      },
      rewards: {
        vnd: { min: 2000, max: 5000 },
        xp: { min: 50, max: 100 },
      },
      requiredLevel: 5, // Yêu cầu level 5
    },
    { upsert: true, new: true },
  );
  console.log("✅ Seeded/Updated Race: Thách Đấu Cao Tốc");

  // Thêm nhiều giải đấu khác nếu bro muốn
  console.log("Finished seeding Race Definitions and NPC Racers.");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Kết nối MongoDB thành công (seedRaceDefinitions).");
    seedRaceDefs().then(() => {
      console.log("🌱 Seeding Race Definitions and NPCs complete.");
      mongoose.disconnect();
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB (seedRaceDefinitions):", err);
  });

// node src/database/seeds/seedRaceDefinitions.js
