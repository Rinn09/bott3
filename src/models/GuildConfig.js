const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeChannelId: { type: String, default: null },
  goodbyeChannelId: { type: String, default: null },
  autoRoleId: { type: String, default: null },
  logChannelId: { type: String, default: null },  
  rulesChannelId: { type: String, default: null }    
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
