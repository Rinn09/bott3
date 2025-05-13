const { Collection } = require("discord.js");
const path = require("path");
const fs = require("fs");
const Logger = require("../utils/logger");
const GuildConfig = require("../models/GuildConfig");

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  async loadCommands() {
    console.log("Loading commands...");
    const foldersPath = path.join(__dirname, "..", "commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        try {
          const filePath = path.join(commandsPath, file);
          const command = require(filePath);

          if ("data" in command && "execute" in command) {
            if (
              typeof command.data === "object" &&
              typeof command.execute === "function" &&
              command.data.name
            ) {
              this.commands.set(command.data.name, command);
              Logger.info(`Loaded command: ${command.data.name}`);
            } else {
              Logger.warn(
                `Command at ${filePath} has invalid data or execute properties`,
              );
            }
          } else {
            Logger.warn(`Command at ${filePath} missing required properties`);
          }
        } catch (error) {
          console.log("Error loading command:", error);
          Logger.error(
            `Error loading command ${file}: ${error?.message || "Unknown error"}`,
            { stack: error?.stack || "No stack trace available" },
          );
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
      const guildConfig = await GuildConfig.findOne({
        guildId: interaction.guildId,
      });
      if (guildConfig && guildConfig.disabledCommands) {
        const disabledInChannels = guildConfig.disabledCommands.get(
          command.data.name,
        );
        if (disabledInChannels) {
          if (
            disabledInChannels.includes("all") ||
            disabledInChannels.includes(interaction.channelId)
          ) {
            Logger.warn(
              `Command /${command.data.name} is disabled in this context for guild ${interaction.guildId}.`,
            );
            return interaction.reply({
              content: `❌ Lệnh \`/${command.data.name}\` đã bị vô hiệu hóa ${disabledInChannels.includes("all") ? "trên toàn server" : `trong kênh này`}.`,
              ephemeral: true,
            });
          }
        }
      }
      if (
        guildConfig &&
        guildConfig.disabledChannels &&
        guildConfig.disabledChannels.get("all") &&
        command.data.name !== "bot-admin"
      ) {
        // Cho phép bot-admin chạy để enable lại
        Logger.warn(
          `All commands are disabled in guild ${interaction.guildId}.`,
        );
        return interaction.reply({
          content: `❌ Tất cả các lệnh (ngoại trừ /bot-admin) đã bị vô hiệu hóa trên server này.`,
          ephemeral: true,
        });
      }
      if (
        guildConfig &&
        guildConfig.disabledChannels &&
        guildConfig.disabledChannels.get(interaction.channelId) &&
        command.data.name !== "bot-admin"
      ) {
        Logger.warn(
          `All commands are disabled in channel ${interaction.channel.name} in guild ${interaction.guildId}.`,
        );
        return interaction.reply({
          content: `❌ Tất cả các lệnh (ngoại trừ /bot-admin) đã bị vô hiệu hóa trong kênh này.`,
          ephemeral: true,
        });
      }
      await command.execute(interaction, this.client);
    } catch (error) {
      Logger.error(`Error executing ${interaction.commandName}:`, error);
      const errorMessage = {
        content: "Có lỗi xảy ra khi thực hiện lệnh này!",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  async registerCommands() {
    const { REST, Routes } = require("discord.js");
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
      const commandsData = Array.from(this.commands.values()).map((command) =>
        command.data.toJSON(),
      );
      Logger.info(
        `Đang đăng ký ${commandsData.length} lệnh với Discord API...`,
      );

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
    const { REST, Routes } = require("discord.js");
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
      Logger.info(`Đang xóa tất cả lệnh...`);
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: [],
      });
      Logger.info(`Đã xóa tất cả lệnh thành công!`);

      await this.registerCommands();
    } catch (error) {
      Logger.error(`Lỗi khi làm mới lệnh: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CommandHandler;
