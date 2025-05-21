const mongoose = require("mongoose");
const CarModel = require("../models/CarModel");
const { PartDefinition } = require("../models/PartDefinition");
const User = require("../models/User"); // Cần để lấy thông tin garage của user
const Logger = require("./logger"); // Đảm bảo Logger được import

/**
 * Tính toán chỉ số hiệu quả của xe dựa trên model, phụ tùng đã lắp và thời tiết.
 * @param {object} carInstance - Object CarInstance từ user.garage.cars.
 * @param {object} carModelDoc - Document CarModel đã fetch từ DB.
 * @param {Array<object>} userPartsInGarage - Toàn bộ danh sách user.garage.parts của người chơi.
 * @param {string} trackWeather - Thời tiết của đường đua ('sunny', 'rainy', 'snowy', 'windy').
 * @returns {Promise<object>} - Object chứa các chỉ số hiệu quả: { speed, acceleration, handling, durability }.
 */
async function calculateEffectiveCarStats(
  carInstance,
  carModelDoc,
  userPartsInGarage,
  trackWeather = "sunny",
) {
  if (!carModelDoc || !carModelDoc.baseStats) {
    Logger.error(
      "[raceSimulator] carModelDoc or carModelDoc.baseStats is undefined in calculateEffectiveCarStats",
      { carInstanceId: carInstance?._id, carModelId: carInstance?.carModelId },
    );
    return { speed: 0, acceleration: 0, handling: 0, durability: 0 }; // Trả về giá trị mặc định an toàn
  }
  // Sao chép sâu baseStats để tránh thay đổi object gốc
  let effectiveStats = JSON.parse(JSON.stringify(carModelDoc.baseStats));

  if (
    carInstance.installedParts &&
    carInstance.installedParts.size > 0 &&
    userPartsInGarage &&
    userPartsInGarage.length > 0
  ) {
    const installedPartInstanceIds = Array.from(
      carInstance.installedParts.values(),
    ).map((id) => id.toString());

    const actualInstalledPartInstances = userPartsInGarage.filter(
      (p_instance) =>
        p_instance &&
        p_instance._id &&
        installedPartInstanceIds.includes(p_instance._id.toString()),
    );

    if (actualInstalledPartInstances.length > 0) {
      const partDefinitionIds = [
        ...new Set(
          actualInstalledPartInstances.map(
            (p_instance) => p_instance.partDefinitionId,
          ),
        ),
      ];
      if (partDefinitionIds.length > 0) {
        const partDefinitions = await PartDefinition.find({
          partId: { $in: partDefinitionIds },
        }).lean();
        const partDefMap = new Map(
          partDefinitions.map((pd) => [pd.partId, pd]),
        );

        for (const partInst of actualInstalledPartInstances) {
          const partDef = partDefMap.get(partInst.partDefinitionId);
          if (partDef && partDef.statModifiers) {
            for (const [stat, value] of Object.entries(partDef.statModifiers)) {
              effectiveStats[stat] = (effectiveStats[stat] || 0) + (value || 0);
            }
          }
        }
      }
    }
  }

  // Điều chỉnh theo thời tiết
  switch (trackWeather) {
    case "rainy":
      effectiveStats.handling = Math.round(effectiveStats.handling * 0.8);
      effectiveStats.acceleration = Math.round(
        effectiveStats.acceleration * 0.95,
      );
      break;
    case "snowy":
      effectiveStats.handling = Math.round(effectiveStats.handling * 0.6);
      effectiveStats.acceleration = Math.round(
        effectiveStats.acceleration * 0.7,
      );
      effectiveStats.speed = Math.round(effectiveStats.speed * 0.85);
      break;
    case "windy": // Ví dụ gió ngược
      effectiveStats.speed = Math.round(effectiveStats.speed * 0.9);
      break;
  }

  // Làm tròn và đảm bảo các chỉ số không âm
  for (const stat in effectiveStats) {
    effectiveStats[stat] = Math.max(0, Math.round(effectiveStats[stat]));
  }
  return effectiveStats;
}

/**
 * Mô phỏng một chặng đua giữa hai xe.
 * @param {object} car1EffectiveStats - Chỉ số hiệu quả của xe 1.
 * @param {object} car2EffectiveStats - Chỉ số hiệu quả của xe 2.
 * @param {string} car1Name - Tên xe 1.
 * @param {string} car2Name - Tên xe 2.
 * @param {string} stepType - Loại chặng đua ('start', 'straight', 'corner').
 * @param {number} car1SkillFactor - Yếu tố kỹ năng/may mắn cho xe 1 (0-1).
 * @param {number} car2SkillFactor - Yếu tố kỹ năng/may mắn cho xe 2 (0-1).
 * @returns {object} - { leadingCar: 'car1' | 'car2' | 'draw', logEntry: string, car1Performance: number, car2Performance: number }
 */
function simulateRaceStep(
  car1EffectiveStats,
  car2EffectiveStats,
  car1Name,
  car2Name,
  stepType,
  car1SkillFactor = 0.5,
  car2SkillFactor = 0.5,
) {
  let logEntry = "";
  let car1Performance = 0;
  let car2Performance = 0;
  // RNG factor, nhưng có thể bị ảnh hưởng bởi "skillFactor" của tay đua (NPC skill/ User luck)
  // SkillFactor cao hơn (ví dụ 0.7) sẽ có nhiều khả năng roll ra số dương hơn.
  const rngCar1 = (Math.random() - (0.5 - car1SkillFactor * 0.2)) * 15; // RNG từ -7.5 đến +7.5, thiên vị bởi skill
  const rngCar2 = (Math.random() - (0.5 - car2SkillFactor * 0.2)) * 15;

  switch (stepType) {
    case "start":
      car1Performance =
        car1EffectiveStats.acceleration * 1.6 +
        car1EffectiveStats.handling * 0.4 +
        rngCar1;
      car2Performance =
        car2EffectiveStats.acceleration * 1.6 +
        car2EffectiveStats.handling * 0.4 +
        rngCar2;
      logEntry = `🚦 Đề pa! ${car1Performance > car2Performance ? `**${car1Name}** có cú xuất phát tốt hơn!` : car2Performance > car1Performance ? `**${car2Name}** vọt lên ngay từ đầu!` : "Cả hai xe xuất phát ngang ngửa!"}`;
      break;
    case "straight":
      car1Performance =
        car1EffectiveStats.speed * 1.3 +
        car1EffectiveStats.acceleration * 0.7 +
        rngCar1;
      car2Performance =
        car2EffectiveStats.speed * 1.3 +
        car2EffectiveStats.acceleration * 0.7 +
        rngCar2;
      logEntry = `💨 Tăng tốc trên đường thẳng! ${car1Performance > car2Performance ? `**${car1Name}** bứt phá!` : car2Performance > car1Performance ? `**${car2Name}** đạt tốc độ vượt trội!` : "Cả hai xe giữ vững tốc độ!"}`;
      break;
    case "corner":
      car1Performance =
        car1EffectiveStats.handling * 1.6 +
        car1EffectiveStats.speed * 0.4 +
        rngCar1;
      car2Performance =
        car2EffectiveStats.handling * 1.6 +
        car2EffectiveStats.speed * 0.4 +
        rngCar2;
      logEntry = `🔄 Vào cua! ${car1Performance > car2Performance ? `**${car1Name}** xử lý gọn gàng!` : car2Performance > car1Performance ? `**${car2Name}** ôm cua điệu nghệ!` : "Cả hai xe qua cua an toàn!"}`;
      break;
    default: // Chặng hỗn hợp
      car1Performance =
        car1EffectiveStats.speed * 0.8 +
        car1EffectiveStats.acceleration * 0.8 +
        car1EffectiveStats.handling * 0.8 +
        rngCar1;
      car2Performance =
        car2EffectiveStats.speed * 0.8 +
        car2EffectiveStats.acceleration * 0.8 +
        car2EffectiveStats.handling * 0.8 +
        rngCar2;
      logEntry = `🏁 Chặng đua hỗn hợp! ${car1Performance > car2Performance ? `**${car1Name}** đang dẫn trước!` : car2Performance > car1Performance ? `**${car2Name}** chiếm ưu thế!` : "Cuộc đua đang rất kịch tính!"}`;
  }

  let leadingCar = "draw";
  if (car1Performance > car2Performance) leadingCar = "car1";
  else if (car2Performance > car1Performance) leadingCar = "car2";

  return { leadingCar, logEntry, car1Performance, car2Performance };
}

/**
 * Chạy mô phỏng toàn bộ cuộc đua.
 * @param {User} playerUserDoc - Document User của người chơi.
 * @param {object} playerCarInstance - Object CarInstance của người chơi.
 * @param {object} playerCarModel - Document CarModel của xe người chơi.
 * @param {object} npcProfile - Document NpcRacer của đối thủ NPC.
 * @param {object} npcCarModel - Document CarModel của xe NPC.
 * @param {object} raceDefinition - Document RaceDefinition của giải đấu.
 * @param {string} playerUsername - Username của người chơi.
 * @returns {Promise<object>} - Kết quả cuộc đua.
 */
async function runRaceSimulation(
  playerUserDoc,
  playerCarInstance,
  playerCarModel,
  npcProfile,
  npcCarModel,
  raceDefinition,
  playerUsername,
) {
  const raceLog = [];
  let playerRacePoints = 0;
  let npcRacePoints = 0;
  const numberOfSteps = raceDefinition.trackInfo?.laps || 5; // Số vòng đua hoặc số chặng
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
  ]; // Mở rộng cho nhiều chặng

  const playerEffectiveStats = await calculateEffectiveCarStats(
    playerCarInstance,
    playerCarModel,
    playerUserDoc.garage.parts,
    raceDefinition.trackInfo.defaultWeather,
  );
  // NPC cũng có thể có phụ tùng nếu `npcProfile` có thông tin đó, hoặc xe NPC có sẵn stats đã mod. Hiện tại giả định xe zin.
  const npcEffectiveStats = await calculateEffectiveCarStats(
    { installedParts: new Map() },
    npcCarModel,
    [],
    raceDefinition.trackInfo.defaultWeather,
  );

  raceLog.push(`**Giải Đua:** ${raceDefinition.name}`);
  raceLog.push(`**Tay Đua:** ${playerUsername} (Xe: ${playerCarModel.name})`);
  raceLog.push(
    `**Đối Thủ:** ${npcProfile.name} (Xe: ${npcCarModel.name}, Kỹ năng: ${npcProfile.baseSkillLevel}/100)`,
  );
  raceLog.push(
    `**Thời Tiết:** ${raceDefinition.trackInfo.defaultWeather.charAt(0).toUpperCase() + raceDefinition.trackInfo.defaultWeather.slice(1)}`,
  );
  raceLog.push(`---`);

  let playerCurrentDurability = playerCarInstance.durability;
  let npcCurrentDurability = npcCarModel.baseStats.durability; // NPC cũng có độ bền xe

  const playerSkillFactor = 0.5; // Người chơi tạm thời là 0.5 (cân bằng)
  const npcSkillFactor = (npcProfile.baseSkillLevel || 50) / 100; // Chuyển skill NPC về 0-1

  for (let i = 0; i < numberOfSteps; i++) {
    if (playerCurrentDurability <= 0 || npcCurrentDurability <= 0) break;

    const currentStepType = stepTypes[i % stepTypes.length];
    raceLog.push(
      `\n**🏁 Chặng ${i + 1}/${numberOfSteps} (${currentStepType.toUpperCase()}) 🏁**`,
    );
    const stepResult = simulateRaceStep(
      playerEffectiveStats,
      npcEffectiveStats,
      playerCarModel.name,
      npcProfile.name, // Chỉ lấy tên NPC cho ngắn gọn ở step log
      currentStepType,
      playerSkillFactor,
      npcSkillFactor,
    );
    raceLog.push(stepResult.logEntry);

    // Điểm lợi thế có thể dựa trên sự chênh lệch performance
    const performanceDiff =
      stepResult.car1Performance - stepResult.car2Performance;
    if (stepResult.leadingCar === "car1") {
      playerRacePoints += Math.max(1, Math.round(performanceDiff / 10)); // Ít nhất 1 điểm nếu thắng chặng
    } else if (stepResult.leadingCar === "car2") {
      npcRacePoints += Math.max(1, Math.round(Math.abs(performanceDiff) / 10));
    }

    // Giảm độ bền phức tạp hơn
    let playerStepDuraLoss = Math.max(
      1,
      Math.round(
        raceDefinition.difficulty / 2 +
          (5 - playerEffectiveStats.durability / 40) +
          Math.random() * 2,
      ),
    );
    let npcStepDuraLoss = Math.max(
      1,
      Math.round(
        raceDefinition.difficulty / 2 +
          (5 - npcEffectiveStats.durability / 40) +
          Math.random() * 2,
      ),
    );

    // Nếu xe yếu hơn thắng chặng -> xe mạnh hơn có thể bị "sốc" và mất thêm độ bền
    if (
      stepResult.leadingCar === "car1" &&
      npcEffectiveStats.speed + npcEffectiveStats.handling >
        playerEffectiveStats.speed + playerEffectiveStats.handling &&
      Math.random() < 0.15
    ) {
      npcStepDuraLoss = Math.round(npcStepDuraLoss * 1.5);
      raceLog.push(
        `💥 **${npcProfile.name}** có vẻ bất ngờ trước pha xử lý của bạn, xe bị chao đảo nhẹ!`,
      );
    } else if (
      stepResult.leadingCar === "car2" &&
      playerEffectiveStats.speed + playerEffectiveStats.handling >
        npcEffectiveStats.speed + npcEffectiveStats.handling &&
      Math.random() < 0.15 * npcSkillFactor
    ) {
      playerStepDuraLoss = Math.round(playerStepDuraLoss * 1.5);
      raceLog.push(
        `💥 **${playerCarModel.name}** của bạn hơi mất kiểm soát khi cố gắng theo kịp!`,
      );
    }

    // RNG cho sự cố nhỏ
    if (Math.random() < 0.05) {
      // 5% cơ hội sự cố cho người chơi
      playerStepDuraLoss += 10;
      raceLog.push(
        `❗ **${playerCarModel.name}** gặp sự cố nhỏ trên đường đua! (Mất thêm độ bền)`,
      );
    }
    if (Math.random() < 0.05 * (1 - npcSkillFactor * 0.5)) {
      // NPC có skill cao ít gặp sự cố hơn
      npcStepDuraLoss += 10;
      raceLog.push(
        `❗ **${npcCarModel.name}** của ${npcProfile.name} cũng không may mắn!`,
      );
    }

    playerCurrentDurability -= playerStepDuraLoss;
    npcCurrentDurability -= npcStepDuraLoss;
    playerCurrentDurability = Math.max(0, playerCurrentDurability);
    npcCurrentDurability = Math.max(0, npcCurrentDurability);

    raceLog.push(
      `🔩 Độ bền: **Bạn** ${playerCurrentDurability}% | **${npcProfile.name}** ${npcCurrentDurability}%.`,
    );

    if (playerCurrentDurability <= 0) {
      raceLog.push(`☠️ Xe của bạn đã hỏng nặng và không thể tiếp tục!`);
      break;
    }
    if (npcCurrentDurability <= 0) {
      raceLog.push(
        `💥 Xe của **${npcProfile.name}** đã gặp sự cố nghiêm trọng và dừng cuộc chơi!`,
      );
      break;
    }
  }

  let winner = "draw"; // draw_technical, draw_points
  let finalMessage = "";

  raceLog.push(`\n--- 🏆 **KẾT QUẢ CHUNG CUỘC** 🏆 ---`);
  if (playerCurrentDurability <= 0 && npcCurrentDurability > 0) {
    winner = "npc";
    finalMessage = `💔 **${playerCarModel.name}** của bạn đã không thể chịu đựng được cuộc đua khốc liệt! **${npcProfile.name}** chiến thắng do đối thủ bỏ cuộc!`;
  } else if (npcCurrentDurability <= 0 && playerCurrentDurability > 0) {
    winner = "player";
    finalMessage = `🎉 Xe của **${npcProfile.name}** đã bốc khói giữa đường! **${playerCarModel.name}** của bạn hiên ngang về đích! Bạn chiến thắng!`;
  } else if (playerCurrentDurability <= 0 && npcCurrentDurability <= 0) {
    winner = "draw_technical";
    finalMessage = `💣 Cả hai xe đều tan nát! Một trận đấu hủy diệt! Kết quả hòa do sự cố kỹ thuật!`;
  } else {
    finalMessage = `**Điểm Chung Cuộc:**\n- **Bạn (${playerCarModel.name}):** ${playerRacePoints} điểm\n- **${npcProfile.name} (${npcCarModel.name}):** ${npcRacePoints} điểm\n\n`;
    if (playerRacePoints > npcRacePoints) {
      winner = "player";
      finalMessage += `🎉 Xuất sắc! Bạn đã chiến thắng **${npcProfile.name}** một cách thuyết phục!`;
    } else if (npcRacePoints > playerRacePoints) {
      winner = "npc";
      finalMessage += `😭 Rất tiếc! **${npcProfile.name}** đã thể hiện kỹ năng vượt trội hơn trong cuộc đua này!`;
    } else {
      winner = "draw_points";
      finalMessage += `🤝 Một trận đấu ngang tài ngang sức! Kết quả là hòa điểm!`;
    }
  }
  raceLog.push(finalMessage);

  return {
    winner,
    raceLog,
    finalPlayerDurability: Math.max(0, playerCurrentDurability),
  };
}

module.exports = {
  calculateEffectiveCarStats,
  simulateRaceStep,
  runRaceSimulation,
};
