const CarModel = require("../models/CarModel");
const { PartDefinition } = require("../models/PartDefinition"); // Sửa import
const Logger = require("./logger");
const goldenHourManager = require("./goldenHourManager");

/**
 * Thực hiện một lượt roll dựa trên trọng số gacha.
 * @returns {Promise<{type: 'car'|'part', item: Object}|null>} - Trả về loại và thông tin vật phẩm roll được, hoặc null nếu lỗi.
 */
async function performWeightedRoll() {
  try {
    // Lấy tất cả xe và phụ tùng cùng trọng số của chúng
    // Lưu ý: Để tối ưu hiệu năng khi có nhiều item, chỉ nên lấy _id, modelId/partId và gachaWeight
    const cars = await CarModel.find(
      {},
      "modelId name rarity gachaWeight imageUrl brand description baseStats",
    ).lean(); // << THÊM baseStats, brand, description
    const parts = await PartDefinition.find(
      {},
      "partId name rarity gachaWeight imageUrl partType description statModifiers",
    ).lean(); // << THÊM description

    const boostMultipliers = goldenHourManager.getGoldenHourBoostMultiplier(); // Lấy boost multipliers

    const allItems = [
      ...cars.map((c) => ({
        ...c,
        type: "car",
        weight:
          c.gachaWeight *
          (boostMultipliers && boostMultipliers[c.rarity]
            ? boostMultipliers[c.rarity]
            : 1),
      })),
      ...parts.map((p) => ({
        ...p,
        type: "part",
        weight:
          p.gachaWeight *
          (boostMultipliers && boostMultipliers[p.rarity]
            ? boostMultipliers[p.rarity]
            : 1),
      })),
    ];

    if (allItems.length === 0) {
      Logger.error(
        "[GachaUtil] No cars or parts found in database for rolling.",
      );
      return null; // Không có gì để roll
    }

    // Tính tổng trọng số
    const totalWeight = allItems.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      Logger.error("[GachaUtil] Total gacha weight is zero or negative.");
      return null; // Tránh lỗi chia cho 0 hoặc logic sai
    }

    // Chọn ngẫu nhiên dựa trên trọng số
    let randomWeight = Math.random() * totalWeight;
    let selectedItem = null;

    for (const item of allItems) {
      randomWeight -= item.weight;
      if (randomWeight <= 0) {
        selectedItem = item;
        break;
      }
    }

    // Fallback nếu vòng lặp không chọn được (rất hiếm khi xảy ra nếu totalWeight > 0)
    if (!selectedItem) {
      selectedItem = allItems[Math.floor(Math.random() * allItems.length)];
      Logger.warn("[GachaUtil] Weighted selection fallback triggered.");
    }

    // Trả về thông tin item đã chọn
    if (selectedItem.type === "car") {
      return { type: "car", item: selectedItem };
    } else {
      return { type: "part", item: selectedItem };
    }
  } catch (error) {
    Logger.error(`[GachaUtil] Error during weighted roll: ${error.message}`, {
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Thực hiện roll có bảo hiểm (Pity System), đảm bảo ra đồ hiếm nếu đạt ngưỡng.
 * @param {Array<String>} guaranteedRarities - Danh sách các độ hiếm được coi là "cao cấp".
 * @returns {Promise<{type: 'car'|'part', item: Object}|null>}
 */
async function performPityRoll(
  guaranteedRarities = ["rare", "epic", "legendary", "mythic"],
) {
  try {
    // Lấy chỉ những xe/phụ tùng có độ hiếm nằm trong danh sách guaranteedRarities
    const cars = await CarModel.find(
      { rarity: { $in: guaranteedRarities } },
      "modelId name rarity gachaWeight imageUrl brand description baseStats",
    ).lean();
    const parts = await PartDefinition.find(
      { rarity: { $in: guaranteedRarities } },
      "partId name rarity gachaWeight imageUrl partType description statModifiers",
    ).lean();

    const rareItems = [
      ...cars.map((c) => ({ ...c, type: "car", weight: c.gachaWeight })),
      ...parts.map((p) => ({ ...p, type: "part", weight: p.gachaWeight })),
    ];

    if (rareItems.length === 0) {
      Logger.error(
        "[GachaUtil] No items found matching guaranteed rarities for pity roll.",
      );
      return await performWeightedRoll(); // Fallback về roll thường nếu không có đồ hiếm
    }

    const totalWeight = rareItems.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      Logger.error(
        "[GachaUtil] Total gacha weight for pity items is zero or negative.",
      );
      return await performWeightedRoll(); // Fallback
    }

    let randomWeight = Math.random() * totalWeight;
    let selectedItem = null;

    for (const item of rareItems) {
      randomWeight -= item.weight;
      if (randomWeight <= 0) {
        selectedItem = item;
        break;
      }
    }

    if (!selectedItem) {
      selectedItem = rareItems[Math.floor(Math.random() * rareItems.length)];
      Logger.warn("[GachaUtil] Pity weighted selection fallback triggered.");
    }

    if (selectedItem.type === "car") {
      return { type: "car", item: selectedItem };
    } else {
      return { type: "part", item: selectedItem };
    }
  } catch (error) {
    Logger.error(`[GachaUtil] Error during pity roll: ${error.message}`, {
      stack: error.stack,
    });
    return await performWeightedRoll(); // Fallback về roll thường nếu có lỗi
  }
}

module.exports = {
  performWeightedRoll,
  performPityRoll,
};
