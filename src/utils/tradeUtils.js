const ShopItem = require('../models/ShopItem'); // Đảm bảo đường dẫn đúng

/**

 * @param {string} itemId - ID của vật phẩm
 * @returns {Promise<number>} Giá trị ước tính của vật phẩm, hoặc 0 nếu không tìm thấy/không có giá.
 */
async function getItemTradeValue(itemId) {
  try {
    // TODO: Cân nhắc cache itemData để giảm query DB
    const itemData = await ShopItem.findOne({ itemId: itemId.toLowerCase() });
    if (!itemData) return 0;
    // Ưu tiên giá mua, nếu không có giá mua thì lấy giá bán, nếu không có cả 2 thì giá trị là 0
    return itemData.buyPrice ?? itemData.sellPrice ?? 0;
  } catch (error) {
    console.error(`Error getting trade value for item ${itemId}:`, error);
    return 0;
  }
}

/**
 * Tính tổng giá trị của một đề nghị trade (vật phẩm + tiền).
 * @param {object} offer - Đối tượng đề nghị { items: Map<itemId, quantity>, money: number }
 * @returns {Promise<number>} Tổng giá trị ước tính.
 */
async function calculateOfferValue(offer) {
  let totalValue = offer?.money || 0;
  if (offer?.items instanceof Map) {
    for (const [itemId, quantity] of offer.items.entries()) {
      const itemValue = await getItemTradeValue(itemId);
      totalValue += itemValue * quantity;
    }
  }
  return totalValue;
}

/**
 * Kiểm tra xem chênh lệch giá trị giữa hai đề nghị có hợp lệ không (<= 20%).
 * @param {object} offerA - Đề nghị của người A
 * @param {object} offerB - Đề nghị của người B
 * @returns {Promise<{valid: boolean, valueA: number, valueB: number, diff: number, percentDiff: number}>}
 */
async function checkValueDifference(offerA, offerB) {
  const valueA = await calculateOfferValue(offerA);
  const valueB = await calculateOfferValue(offerB);
  const diff = Math.abs(valueA - valueB);
  const maxVal = Math.max(valueA, valueB);

  // Tránh chia cho 0 nếu cả 2 giá trị là 0
  if (maxVal === 0) return { valid: true, valueA, valueB, diff: 0, percentDiff: 0 };

  const percentDiff = (diff / maxVal) * 100;
  const isValid = diff <= 0.20 * maxVal; // Chênh lệch không quá 20% giá trị lớn hơn

  return { valid: isValid, valueA, valueB, diff, percentDiff };
}


module.exports = {
  getItemTradeValue,
  calculateOfferValue,
  checkValueDifference,
};