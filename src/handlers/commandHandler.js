const { Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');
const Logger = require('../utils/logger');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  async loadCommands() {
    console.log('Loading commands...');
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
            if (typeof command.data === 'object' && typeof command.execute === 'function' && command.data.name) {
              this.commands.set(command.data.name, command);
              Logger.info(`Loaded command: ${command.data.name}`);
            } else {
              Logger.warn(`Command at ${filePath} has invalid data or execute properties`);
            }
          } else {
            Logger.warn(`Command at ${filePath} missing required properties`);
          }
        } catch (error) {
          console.log('Error loading command:', error);
          Logger.error(`Error loading command ${file}: ${error?.message || 'Unknown error'}`, { stack: error?.stack || 'No stack trace available' });
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

  async registerCommands() {
    const { REST, Routes } = require('discord.js');
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    try {
      const commandsData = Array.from(this.commands.values()).map(command => command.data.toJSON());
      Logger.info(`Đang đăng ký ${commandsData.length} lệnh với Discord API...`);
      
      // Đăng ký lệnh global (có thể mất đến 1 giờ để hiển thị trên tất cả server)
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commandsData },
      );
      
      Logger.info(`Đã đăng ký thành công ${data.length} lệnh với Discord API`);
      return data;
    } catch (error) {
      Logger.error(`Lỗi khi đăng ký lệnh: ${error.message}`);
      throw error;
    }
  }

  async refreshCommands() {
    const { REST, Routes } = require('discord.js');
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    try {
      Logger.info(`Đang xóa tất cả lệnh...`);
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: [] },
      );
      Logger.info(`Đã xóa tất cả lệnh thành công!`);
      
      // Đăng ký lại tất cả lệnh
      await this.registerCommands();
    } catch (error) {
      Logger.error(`Lỗi khi làm mới lệnh: ${error.message}`);
      throw error;
    }
  }
}


module.exports = CommandHandler;