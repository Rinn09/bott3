const mongoose = require('mongoose');

const mainJobSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  tasks: [
    {
      name: String,
      command: String, // Lệnh thực hiện nhiệm vụ
      xp: Number,
      reward: Number // Tiền thưởng
    }
  ],
  salaryByLevel: {
    type: Map,
    of: Number // Mức lương theo từng cấp độ nghề
  }
});

module.exports = mongoose.model('MainJob', mainJobSchema);
