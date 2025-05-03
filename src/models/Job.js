const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: Number, required: true },
  salary: { type: Number, required: true },
  cooldown: { type: Number, required: true }, // milliseconds
  minXP: { type: Number, default: 0 }
});

module.exports = mongoose.model('Job', jobSchema);