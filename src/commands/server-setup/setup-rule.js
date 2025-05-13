const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-rule')
    .setDescription('Cài đặt kênh nội quy để hiển thị trong tin nhắn chào mừng.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Chọn kênh nội quy của server.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: interaction.guild.id });
    }

    config.rulesChannelId = channel.id;
    await config.save();

    await interaction.reply({
      content: `✅ Đã đặt kênh nội quy là ${channel}`,
      flags: 64
    });
  }
};
