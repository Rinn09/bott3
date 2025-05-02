
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  balance: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastDaily: { type: Date },
  cooldowns: {
    work: { type: Date },
    job: { type: Date },
    transfer: { type: Date }
  },
  job: {
    name: String,
    tier: Number,
    lastSalary: Date,
    hiredAt: Date
  },
  totalEarned: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
