#!/usr/bin/env node
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const ok = (m) => console.log("OK  ", m);
const warn = (m) => console.log("WARN", m);
const bad = (m) => console.log("BAD ", m);

(async () => {
  console.log("\n[doctor:adv] Starting advanced checks...\n");

  // Node version
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major < 18)
    bad(
      `Node ${process.versions.node} < 18 (discord.js v14 khuyến nghị >= 18)`,
    );
  else ok(`Node ${process.versions.node}`);

  // Env
  const BOT_TOKEN = process.env.BOT_TOKEN || process.env.DISCORD_TOKEN;
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!BOT_TOKEN)
    warn(
      "Missing BOT_TOKEN (không cần cho script này, nhưng bot sẽ không login)",
    );
  if (!MONGO_URI)
    return bad("Missing MONGO_URI / MONGODB_URI — dừng kiểm tra DB.");

  // botConfig intents
  try {
    const botConfig = require(
      path.join(process.cwd(), "src", "config", "botConfig.js"),
    );
    const intents = botConfig?.intents || [];
    if (!Array.isArray(intents) || !intents.length)
      warn("botConfig.intents rỗng?");
    else ok(`botConfig.intents = [${intents.join(", ")}]`);
    const needPriv = intents.filter((x) =>
      ["GuildMembers", "MessageContent", "GuildPresences"].includes(x),
    );
    if (needPriv.length)
      ok(`Privileged intents in use: ${needPriv.join(", ")}`);
  } catch (e) {
    warn(`Không đọc được botConfig.js: ${e.message}`);
  }

  // Mongo
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    ok(`Connected MongoDB: ${conn.connection.name}`);

    // collections/indexes
    const User = require("../src/models/User");
    const Ledger = require("../src/models/Ledger");

    // check indexes
    try {
      await User.collection.createIndex(
        { guildId: 1, userId: 1 },
        { unique: true },
      );
      await User.collection.createIndex({ balance: -1 });
      await Ledger.collection.createIndex({ userId: 1, at: -1 });
      ok("Indexes ensured for User & Ledger");
    } catch (e) {
      warn(`Ensure indexes error: ${e.message}`);
    }

    // quick stats
    const lastLedger = await Ledger.findOne().sort({ at: -1 }).lean();
    if (lastLedger)
      ok(
        `Ledger latest: ${lastLedger.type} ${lastLedger.amount} @ ${lastLedger.at.toISOString()}`,
      );
    else warn("Ledger collection empty");

    await mongoose.disconnect();
    ok("Disconnected MongoDB");
  } catch (e) {
    bad(`Mongo connect failed: ${e.message}`);
  }

  console.log("\n[doctor:adv] Done.\n");
  process.exit(0);
})();
