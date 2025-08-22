const User = require("../models/User");
const Ledger = require("../models/Ledger");

class EconomyService {
  static async credit({ guildId, userId, amount, reason, meta }) {
    const doc = await User.findOneAndUpdate(
      { guildId, userId },
      { $inc: { wallet: amount } },
      { upsert: true, new: true },
    ).lean();
    await Ledger.create({
      guildId,
      userId,
      type: "credit",
      amount,
      reason,
      meta,
    });
    return doc.wallet;
  }

  static async debit({ guildId, userId, amount, reason, meta }) {
    const doc = await User.findOneAndUpdate(
      { guildId, userId, wallet: { $gte: amount } },
      { $inc: { wallet: -amount } },
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
    });
    return doc.wallet;
  }

  static async claimDaily({
    guildId,
    userId,
    amount = 200,
    cooldownMs = 86_400_000,
  }) {
    const now = Date.now();
    const u = await User.findOneAndUpdate(
      { guildId, userId, nextDailyAt: { $lte: now } },
      { $set: { nextDailyAt: now + cooldownMs } },
      { upsert: true, new: true },
    );
    if (!u || u.nextDailyAt > now + cooldownMs - 1000)
      return { ok: false, msg: "Chưa hết cooldown /daily" };
    const wallet = await this.credit({
      guildId,
      userId,
      amount,
      reason: "daily",
    });
    return { ok: true, amount, wallet };
  }

  static async doWork({ guildId, userId, base = 120, cooldownMs = 300_000 }) {
    const now = Date.now();
    const u = await User.findOneAndUpdate(
      { guildId, userId, nextWorkAt: { $lte: now } },
      { $set: { nextWorkAt: now + cooldownMs } },
      { new: true },
    );
    if (!u) return { ok: false, msg: "Chưa hết cooldown /work" };
    const reward = base + Math.floor(Math.random() * 40);
    const wallet = await this.credit({
      guildId,
      userId,
      amount: reward,
      reason: "work",
    });
    return { ok: true, reward, wallet };
  }
}
module.exports = EconomyService;
