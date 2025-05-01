const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');

const disabledCommandsPath = path.join(__dirname, 'disabledCommands.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disablecommand')
    .setDescription('Vô hiệu hóa lệnh')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('The command to disable')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to disable the command in')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('allchannels')
        .setDescription('Disable the command in all channels')
        .setRequired(false)),
  
  async execute(interaction) {
    const commandName = interaction.options.getString('command');
    const channel = interaction.options.getChannel('channel');
    const allChannels = interaction.options.getBoolean('allchannels');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Bạn cần quyền Quản trị viên để sử dụng lệnh này.', ephemeral: true });
    }

    let disabledCommands;
    try {
      disabledCommands = JSON.parse(fs.readFileSync(disabledCommandsPath, 'utf8') || '{}');
    } catch (error) {
      if (error.code === 'ENOENT') {
        disabledCommands = {};
      } else {
        console.error('Có lỗi xảy ra khi đọc file disabledCommands.json', error);
        return interaction.reply({ content: 'Có lỗi xảy ra khi vô hiệu hóa lệnh.', ephemeral: true });
      }
    }

    if (!disabledCommands[interaction.guild.id]) {
      disabledCommands[interaction.guild.id] = {};
    }

    if (allChannels) {
      disabledCommands[interaction.guild.id][commandName] = 'all';
    } else if (channel) {
      if (!disabledCommands[interaction.guild.id][commandName] || !Array.isArray(disabledCommands[interaction.guild.id][commandName])) {
        disabledCommands[interaction.guild.id][commandName] = [];
      }
      if (!disabledCommands[interaction.guild.id][commandName].includes(channel.id)) {
        disabledCommands[interaction.guild.id][commandName].push(channel.id);
      }
    } else {
      return interaction.reply({ content: 'Bạn cần chọn kênh hoặc chọn tất cả kênh.', ephemeral: true });
    }

    fs.writeFileSync(disabledCommandsPath, JSON.stringify(disabledCommands, null, 2));
    return interaction.reply({ content: `Lệnh ${commandName} đã bị vô hiệu hóa.`, ephemeral: true });
  },
};
