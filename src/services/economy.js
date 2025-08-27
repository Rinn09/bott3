const User = require("../models/User");
const Ledger = require("../models/Ledger");

class EconomyService {
  static async credit({ guildId, userId, amount, reason, meta }) {
    if (amount <= 0) throw new Error("amount must be > 0");
    const doc = await User.findOneAndUpdate(
      { guildId, userId },
      { $inc: { balance: amount } },
      { upsert: true, new: true },
    ).lean();
    await Ledger.create({
      guildId,
      userId,
      type: "credit",
      amount,
      reason,
      meta,
      at: new Date(),
    });
    return doc.balance || 0;
  }

  static async debit({ guildId, userId, amount, reason, meta }) {
    if (amount <= 0) throw new Error("amount must be > 0");
    const doc = await User.findOneAndUpdate(
      { guildId, userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true },
    ).lean();
    if (!doc) throw new Error("Not enough balance");
    await Ledger.create({
      guildId,
      userId,
      type: "debit",
      amount,
      reason,
      meta,
      at: new Date(),
    });
    return doc.balance || 0;
  }

  static async moveToBank({ guildId, userId, amount }) {
    if (amount <= 0) throw new Error("amount must be > 0");
    const doc = await User.findOneAndUpdate(
      { guildId, userId, balance: { $gte: amount } },
      { $inc: { balance: -amount, bank: amount } },
      { new: true },
    ).lean();
    if (!doc) throw new Error("Not enough balance in wallet");
    await Ledger.create({
      guildId,
      userId,
      type: "debit",
      amount,
      reason: "deposit",
      at: new Date(),
    });
    return { wallet: doc.balance || 0, bank: doc.bank || 0 };
  }

  static async moveToWallet({ guildId, userId, amount }) {
    if (amount <= 0) throw new Error("amount must be > 0");
    const doc = await User.findOneAndUpdate(
      { guildId, userId, bank: { $gte: amount } },
      { $inc: { bank: -amount, balance: amount } },
      { new: true },
    ).lean();
    if (!doc) throw new Error("Not enough balance in bank");
    await Ledger.create({
      guildId,
      userId,
      type: "credit",
      amount,
      reason: "withdraw",
      at: new Date(),
    });
    return { wallet: doc.balance || 0, bank: doc.bank || 0 };
  }

  static async transfer({ guildId, fromUserId, toUserId, amount }) {
    if (amount <= 0) throw new Error("amount must be > 0");
    const from = await User.findOneAndUpdate(
      { guildId, userId: fromUserId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true },
    ).lean();
    if (!from) throw new Error("Sender has insufficient funds");

    const to = await User.findOneAndUpdate(
      { guildId, userId: toUserId },
      { $inc: { balance: amount } },
      { upsert: true, new: true },
    ).lean();

    await Ledger.create([
      {
        guildId,
        userId: fromUserId,
        type: "debit",
        amount,
        reason: "transfer_out",
        meta: { to: toUserId },
        at: new Date(),
      },
      {
        guildId,
        userId: toUserId,
        type: "credit",
        amount,
        reason: "transfer_in",
        meta: { from: fromUserId },
        at: new Date(),
      },
    ]);
    return { fromWallet: from.balance || 0, toWallet: to.balance || 0 };
  }

  // (giữ nguyên nếu m đang dùng)
  static async claimDaily({
    guildId,
    userId,
    amount = 200,
    cooldownMs = 86_400_000,
  }) {
    /* ... */
  }
  static async doWork({ guildId, userId, base = 120, cooldownMs = 300_000 }) {
    /* ... */
  }
}

module.exports = EconomyService;
