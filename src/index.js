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
      process.on('unhandledRejection', this.handleError.bind(this));
      process.on('uncaughtException', this.handleError.bind(this));

      await this.commandHandler.loadCommands();
      await this.eventHandler.loadEvents();
      await this.lavalinkHandler.initialize(lavalinkConfig);

      await this.client.login(process.env.TOKEN);
      Logger.info(`Bot logged in as ${this.client.user.tag}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    Logger.error('Critical error:', error);
    if (this.client) {
      this.client.destroy();
    }
    process.exit(1);
  }
}

const bot = new Bot();
bot.start();

// Handle unhandled rejections
process.on('unhandledRejection', error => {
  Logger.error('Unhandled promise rejection:', error);
});