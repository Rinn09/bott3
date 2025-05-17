const Logger = require("./logger");

async function calculateCarCurrentStats(
  userCarInstance,
  carModelData,
  userGarageParts,
) {
  let currentStats = { ...(carModelData.baseStats || {}) };
  // Logic cộng dồn statModifiers từ partDefinition và bonusStats từ partInstance
  if (
    userGarageParts &&
    userCarInstance.installedParts &&
    userCarInstance.installedParts.size > 0
  ) {
    const installedPartInstanceIds = Array.from(
      userCarInstance.installedParts.values(),
    ).map((id) => id.toString());
    const currentlyInstalledPartInstances = userGarageParts.filter(
      (p_instance) =>
        installedPartInstanceIds.includes(p_instance._id.toString()),
    );

    const partDefinitionIds = [
      ...new Set(
        currentlyInstalledPartInstances.map(
          (p_instance) => p_instance.partDefinitionId,
        ),
      ),
    ];
    // Cần truy vấn PartDefinition ở đây, hoặc truyền partDefMap vào
    // Để đơn giản, giả sử bạn sẽ fetch PartDefinition bên ngoài và truyền vào nếu cần tối ưu
    // Hoặc bạn có thể fetch trong hàm này:
    const PartDefinition = require("../models/PartDefinition"); // Import ở đây nếu cần
    const partDefs = await PartDefinition.find({
      partId: { $in: partDefinitionIds },
    }).lean();
    const partDefMap = new Map(partDefs.map((def) => [def.partId, def]));

    for (const installedPartInst of currentlyInstalledPartInstances) {
      const partDef = partDefMap.get(installedPartInst.partDefinitionId);
      if (partDef && partDef.statModifiers) {
        for (const [stat, value] of Object.entries(partDef.statModifiers)) {
          currentStats[stat] = (currentStats[stat] || 0) + (value || 0);
        }
      }
      if (
        installedPartInst.bonusStats &&
        installedPartInst.bonusStats.size > 0
      ) {
        for (const [
          stat,
          bonusValue,
        ] of installedPartInst.bonusStats.entries()) {
          currentStats[stat] = (currentStats[stat] || 0) + (bonusValue || 0);
        }
      }
    }
  }
  return currentStats;
}

async function simulateRace(playerCarData, npcCarData, trackData) {
  Logger.info(
    `[RaceSim] Simulating race: Player (${playerCarData.modelName}) vs NPC (${npcCarData.modelName}) on ${trackData.name}`,
  );

  // 1. Lấy chỉ số thực tế của xe (base + parts + bonus)
  // Chỗ này cần đảm bảo playerCarData và npcCarData đã có chỉ số cuối cùng
  // Hoặc tính lại ở đây nếu cần (ví dụ, npcCarData có thể chỉ là CarModel, cần tính thêm override)

  let playerStats = playerCarData.currentStats; // Giả sử currentStats đã được tính toán và truyền vào
  let npcStats = { ...(npcCarData.baseStats || {}) }; // Bắt đầu với base của NPC
  if (npcCarData.baseStatsOverride) {
    // Áp dụng override nếu có
    Object.keys(npcCarData.baseStatsOverride).forEach((stat) => {
      if (
        npcStats[stat] !== undefined &&
        npcCarData.baseStatsOverride[stat] !== null
      ) {
        npcStats[stat] = npcCarData.baseStatsOverride[stat];
      }
    });
  }
  // NPC có thể không có phụ tùng hoặc phụ tùng của NPC được coi là đã tích hợp vào baseStatsOverride

  // 2. Yếu tố thời tiết (RNG)
  let currentWeather = null;
  let playerHandlingMultiplier = 1;
  let npcHandlingMultiplier = 1;
  // Thêm các multiplier khác nếu cần

  if (trackData.possibleWeather && trackData.possibleWeather.length > 0) {
    const totalWeatherWeight = trackData.possibleWeather.reduce(
      (sum, w) => sum + w.occurrenceWeight,
      0,
    );
    let randomWeather = Math.random() * totalWeatherWeight;
    for (const weather of trackData.possibleWeather) {
      randomWeather -= weather.occurrenceWeight;
      if (randomWeather <= 0) {
        currentWeather = weather;
        break;
      }
    }
    if (currentWeather) {
      Logger.info(
        `[RaceSim] Weather: ${currentWeather.weatherType} - ${currentWeather.effectDescription}`,
      );
      playerHandlingMultiplier =
        currentWeather.statModifiers?.handlingMultiplier || 1;
      npcHandlingMultiplier =
        currentWeather.statModifiers?.handlingMultiplier || 1; // Giả sử thời tiết ảnh hưởng cả 2 như nhau
      // Áp dụng các multiplier khác nếu có
    }
  }

  // 3. Tính Performance Score (PS) - Công thức ví dụ
  // Trọng số cho từng loại đường đua (cần định nghĩa rõ ràng hơn)
  const trackTypeWeights = {
    circuit: { speed: 0.4, acceleration: 0.3, handling: 0.3 },
    drag: { speed: 0.3, acceleration: 0.6, handling: 0.1 },
    sprint: { speed: 0.5, acceleration: 0.3, handling: 0.2 },
    // Thêm cho drift, offroad
    default: { speed: 1 / 3, acceleration: 1 / 3, handling: 1 / 3 },
  };
  const weights =
    trackTypeWeights[trackData.trackType] || trackTypeWeights.default;

  const calculatePS = (stats, handlingMulti) => {
    return (
      (stats.speed || 0) * weights.speed +
      (stats.acceleration || 0) * 10 * weights.acceleration + // Nhân accel lên cho có trọng số hơn
      (stats.handling || 0) * handlingMulti * weights.handling
    );
  };

  let playerBasePS = calculatePS(playerStats, playerHandlingMultiplier);
  let npcBasePS = calculatePS(npcStats, npcHandlingMultiplier);

  // 4. Yếu tố "Kỹ Năng Lái" / May Mắn (RNG)
  // NPC difficulty (ví dụ: easy = -0.05, medium = 0, hard = 0.05, expert = 0.1)
  const difficultyModifiers = {
    easy: -0.05,
    medium: 0,
    hard: 0.05,
    expert: 0.08,
    nightmare: 0.12,
  };
  const npcSkillFactor = difficultyModifiers[npcCarData.difficulty] || 0;

  const playerRNG = Math.random() * 0.12 - 0.06; // +/- 6% cho người chơi
  const npcRNG = Math.random() * 0.1 - 0.05; // +/- 5% cho NPC (thêm yếu tố bất ngờ)

  const finalPlayerPS = playerBasePS * (1 + playerRNG);
  const finalNpcPS = npcBasePS * (1 + npcSkillFactor + npcRNG);

  Logger.info(
    `[RaceSim] Player PS: Base=${playerBasePS.toFixed(2)}, RNG=${playerRNG.toFixed(2)}, Final=${finalPlayerPS.toFixed(2)}`,
  );
  Logger.info(
    `[RaceSim] NPC PS: Base=${npcBasePS.toFixed(2)}, Skill=${npcSkillFactor.toFixed(2)}, RNG=${npcRNG.toFixed(2)}, Final=${finalNpcPS.toFixed(2)}`,
  );

  let winner;
  let raceLog = []; // Mảng để lưu các sự kiện chính của cuộc đua

  raceLog.push(
    `Trời ${currentWeather ? currentWeather.weatherType : "quang mây tạnh"}. Đường đua ${trackData.name}!`,
  );
  raceLog.push(
    `${interaction.user.username} trên chiếc ${playerCarData.modelName} đối đầu với ${npcCarData.name} trên ${npcCarData.modelNameNpc || npcCarData.modelName}!`,
  ); // modelNameNpc nếu có

  // Logic thắng thua đơn giản
  if (finalPlayerPS > finalNpcPS) {
    winner = "player";
    raceLog.push(
      `**${interaction.user.username}** đã VƯỢT QUA ${npcCarData.name} và giành chiến thắng!`,
    );
    if (npcCarData.dialogues?.loseRace?.length > 0) {
      raceLog.push(
        `🏁 ${npcCarData.name}: "${npcCarData.dialogues.loseRace[Math.floor(Math.random() * npcCarData.dialogues.loseRace.length)]}"`,
      );
    }
  } else if (finalNpcPS > finalPlayerPS) {
    winner = "npc";
    raceLog.push(
      `${npcCarData.name} đã BỨT TỐC và chiến thắng! **${interaction.user.username}** về nhì.`,
    );
    if (npcCarData.dialogues?.winRace?.length > 0) {
      raceLog.push(
        `🏁 ${npcCarData.name}: "${npcCarData.dialogues.winRace[Math.floor(Math.random() * npcCarData.dialogues.winRace.length)]}"`,
      );
    }
  } else {
    winner = "draw"; // Hòa
    raceLog.push(
      `Thật không thể tin nổi! Cả hai tay đua VỀ ĐÍCH CÙNG LÚC! Một trận hòa nghẹt thở!`,
    );
  }

  return {
    winner,
    playerPerformance: finalPlayerPS,
    npcPerformance: finalNpcPS,
    raceLog,
    playerStatsUsed: playerStats, // Trả lại để có thể tính hao mòn độ bền
    weather: currentWeather ? currentWeather.weatherType : "sunny",
  };
}

module.exports = {
  simulateRace,
  calculateCarCurrentStats,
};
