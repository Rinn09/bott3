const { Schema, model } = require("mongoose");
const LedgerSchema = new Schema(
  {
    guildId: { type: String, index: true },
    userId: { type: String, index: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 1 },
    reason: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed },
    at: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);
LedgerSchema.index({ userId: 1, at: -1 });
module.exports = model("Ledger", LedgerSchema);
