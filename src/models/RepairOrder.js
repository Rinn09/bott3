// src/models/RepairOrder.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const RepairOrderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase(), // Tự tạo ID ngắn 6 ký tự
    },
    ownerId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true }, // <<==== THÊM TRƯỜNG NÀY
    carInstanceId: { type: Schema.Types.ObjectId, required: true, index: true },
    carModelName: { type: String, required: true },
    currentDurability: { type: Number, required: true },
    repairToFull: { type: Boolean, default: true },
    offeredReward: { type: Number, required: true, min: 0 },
    maxCompletionTimeHours: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "completed_late",
        "cancelled_by_owner",
        "failed_by_mechanic",
      ],
      default: "pending",
      index: true,
    },
    mechanicId: { type: String, default: null, index: true },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    notesFromOwner: { type: String, maxlength: 200 },
    notesFromMechanic: { type: String, maxlength: 200 },
  },
  { timestamps: true },
);

// Index nếu cần cho query thường xuyên
RepairOrderSchema.index({ guildId: 1, status: 1 });
RepairOrderSchema.index({ guildId: 1, ownerId: 1, status: 1 });
RepairOrderSchema.index({ guildId: 1, mechanicId: 1, status: 1 });

module.exports = mongoose.model("RepairOrder", RepairOrderSchema);
