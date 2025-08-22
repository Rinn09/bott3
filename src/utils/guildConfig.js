const GuildConfig = require("../models/GuildConfig");

// default nhẹ, tuỳ repo m
const DEFAULTS = {
  prefix: "!",
  anticaps: { enabled: false, threshold: 80 },
};

async function getOrCreateGuildConfig(guildId) {
  const doc = await GuildConfig.findOneAndUpdate(
    { guildId },
    { $setOnInsert: { ...DEFAULTS, guildId } },
    { upsert: true, new: true },
  ).lean();
  return doc || { guildId, ...DEFAULTS };
}

module.exports = { getOrCreateGuildConfig, DEFAULTS };
