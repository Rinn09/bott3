// src/utils/goldenHourManager.js
const Logger = require("./logger");
const botConfig = require("../config/botConfig");
const GuildConfig = require("../models/GuildConfig");

let goldenHourActive = false;
let goldenHourEndTime = null;
let nextGoldenHourTimeoutId = null; // ID của setTimeout để có thể clear nếu cần
let clientInstance = null; // Để lưu instance của client

function isGoldenHourActive() {
  if (!goldenHourActive) return false;
  if (Date.now() >= goldenHourEndTime) {
    // Nếu thời gian đã qua nhưng cờ chưa reset (ví dụ bot restart)
    goldenHourActive = false;
    goldenHourEndTime = null;
    Logger.info(
      "[GoldenHourManager] Golden Hour ended due to time expiry check.",
    );
    return false;
  }
  return true;
}

function getGoldenHourBoostMultiplier() {
  if (isGoldenHourActive()) {
    return botConfig.gacha.goldenHour.boostMultiplier;
  }
  return null; // Trả về null để dễ kiểm tra
}

async function startGoldenHour() {
  if (!botConfig.gacha.goldenHour.enabled || !clientInstance) return;
  if (goldenHourActive) {
    Logger.info("[GoldenHourManager] Golden Hour is already active.");
    return;
  }

  goldenHourActive = true;
  const durationMs = botConfig.gacha.goldenHour.durationMinutes * 60 * 1000;
  goldenHourEndTime = Date.now() + durationMs;

  Logger.info(
    `[GoldenHourManager] Golden Hour STARTED! Ends at: ${new Date(goldenHourEndTime).toLocaleString()}`,
  );

  // Gửi thông báo đến tất cả các server đã cấu hình kênh
  for (const [guildId, guild] of clientInstance.guilds.cache) {
    try {
      const guildCfg = await GuildConfig.findOne({ guildId: guild.id });
      const announcementChannelId = guildCfg?.goldenHourChannelId; // << LẤY TỪ GUILDCONFIG

      if (announcementChannelId) {
        const channel = await clientInstance.channels
          .fetch(announcementChannelId)
          .catch(() => null);
        if (channel && channel.isTextBased()) {
          let message =
            botConfig.gacha.goldenHour.announcementMessage ||
            "Giờ Vàng Gacha đã bắt đầu!";
          message = message.replace(
            "{duration}",
            botConfig.gacha.goldenHour.durationMinutes.toString(),
          );
          await channel.send(message);
          Logger.info(
            `[GoldenHourManager] Sent start announcement to ${channel.name} in ${guild.name}`,
          );
        } else if (channel === null) {
          Logger.warn(
            `[GoldenHourManager] Configured Golden Hour channel ${announcementChannelId} not found in guild ${guild.name}.`,
          );
        }
      }
    } catch (err) {
      Logger.error(
        `[GoldenHourManager] Failed to send start announcement to guild ${guild.id}: ${err.message}`,
      );
    }
  }

  // Hẹn giờ kết thúc
  if (nextGoldenHourTimeoutId) clearTimeout(nextGoldenHourTimeoutId); // Xóa timeout cũ nếu có (để tránh chồng chéo nếu admin kích hoạt thủ công)
  nextGoldenHourTimeoutId = setTimeout(endGoldenHour, durationMs);
}

async function endGoldenHour() {
  if (!goldenHourActive) return;

  goldenHourActive = false;
  goldenHourEndTime = null;
  Logger.info("[GoldenHourManager] Golden Hour ENDED!");

  // Gửi thông báo kết thúc đến tất cả các server đã cấu hình kênh
  for (const [guildId, guild] of clientInstance.guilds.cache) {
    try {
      const guildCfg = await GuildConfig.findOne({ guildId: guild.id });
      const announcementChannelId = guildCfg?.goldenHourChannelId; // << LẤY TỪ GUILDCONFIG

      if (announcementChannelId) {
        const channel = await clientInstance.channels
          .fetch(announcementChannelId)
          .catch(() => null);
        if (channel && channel.isTextBased()) {
          await channel.send(
            botConfig.gacha.goldenHour.endMessage ||
              "Giờ Vàng Gacha đã kết thúc!",
          );
          Logger.info(
            `[GoldenHourManager] Sent end announcement to ${channel.name} in ${guild.name}`,
          );
        }
      }
    } catch (err) {
      Logger.error(
        `[GoldenHourManager] Failed to send end announcement to guild ${guild.id}: ${err.message}`,
      );
    }
  }
  // Lên lịch cho lần tiếp theo
  scheduleNextGoldenHour();
}

function scheduleNextGoldenHour() {
  if (!botConfig.gacha.goldenHour.enabled) return;
  if (nextGoldenHourTimeoutId) clearTimeout(nextGoldenHourTimeoutId); // Xóa timeout cũ nếu có

  const { min, max } = botConfig.gacha.goldenHour.frequencyHours;
  const randomHours = Math.random() * (max - min) + min;
  const nextTimeMs = randomHours * 60 * 60 * 1000;

  Logger.info(
    `[GoldenHourManager] Next Golden Hour scheduled in approx ${randomHours.toFixed(2)} hours.`,
  );
  nextGoldenHourTimeoutId = setTimeout(startGoldenHour, nextTimeMs);
}

function initializeGoldenHour(client) {
  clientInstance = client; // Lưu client instance
  if (botConfig.gacha.goldenHour.enabled) {
    Logger.info("[GoldenHourManager] Initializing Golden Hour scheduling...");
    scheduleNextGoldenHour(); // Bắt đầu lên lịch khi bot khởi động
  } else {
    Logger.info(
      "[GoldenHourManager] Golden Hour feature is disabled in config.",
    );
  }
}

async function adminForceStartGoldenHour() {
  if (!botConfig.gacha.goldenHour.enabled) {
    Logger.warn(
      "[GoldenHourManager] Admin tried to force start, but feature is disabled.",
    );
    return "Giờ Vàng đang bị tắt trong cấu hình.";
  }
  if (goldenHourActive) {
    return "Giờ Vàng đang diễn ra rồi!";
  }
  // Hủy lịch trình tự động hiện tại để tránh chồng chéo
  if (nextGoldenHourTimeoutId) {
    clearTimeout(nextGoldenHourTimeoutId);
    nextGoldenHourTimeoutId = null;
    Logger.info(
      "[GoldenHourManager] Cleared scheduled Golden Hour due to admin force start.",
    );
  }
  await startGoldenHour(); // Bắt đầu ngay
  return "Đã kích hoạt Giờ Vàng thủ công!";
}

module.exports = {
  initializeGoldenHour,
  isGoldenHourActive,
  getGoldenHourBoostMultiplier,
  // (Tùy chọn) Thêm hàm để admin kích hoạt thủ công nếu cần
  // forceStartGoldenHour: startGoldenHour,
  // forceEndGoldenHour: endGoldenHour,
};
