require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const Logger = require('./utils/logger');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const LavalinkHandler = require('./handlers/lavalinkHandler');
const botConfig = require('./config/botConfig');
const lavalinkConfig = require('./config/lavalinkConfig');
const errorHandler = require('./utils/errorHandler');

console.log('Logger instance:', Logger);

class Bot {
  constructor() {
    this.client = new Client({
      intents: botConfig.intents.map(intent => GatewayIntentBits[intent])
    });

    this.commandHandler = new CommandHandler(this.client);
    this.eventHandler = new EventHandler(this.client);
    this.lavalinkHandler = new LavalinkHandler(this.client);
    this.client.lavalinkHandler = this.lavalinkHandler;
  }

  async start() {
    try {
      await this.commandHandler.loadCommands();
      await this.commandHandler.refreshCommands();
      await this.eventHandler.loadEvents();
      await this.lavalinkHandler.initialize(lavalinkConfig);
      
      await this.client.login(process.env.TOKEN);
      await this.client.user.setPresence({
        activities: [{ name: 'Your mom', type: ActivityType.Playing }],
        status: 'online'
      });
      Logger.info(`Bot logged in as ${this.client.user.tag}`);
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
errorHandler(bot.client); // Initialize error handler with the client instance
bot.client.on('error', (error) => {
  Logger.error('WebSocket error:', error);
});
bot.client.on('ready', () => {
  Logger.info(`Bot is ready as ${bot.client.user.tag}`);
});
bot.client.on('disconnect', (event) => {
  Logger.warn('Bot disconnected:', event);
});
bot.start();