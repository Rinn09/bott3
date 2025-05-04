// const { Kazagumo, Plugins } = require('kazagumo');
// const { Connectors } = require('shoukaku');
// const lavalinkConfig = require('./config/lavalinkConfig');
// const LavalinkHandler = require('./handlers/lavalinkHandler');
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const Logger = require('./utils/logger');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const botConfig = require('./config/botConfig');
const errorHandler = require('./utils/errorHandler');
const mongoose = require('mongoose');
const prefixHandler = require('./handlers/prefixHandler');
const salaryNotificationHandler = require('./handlers/salaryReminder');


console.log('Logger instance:', Logger);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ Kết nối MongoDB thành công!"))
.catch((err) => console.error("❌ MongoDB lỗi:", err));

class Bot {
  constructor() {
    this.client = new Client({
      intents: botConfig.intents.map(intent => GatewayIntentBits[intent])
    });

    this.commandHandler = new CommandHandler(this.client);
    this.eventHandler = new EventHandler(this.client);
    // this.lavalinkHandler = new LavalinkHandler(this.client);
    // this.client.lavalinkHandler = this.lavalinkHandler;
  }

  async start() {
    try {
      await this.commandHandler.loadCommands(); // Load commands first
      this.client.commands = this.commandHandler.commands;
      await this.commandHandler.registerCommands(); // Register commands with Discord API
      // await this.commandHandler.refreshCommands(); // Uncomment if you want to refresh commands every time
      await this.eventHandler.loadEvents();
      // await this.lavalinkHandler.initialize(lavalinkConfig);
      
      // Logger.info('Lavalink handler initialized');
      Logger.info('Command handler initialized');
      Logger.info('Event handler initialized');
      Logger.info('Bot is starting...');

      await this.client.login(process.env.TOKEN);
      await this.client.user.setPresence({
        activities: [{ name: 'Your mom', type: ActivityType.Playing }],
        status: 'online'
      });
      Logger.info(`Bot logged in as ${this.client.user.tag}`);
      this.client.on('interactionCreate', async interaction => {
        await this.commandHandler.handleInteraction(interaction);
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.log('Error object:', error);
  
    const errorMessage = error?.message || 'Unknown error';
    const errorStack = error?.stack || 'No stack trace available';
  
    Logger.error(`Critical error: ${errorMessage}`, { stack: errorStack });
  
    if (this.client) {
      this.client.destroy();
    }
    process.exit(1);
  }
}

const bot = new Bot();

errorHandler(bot.client);
bot.client.on('error', (error) => {
  Logger.error('WebSocket error:', error);
});
bot.client.on('ready', () => {
  prefixHandler(bot.client);
  salaryNotificationHandler(bot.client);
  Logger.info(`Bot is ready as ${bot.client.user.tag}`);
});
bot.client.on('disconnect', (event) => {
  Logger.warn('Bot disconnected:', event);
});
bot.client.on('reconnect', () => {
  Logger.info('Bot is reconnecting...');
});
bot.start();

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