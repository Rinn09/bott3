
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
  mainJob: {
    name: String,
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    lastSalary: Date, // Có thể dùng để tính lương định kỳ thay vì nhiệm vụ? Cần làm rõ
    hiredAt: Date,
    lastQuit: { type: Date, default: null },
    taskCooldowns: {
      type: Map,
      of: Number, // Key là tên nhiệm vụ (vd: 'tuoiCay'), Value là timestamp cooldown
      default: {}
    },
    // taskCount có thể giữ nguyên nếu bạn cần đếm số lần làm nhiệm vụ
    taskCount: { type: Number, default: 0 }
  },  
  
  totalEarned: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },

  inventory: { // Thêm trường này cho hệ thống Shop sau này
    type: Map,
    of: Number, // Key là ID vật phẩm, Value là số lượng
    default: {}
  }
});

module.exports = mongoose.model('User', userSchema);
