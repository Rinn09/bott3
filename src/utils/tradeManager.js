const { Collection } = require('discord.js');
const crypto = require('crypto'); // Để tạo ID ngẫu nhiên

// Lưu các giao dịch đang chờ chấp nhận <tradeId, { initiatorId, targetId, guildId, channelId, timestamp }>
const pendingTrades = new Collection();
// Lưu các giao dịch đang hoạt động <tradeId, TradeState>
const activeTrades = new Collection();
// Lưu trữ người dùng đang tham gia giao dịch nào <userId, tradeId>
const usersInTrade = new Collection();

// --- TradeState Object Structure ---
// {
//   tradeId: string,
//   userA: { id: string, offer: { items: Map<string, number>, money: number }, confirmed: boolean },
//   userB: { id: string, offer: { items: Map<string, number>, money: number }, confirmed: boolean },
//   guildId: string,
//   channelId: string,
//   messageId: string, // ID của tin nhắn giao diện trade
//   lastUpdate: number, // Timestamp
//   interaction: Interaction | null // Lưu interaction gốc để editReply
//   collector: InteractionCollector | null // Collector của trade interface
// }

// --- Pending Trades ---

function createPendingTrade(initiatorId, targetId, guildId, channelId) {
  // Tạo ID duy nhất
  const tradeId = crypto.randomBytes(8).toString('hex');
  pendingTrades.set(tradeId, {
    initiatorId,
    targetId,
    guildId,
    channelId,
    timestamp: Date.now(),
  });
  return tradeId;
}

function getPendingTrade(tradeId) {
  return pendingTrades.get(tradeId);
}

function removePendingTrade(tradeId) {
  return pendingTrades.delete(tradeId);
}

// --- Active Trades ---

function createActiveTrade(tradeId, initiatorId, targetId, guildId, channelId, messageId, interaction) {
    if (activeTrades.has(tradeId)) return null; // Tránh tạo trùng

    const tradeState = {
        tradeId,
        userA: { id: initiatorId, offer: { items: new Map(), money: 0 }, confirmed: false },
        userB: { id: targetId, offer: { items: new Map(), money: 0 }, confirmed: false },
        guildId,
        channelId,
        messageId,
        lastUpdate: Date.now(),
        interaction: interaction, // Lưu interaction để edit
        collector: null // Sẽ gán collector sau
    };
    activeTrades.set(tradeId, tradeState);
    usersInTrade.set(initiatorId, tradeId);
    usersInTrade.set(targetId, tradeId);
    return tradeState;
}

function getActiveTrade(tradeId) {
  return activeTrades.get(tradeId);
}

function updateActiveTrade(tradeId, newStateData) {
    const trade = activeTrades.get(tradeId);
    if (!trade) return null;
    // Merge newStateData vào trade hiện tại một cách cẩn thận
    // Ví dụ đơn giản: chỉ cập nhật offer và confirmed status
    if (newStateData.userA_offer) trade.userA.offer = newStateData.userA_offer;
    if (newStateData.userB_offer) trade.userB.offer = newStateData.userB_offer;
    if (newStateData.userA_confirmed !== undefined) trade.userA.confirmed = newStateData.userA_confirmed;
    if (newStateData.userB_confirmed !== undefined) trade.userB.confirmed = newStateData.userB_confirmed;
    trade.lastUpdate = Date.now();
    activeTrades.set(tradeId, trade);
    return trade;
}


function removeActiveTrade(tradeId) {
    const trade = activeTrades.get(tradeId);
    if (trade) {
        usersInTrade.delete(trade.userA.id);
        usersInTrade.delete(trade.userB.id);
        // Dừng collector nếu có
        if (trade.collector && !trade.collector.ended) {
            trade.collector.stop('trade_removed');
        }
    }
    return activeTrades.delete(tradeId);
}

function isUserInTrade(userId) {
  return usersInTrade.has(userId);
}

function getTradeIdForUser(userId) {
    return usersInTrade.get(userId);
}

// Hàm dọn dẹp các trade cũ (có thể gọi định kỳ)
function cleanupOldTrades(timeoutDuration = 30 * 60 * 1000) { // Mặc định 30 phút
    const now = Date.now();
    pendingTrades.forEach((trade, id) => {
        if (now - trade.timestamp > timeoutDuration) {
            removePendingTrade(id);
            console.log(`Removed expired pending trade ${id}`);
        }
    });
    activeTrades.forEach((trade, id) => {
        if (now - trade.lastUpdate > timeoutDuration) {
            // Cố gắng thông báo hủy nếu có thể
            trade.interaction?.editReply({ content: ' Giao dịch đã bị hủy do không hoạt động quá lâu.', components: [], embeds: [] }).catch(()=>{});
            removeActiveTrade(id);
            console.log(`Removed expired active trade ${id}`);
        }
    });
}

// Tự động dọn dẹp mỗi 5 phút chẳng hạn
setInterval(cleanupOldTrades, 5 * 60 * 1000);


module.exports = {
  createPendingTrade,
  getPendingTrade,
  removePendingTrade,
  createActiveTrade,
  getActiveTrade,
  updateActiveTrade,
  removeActiveTrade,
  isUserInTrade,
  getTradeIdForUser,
  cleanupOldTrades,
};