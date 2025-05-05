const AntiCaps = require('../models/anticaps');
const Logger = require('./logger');

const cache = new Map(); // Map<guildId, Map<channelId, { allowedUsers: Set<string> }>>

async function loadGuildConfig(guildId) {
  try {
    const configs = await AntiCaps.find({ guildId });
    const guildCache = new Map();
    for (const config of configs) {
      guildCache.set(config.channelId, {
        allowedUsers: new Set(config.allowedUsers || []) // Chuyển array sang Set để check nhanh hơn
      });
    }
    cache.set(guildId, guildCache);
    Logger.info(`[AntiCaps Cache] Loaded settings for guild ${guildId}`);
  } catch (error) {
    Logger.error(`[AntiCaps Cache] Error loading config for guild ${guildId}: ${error.message}`);
  }
}

async function loadAllConfigs(client) {
   Logger.info('[AntiCaps Cache] Loading all anticaps settings...');
   cache.clear(); // Xóa cache cũ trước khi load
   for (const [guildId] of client.guilds.cache) {
       await loadGuildConfig(guildId);
   }
   Logger.info('[AntiCaps Cache] Finished loading all anticaps settings.');
}

function getConfig(guildId, channelId) {
  return cache.get(guildId)?.get(channelId);
}

// Hàm cập nhật cache khi dùng lệnh /anticaps
function updateConfig(guildId, channelId, data) {
    if (!cache.has(guildId)) {
        cache.set(guildId, new Map());
    }
    if (data) { // Nếu setup hoặc update
         cache.get(guildId).set(channelId, {
            allowedUsers: new Set(data.allowedUsers || [])
         });
         Logger.info(`[AntiCaps Cache] Updated cache for <span class="math-inline">\{guildId\}/</span>{channelId}`);
    } else { // Nếu disable (data = null)
         cache.get(guildId)?.delete(channelId);
         Logger.info(`[AntiCaps Cache] Removed cache for <span class="math-inline">\{guildId\}/</span>{channelId}`);
    }
}

module.exports = { loadGuildConfig, loadAllConfigs, getConfig, updateConfig };