require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Logger = require('./utils/logger');
const CommandHandler = require('./handlers/commandHandler');
const { EventHandler } = require('./handlers/eventHandler');
const { LavalinkHandler} = require('./handlers/lavalinkHandler');
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
  }

  async start() {
    try {
      process.on('unhandledRejection', (error) => this.handleError(error));
      process.on('uncaughtException', (error) => this.handleError(error));

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
bot.start();

// Handle unhandled rejections
process.on('unhandledRejection', error => {
  const errorMessage = error?.message || 'Unknown rejection';
  const errorStack = error?.stack || 'No stack trace available';

  Logger.error(`Unhandled promise rejection: ${errorMessage}`, { stack: errorStack });
});