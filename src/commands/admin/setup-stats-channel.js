
const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-stats-channel')
    .setDescription('Cài đặt các kênh thống kê: tổng thành viên, online, bot')
    .addChannelOption(option =>
      option.setName('total')
        .setDescription('Kênh voice để hiển thị tổng số thành viên')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('online')
        .setDescription('Kênh voice để hiển thị số online')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('bots')
        .setDescription('Kênh voice để hiển thị số lượng bot')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const total = interaction.options.getChannel('total');
    const online = interaction.options.getChannel('online');
    const bots = interaction.options.getChannel('bots');

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) config = new GuildConfig({ guildId: interaction.guild.id });

    config.statsChannels = {
      total: total.id,
      online: online.id,
      bots: bots.id
    };

    await config.save();

    await interaction.reply({
      content: `✅ Đã lưu các kênh thống kê thành viên!`,
    });
  }
};
