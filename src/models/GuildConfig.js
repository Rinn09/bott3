const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeChannelId: { type: String, default: null },
  goodbyeChannelId: { type: String, default: null },
  rulesChannelId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  autoRoleId: { type: String, default: null },
  roleChannelId: { type: String, default: null },
  salaryNotificationChannelId: { type: String, default: null },
  marketNotificationChannelId: { type: String, default: null },
  roleMessageIds: {
    gender: { type: String, default: null },
    game: { type: String, default: null }
  },
  statsChannels: {
    total: { type: String, default: null },
    online: { type: String, default: null },
    bots: { type: String, default: null }
  },
  prefix: { type: String, default: '!' }
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
