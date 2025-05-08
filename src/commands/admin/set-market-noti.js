const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-market-noti')
    .setDescription('Cài đặt kênh nhận thông báo các giao dịch trên chợ.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Chọn kênh để gửi thông báo chợ.')
        .addChannelTypes(ChannelType.GuildText) // Chỉ cho phép chọn kênh text
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Yêu cầu quyền Admin

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    try {
      let config = await GuildConfig.findOne({ guildId: guildId });
      if (!config) {
        config = new GuildConfig({ guildId: guildId });
      }

      config.marketNotificationChannelId = channel.id;
      await config.save();

      const successEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('✅ Cài đặt thành công!')
        .setDescription(`Kênh thông báo giao dịch chợ đã được đặt thành ${channel}.`)
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      Logger.info(`Market notification channel set to ${channel.name} (${channel.id}) in guild ${interaction.guild.name} (${guildId}) by ${interaction.user.tag}`);

    } catch (error) {
      Logger.error(`Error setting market notification channel for guild ${guildId}: ${error.message}`, { stack: error.stack });
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Lỗi!')
        .setDescription('Đã xảy ra lỗi khi cố gắng cài đặt kênh thông báo chợ.')
        .setTimestamp();
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};