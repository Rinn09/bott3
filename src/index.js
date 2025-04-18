require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Logger } = require('./utils/logger');
const { CommandHandler } = require('./handlers/commandHandler');
const { EventHandler } = require('./handlers/eventHandler');
const { LavalinkHandler } = require('./handlers/lavalinkHandler');
const botConfig = require('./config/botConfig');
const lavalinkConfig = require('./config/lavalinkConfig');

class Bot {
  constructor() {
    this.client = new Client({
      intents: botConfig.intents.map(intent => GatewayIntentBits[intent])
    });

    this.commandHandler = new CommandHandler(this.client);
    this.eventHandler = new EventHandler(this.client);
    this.lavalinkHandler = new LavalinkHandler(this.client);
  }

  async start() {
    try {
      // Initialize handlers
      await this.commandHandler.loadCommands();
      await this.eventHandler.loadEvents();
      await this.lavalinkHandler.initialize(lavalinkConfig);

      // Login
      await this.client.login(process.env.TOKEN);
      Logger.info(`Bot logged in as ${this.client.user.tag}`);
    } catch (error) {
      Logger.error('Error starting bot:', error);
      process.exit(1);
    }
  }
}

const bot = new Bot();
bot.start();

// Handle unhandled rejections
process.on('unhandledRejection', error => {
  Logger.error('Unhandled promise rejection:', error);
});