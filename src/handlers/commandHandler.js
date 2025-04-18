const { Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { Logger } = require('../utils/logger');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  async loadCommands() {
    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        try {
          const filePath = path.join(commandsPath, file);
          const command = require(filePath);

          if ('data' in command && 'execute' in command) {
            this.commands.set(command.data.name, command);
            Logger.info(`Loaded command: ${command.data.name}`);
          } else {
            Logger.warn(`Command at ${filePath} missing required properties`);
          }
        } catch (error) {
          Logger.error(`Error loading command ${file}:`, error);
        }
      }
    }
  }

  async handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);
    if (!command) {
      Logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction, this.client);
    } catch (error) {
      Logger.error(`Error executing ${interaction.commandName}:`, error);
      const errorMessage = { 
        content: 'Có lỗi xảy ra khi thực hiện lệnh này!', 
        ephemeral: true 
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
}

module.exports = CommandHandler;