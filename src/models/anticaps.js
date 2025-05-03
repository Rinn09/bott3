const mongoose = require('mongoose');

const AntiCapsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  allowedUsers: { type: Array, default: [] },
});

module.exports = mongoose.model('AntiCaps', AntiCapsSchema);