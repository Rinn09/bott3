// const { Kazagumo, Plugins } = require('kazagumo');
// const { Connectors } = require('shoukaku');
// const lavalinkConfig = require('./config/lavalinkConfig');
const LavalinkHandler = require("./handlers/lavalinkHandler");
require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const Logger = require("./utils/logger");
const CommandHandler = require("./handlers/commandHandler");
const EventHandler = require("./handlers/eventHandler");
const botConfig = require("./config/botConfig");
const errorHandler = require("./utils/errorHandler");
const mongoose = require("mongoose");
const prefixHandler = require("./handlers/prefixHandler");
const salaryNotificationHandler = require("./handlers/salaryReminder");
const anticapsCache = require("./utils/anticapsCache");
const goldenHourManager = require("./utils/goldenHourManager");
const taskHandler = require("./handlers/taskHandler");

console.log("Logger instance:", Logger);

async function connectMongoWithRetry(uri) {
  if (!uri) {
    Logger.warn("MONGO_URI is empty — skip DB connect");
    return;
  }
  let attempt = 0;
  const tryOnce = async () => {
    attempt++;
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
      });
      Logger.info("✅ Kết nối MongoDB thành công!");
    } catch (err) {
      const backoff = Math.min(30, 2 ** attempt) * 1000; // 2s→4s→...max 30s
      Logger.error(`❌ MongoDB lỗi: ${err.code || err.name}: ${err.message}`);
      Logger.warn(`↻ Thử lại sau ${backoff / 1000}s (lần ${attempt})...`);
      setTimeout(tryOnce, backoff);
    }
  };
  tryOnce();
}

// gọi sớm ở đầu file (trước bot.start())
connectMongoWithRetry(process.env.MONGO_URI);

class Bot {
  constructor() {
    const names = botConfig?.intents || [];
    const bits = names.map((n) => GatewayIntentBits[n]).filter(Boolean);
    const unknown = names.filter((n) => !GatewayIntentBits[n]);
    if (unknown.length)
      Logger.warn(`[Boot] Unknown intents in botConfig: ${unknown.join(", ")}`);

    this.client = new Client({
      intents: bits.length ? bits : [GatewayIntentBits.Guilds], // fallback nhẹ
      partials: botConfig?.partials || [], // nếu m có cấu hình
      ...(botConfig?.presence ? { presence: botConfig.presence } : {}),
      ...(botConfig?.allowedMentions
        ? { allowedMentions: botConfig.allowedMentions }
        : {}),
    });

    this.commandHandler = new CommandHandler(this.client);
    this.eventHandler = new EventHandler(this.client);
    this.lavalinkHandler = new LavalinkHandler(this.client);
    this.client.lavalinkHandler = this.lavalinkHandler;
  }

  async start() {
    try {
      await this.commandHandler.loadCommands();
      this.client.commands = this.commandHandler.commands;
      await this.commandHandler.registerCommands();
      //await this.commandHandler.refreshCommands(); // Không khuyến khích
      await this.eventHandler.loadEvents();
      // await this.lavalinkHandler.initialize(lavalinkConfig);

      Logger.info("Lavalink handler initialized");
      Logger.info("Command handler initialized");
      Logger.info("Event handler initialized");
      Logger.info("Bot is starting...");

      await this.client.login(process.env.TOKEN);
      await this.client.user.setPresence({
        activities: [{ name: "Your mom", type: ActivityType.Playing }],
        status: "online",
      });
      Logger.info(`Bot logged in as ${this.client.user.tag}`);
      /*
      this.client.on("interactionCreate", async (interaction) => {
        await this.commandHandler.handleInteraction(interaction);
      });
      */
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.log("Error object:", error);

    const errorMessage = error?.message || "Unknown error";
    const errorStack = error?.stack || "No stack trace available";

    Logger.error(`Critical error: ${errorMessage}`, { stack: errorStack });

    if (this.client) {
      this.client.destroy();
    }
    process.exit(1);
  }
}

const bot = new Bot();

const waitDbAndRun = () => {
  if (mongoose.connection.readyState === 1) {
    prefixHandler(bot.client);
    salaryNotificationHandler(bot.client);
    anticapsCache.loadAllConfigs(bot.client);
    goldenHourManager.initializeGoldenHour(bot.client);
    taskHandler.loadTasks(bot.client);
    Logger.info("Post-ready jobs started (DB connected).");
  } else {
    mongoose.connection.once("connected", () => {
      waitDbAndRun();
    });
  }
};

errorHandler(bot.client);
bot.client.on("error", (error) => {
  Logger.error("WebSocket error:", error);
});
bot.client.on("ready", () => {
  prefixHandler(bot.client);
  salaryNotificationHandler(bot.client);
  anticapsCache.loadAllConfigs(bot.client);
  goldenHourManager.initializeGoldenHour(bot.client);
  taskHandler.loadTasks(bot.client);
  Logger.info(`Bot is ready as ${bot.client.user.tag}`);
});
bot.client.on("disconnect", (event) => {
  Logger.warn("Bot disconnected:", event);
});
bot.client.on("reconnect", () => {
  Logger.info("Bot is reconnecting...");
});
bot.start();
process.on("unhandledRejection", (r) =>
  Logger.error("Unhandled promise rejection:", r),
);
process.on("uncaughtException", (e) => Logger.error("Uncaught exception:", e));
process.on("SIGINT", () => {
  Logger.warn("SIGINT");
  bot.client?.destroy();
  process.exit(0);
});
process.on("SIGTERM", () => {
  Logger.warn("SIGTERM");
  bot.client?.destroy();
  process.exit(0);
});

/*bot.client.manager = new Kazagumo({
  defaultSearchEngine: 'youtube',
  plugins: [new Plugins.PlayerMoved(bot.client)],
  send: (id, payload) => {
    const guild = bot.client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
}, new Connectors.DiscordJS(bot.client), lavalinkConfig.nodes);*/

// cd c:/bott3/Lavalink
// java -jar Lavalink.jar
// node src/index.js
