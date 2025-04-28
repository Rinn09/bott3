const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-log')
    .setDescription('Cài đặt kênh ghi log hoạt động server')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Chọn kênh để gửi log')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: interaction.guild.id });
    }

    config.logChannelId = channel.id;
    await config.save();

    await interaction.reply({
      content: `✅ Đã cài đặt kênh log: ${channel}`,
      ephemeral: true
    });
  }
};
