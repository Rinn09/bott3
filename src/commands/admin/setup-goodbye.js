const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-goodbye')
    .setDescription('Cài đặt kênh gửi tin nhắn tạm biệt.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Chọn kênh để gửi tạm biệt.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: interaction.guild.id });
    }

    config.goodbyeChannelId = channel.id;
    await config.save();

    await interaction.reply({
      content: `✅ Đã đặt kênh tạm biệt là ${channel}`,
      ephemeral: true
    });
  }
};
