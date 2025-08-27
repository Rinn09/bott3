const { Schema, model } = require("mongoose");
const RaceLogSchema = new Schema(
  {
    guildId: String,
    userId: String,
    carId: String,
    track: String,
    seed: Number,
    weather: Schema.Types.Mixed,
    stats0: Schema.Types.Mixed,
    stats1: Schema.Types.Mixed,
    lapTimes: [Number],
    placement: Number,
    reward: Number,
    wearDelta: Number,
    at: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);
RaceLogSchema.index({ userId: 1, at: -1 });
module.exports = model("RaceLog", RaceLogSchema);
