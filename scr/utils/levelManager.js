const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastMessage: Date
});

userSchema.methods.addXP = function(xp) {
  this.xp += xp;
  const needed = 5 * Math.pow(this.level, 2) + 50 * this.level + 100;
  
  if (this.xp >= needed) {
    this.level += 1;
    this.xp = 0;
    return { leveledUp: true, newLevel: this.level };
  }
  return { leveledUp: false };
};

module.exports = mongoose.model('User', userSchema);