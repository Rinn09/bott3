#!/usr/bin/env node
require("dotenv").config();
const mongoose = require("mongoose");
const Economy = require("../src/services/economy");
const User = require("../src/models/User");
const Ledger = require("../src/models/Ledger");

const G = process.env.TEST_GUILD_ID || "smoke-guild";
const A = process.env.TEST_USER_A || "smoke-user-A";
const B = process.env.TEST_USER_B || "smoke-user-B";

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGO_URI / MONGODB_URI");
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  // ensure docs
  await User.updateOne(
    { guildId: G, userId: A },
    { $setOnInsert: { balance: 0, bank: 0 } },
    { upsert: true },
  );
  await User.updateOne(
    { guildId: G, userId: B },
    { $setOnInsert: { balance: 0, bank: 0 } },
    { upsert: true },
  );

  // clean previous smoke ledgers
  await Ledger.deleteMany({
    "meta.smoke": true,
    guildId: G,
    userId: { $in: [A, B] },
  });

  // run
  console.log("[smoke] credit A +1000");
  await Economy.credit({
    guildId: G,
    userId: A,
    amount: 1000,
    reason: "smoke_credit",
    meta: { smoke: true },
  });

  console.log("[smoke] deposit A 600");
  await Economy.moveToBank({ guildId: G, userId: A, amount: 600 });

  console.log("[smoke] withdraw A 200");
  await Economy.moveToWallet({ guildId: G, userId: A, amount: 200 });

  console.log("[smoke] transfer A->B 300");
  await Economy.transfer({
    guildId: G,
    fromUserId: A,
    toUserId: B,
    amount: 300,
  });

  const a = await User.findOne({ guildId: G, userId: A }).lean();
  const b = await User.findOne({ guildId: G, userId: B }).lean();
  const cnt = await Ledger.countDocuments({ guildId: G, "meta.smoke": true });

  console.log("[smoke] balances:", {
    A: { balance: a.balance, bank: a.bank },
    B: { balance: b.balance, bank: b.bank },
  });
  console.log("[smoke] smoke ledgers:", cnt);

  // PASS conditions
  if (cnt >= 2 && a.balance >= 0 && b.balance >= 0) {
    console.log("PASS ✅");
  } else {
    console.log("FAIL ❌");
  }

  // cleanup (optional): comment out if you want to keep data
  // await Ledger.deleteMany({ 'meta.smoke': true, guildId: G });
  // await User.deleteMany({ guildId: G, userId: { $in: [A, B] } });

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
