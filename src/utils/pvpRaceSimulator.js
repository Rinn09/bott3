const mongoose = require("mongoose");
const CarModel = require("../models/CarModel");
const { PartDefinition } = require("../models/PartDefinition");
const User = require("../models/User");
const Logger = require("./logger");
// Có thể giữ lại hàm calculateEffectiveCarStats nếu nó đủ tổng quát
// Hoặc copy và sửa đổi nếu cần logic riêng cho PvP
const { calculateEffectiveCarStats } = require("./raceSimulator"); // Tạm dùng lại

/**
 * Mô phỏng một chặng đua PvP giữa hai xe.
 * @param {object} carAStats - Chỉ số hiệu quả của xe người chơi A.
 * @param {object} carBStats - Chỉ số hiệu quả của xe người chơi B.
 * @param {string} carAName - Tên xe của người chơi A.
 * @param {string} carBName - Tên xe của người chơi B.
 * @param {string} stepType - Loại chặng đua ('start', 'straight', 'corner').
 * @returns {object} - { leadingCar: 'carA' | 'carB' | 'draw', logEntry: string, carAPerformance: number, carBPerformance: number }
 */
function simulatePvpRaceStep(
  carAStats,
  carBStats,
  carAName,
  carBName,
  stepType,
) {
  let logEntry = "";
  let carAPerformance = 0;
  let carBPerformance = 0;
  // RNG đơn giản cho PvP, không có skill factor cố định như NPC
  const rngCarA = (Math.random() - 0.5) * 20; // Biên độ RNG lớn hơn một chút cho PvP?
  const rngCarB = (Math.random() - 0.5) * 20;

  switch (stepType) {
    case "start":
      carAPerformance =
        carAStats.acceleration * 1.6 + carAStats.handling * 0.4 + rngCarA;
      carBPerformance =
        carBStats.acceleration * 1.6 + carBStats.handling * 0.4 + rngCarB;
      logEntry = `🚦 Đề pa! ${carAPerformance > carBPerformance ? `**${carAName}** có cú xuất phát tốt hơn!` : carBPerformance > carAPerformance ? `**${carBName}** vọt lên ngay từ đầu!` : "Cả hai xe xuất phát ngang ngửa!"}`;
      break;
    case "straight":
      carAPerformance =
        carAStats.speed * 1.3 + carAStats.acceleration * 0.7 + rngCarA;
      carBPerformance =
        carBStats.speed * 1.3 + carBStats.acceleration * 0.7 + rngCarB;
      logEntry = `💨 Tăng tốc trên đường thẳng! ${carAPerformance > carBPerformance ? `**${carAName}** bứt phá!` : carBPerformance > carAPerformance ? `**${carBName}** đạt tốc độ vượt trội!` : "Cả hai xe giữ vững tốc độ!"}`;
      break;
    case "corner":
      carAPerformance =
        carAStats.handling * 1.6 + carAStats.speed * 0.4 + rngCarA;
      carBPerformance =
        carBStats.handling * 1.6 + carBStats.speed * 0.4 + rngCarB;
      logEntry = `🔄 Vào cua! ${carAPerformance > carBPerformance ? `**${carAName}** xử lý gọn gàng!` : carBPerformance > carAPerformance ? `**${carBName}** ôm cua điệu nghệ!` : "Cả hai xe qua cua an toàn!"}`;
      break;
    default: // Chặng hỗn hợp
      carAPerformance =
        carAStats.speed * 0.8 +
        carAStats.acceleration * 0.8 +
        carAStats.handling * 0.8 +
        rngCarA;
      carBPerformance =
        carBStats.speed * 0.8 +
        carBStats.acceleration * 0.8 +
        carBStats.handling * 0.8 +
        rngCarB;
      logEntry = `🏁 Chặng đua hỗn hợp! ${carAPerformance > carBPerformance ? `**${carAName}** đang dẫn trước!` : carBPerformance > carAPerformance ? `**${carBName}** chiếm ưu thế!` : "Cuộc đua đang rất kịch tính!"}`;
  }

  let leadingCar = "draw";
  if (carAPerformance > carBPerformance) leadingCar = "carA";
  else if (carBPerformance > carAPerformance) leadingCar = "carB";

  return { leadingCar, logEntry, carAPerformance, carBPerformance };
}

/**
 * Chạy mô phỏng toàn bộ cuộc đua PvP.
 * @param {User} playerADoc - Document User của người chơi A.
 * @param {object} playerACarInstance - Object CarInstance của người chơi A.
 * @param {object} playerACarModel - Document CarModel của xe người chơi A.
 * @param {User} playerBDoc - Document User của người chơi B.
 * @param {object} playerBCarInstance - Object CarInstance của người chơi B.
 * @param {object} playerBCarModel - Document CarModel của xe người chơi B.
 * @param {object} pvpRaceSettings - Cài đặt cho cuộc đua PvP (ví dụ: tên giải, thời tiết).
 * @returns {Promise<object>} - Kết quả cuộc đua.
 */
async function runPvPRaceSimulation(
  playerADoc,
  playerACarInstance,
  playerACarModel,
  playerBDoc,
  playerBCarInstance,
  playerBCarModel,
  pvpRaceSettings = {
    name: "Trận Đấu PvP Nảy Lửa",
    trackInfo: { name: "Đấu Trường Tốc Độ", defaultWeather: "sunny", laps: 5 },
  },
) {
  const raceLog = [];
  let playerAPoints = 0;
  let playerBPoints = 0;
  const numberOfSteps = pvpRaceSettings.trackInfo?.laps || 5;
  const stepTypes = [
    "start",
    "straight",
    "corner",
    "straight",
    "corner",
    "straight",
    "corner",
    "straight",
    "straight",
    "corner",
  ];

  const playerAEffectiveStats = await calculateEffectiveCarStats(
    playerACarInstance,
    playerACarModel,
    playerADoc.garage.parts,
    pvpRaceSettings.trackInfo.defaultWeather,
  );
  const playerBEffectiveStats = await calculateEffectiveCarStats(
    playerBCarInstance,
    playerBCarModel,
    playerBDoc.garage.parts,
    pvpRaceSettings.trackInfo.defaultWeather,
  );

  raceLog.push(`**${pvpRaceSettings.name}**`);
  raceLog.push(
    `**Tay Đua 1:** ${playerADoc.username} (Xe: ${playerACarModel.name})`,
  );
  raceLog.push(
    `**Tay Đua 2:** ${playerBDoc.username} (Xe: ${playerBCarModel.name})`,
  );
  raceLog.push(
    `**Thời Tiết:** ${pvpRaceSettings.trackInfo.defaultWeather.charAt(0).toUpperCase() + pvpRaceSettings.trackInfo.defaultWeather.slice(1)}`,
  );
  raceLog.push(`---`);

  let playerACurrentDurability = playerACarInstance.durability;
  let playerBCurrentDurability = playerBCarInstance.durability;

  for (let i = 0; i < numberOfSteps; i++) {
    if (playerACurrentDurability <= 0 || playerBCurrentDurability <= 0) break;

    const currentStepType = stepTypes[i % stepTypes.length];
    raceLog.push(
      `\n**🏁 Chặng ${i + 1}/${numberOfSteps} (${currentStepType.toUpperCase()}) 🏁**`,
    );
    const stepResult = simulatePvpRaceStep(
      playerAEffectiveStats,
      playerBEffectiveStats,
      playerACarModel.name,
      playerBCarModel.name, // Hoặc dùng username của người chơi
      currentStepType,
    );
    raceLog.push(stepResult.logEntry);

    const performanceDiff =
      stepResult.carAPerformance - stepResult.carBPerformance;
    if (stepResult.leadingCar === "carA") {
      playerAPoints += Math.max(1, Math.round(performanceDiff / 10));
    } else if (stepResult.leadingCar === "carB") {
      playerBPoints += Math.max(1, Math.round(Math.abs(performanceDiff) / 10));
    }

    // Giảm độ bền
    // Có thể dùng công thức phức tạp hơn, phụ thuộc vào diễn biến, va chạm (mô phỏng)
    let playerAStepDuraLoss = Math.max(
      1,
      Math.round(
        3 + (5 - playerAEffectiveStats.durability / 40) + Math.random() * 2,
      ),
    );
    let playerBStepDuraLoss = Math.max(
      1,
      Math.round(
        3 + (5 - playerBEffectiveStats.durability / 40) + Math.random() * 2,
      ),
    );

    // RNG cho sự cố nhỏ
    if (Math.random() < 0.07) {
      // 7% cơ hội sự cố
      playerAStepDuraLoss += 10;
      raceLog.push(
        `❗ **${playerACarModel.name}** của ${playerADoc.username} gặp sự cố nhỏ!`,
      );
    }
    if (Math.random() < 0.07) {
      playerBStepDuraLoss += 10;
      raceLog.push(
        `❗ **${playerBCarModel.name}** của ${playerBDoc.username} cũng không khá hơn!`,
      );
    }

    playerACurrentDurability -= playerAStepDuraLoss;
    playerBCurrentDurability -= playerBStepDuraLoss;
    playerACurrentDurability = Math.max(0, playerACurrentDurability);
    playerBCurrentDurability = Math.max(0, playerBCurrentDurability);

    raceLog.push(
      `🔩 Độ bền: **${playerADoc.username}** ${playerACurrentDurability}% | **${playerBDoc.username}** ${playerBCurrentDurability}%.`,
    );

    if (playerACurrentDurability <= 0 && playerBCurrentDurability <= 0) {
      raceLog.push(`☠️ Cả hai xe đều không thể tiếp tục!`);
      break;
    } else if (playerACurrentDurability <= 0) {
      raceLog.push(`☠️ Xe của **${playerADoc.username}** đã hỏng nặng!`);
      break;
    } else if (playerBCurrentDurability <= 0) {
      raceLog.push(`☠️ Xe của **${playerBDoc.username}** đã tan tành!`);
      break;
    }
  }

  let winner = "draw"; // 'playerA', 'playerB', 'draw_technical', 'draw_points'
  let finalMessage = "";

  raceLog.push(`\n--- 🏆 **KẾT QUẢ CHUNG CUỘC** 🏆 ---`);
  if (playerACurrentDurability <= 0 && playerBCurrentDurability > 0) {
    winner = "playerB";
    finalMessage = `💔 Xe của **${playerADoc.username}** đã không chịu nổi nhiệt! **${playerBDoc.username}** chiến thắng!`;
  } else if (playerBCurrentDurability <= 0 && playerACurrentDurability > 0) {
    winner = "playerA";
    finalMessage = `🎉 Xe của **${playerBDoc.username}** đã nằm đường! **${playerADoc.username}** giành chiến thắng!`;
  } else if (playerACurrentDurability <= 0 && playerBCurrentDurability <= 0) {
    winner = "draw_technical";
    finalMessage = `💣 Cả hai chiến binh đều gục ngã! Kết quả hòa do cả hai xe đều hỏng!`;
  } else {
    finalMessage = `**Điểm Chung Cuộc:**\n- **${playerADoc.username} (${playerACarModel.name}):** ${playerAPoints} điểm\n- **${playerBDoc.username} (${playerBCarModel.name}):** ${playerBPoints} điểm\n\n`;
    if (playerAPoints > playerBPoints) {
      winner = "playerA";
      finalMessage += `🎉 Chúc mừng **${playerADoc.username}** đã chiến thắng thuyết phục!`;
    } else if (playerBPoints > playerAPoints) {
      winner = "playerB";
      finalMessage += `🎉 **${playerBDoc.username}** đã thể hiện bản lĩnh và giành chiến thắng!`;
    } else {
      winner = "draw_points";
      finalMessage += `🤝 Một trận đấu ngang tài ngang sức! Kết quả là hòa điểm!`;
    }
  }
  raceLog.push(finalMessage);

  return {
    winner, // 'playerA', 'playerB', 'draw_technical', 'draw_points'
    raceLog,
    finalPlayerADurability: Math.max(0, playerACurrentDurability),
    finalPlayerBDurability: Math.max(0, playerBCurrentDurability),
  };
}

module.exports = {
  calculateEffectiveCarStats, // Vẫn export nếu nó dùng chung
  simulatePvpRaceStep,
  runPvPRaceSimulation,
};
