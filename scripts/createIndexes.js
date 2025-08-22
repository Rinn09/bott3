require("dotenv").config();
const mongoose = require("mongoose");
const Logger = console;

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    Logger.error("Missing MONGO_URI / MONGODB_URI");
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const User = require("../src/models/User");
  const Ledger = require("../src/models/Ledger");

  await User.collection.createIndex(
    { guildId: 1, userId: 1 },
    { unique: true },
  );
  await User.collection.createIndex({ xp: -1 });
  await User.collection.createIndex({ wallet: -1 });
  await Ledger.collection.createIndex({ userId: 1, at: -1 });

  Logger.log("✅ Indexes ensured.");
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
