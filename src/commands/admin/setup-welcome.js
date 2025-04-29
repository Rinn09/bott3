const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('Cài đặt kênh gửi tin nhắn chào mừng.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Chọn kênh để gửi chào mừng.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: interaction.guild.id });
    }

    config.welcomeChannelId = channel.id;
    await config.save();

    await interaction.reply({
      content: `✅ Đã đặt kênh chào mừng là ${channel}`,
      flags: 64
    });
  }
};
