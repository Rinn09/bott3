const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-noti')
    .setDescription('Cài đặt kênh thông báo nhận lương.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Chọn kênh dùng để thông báo nhận lương.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;
    
    // Tìm hoặc tạo cấu hình cho server
    let config = await GuildConfig.findOne({ guildId });
    if (!config) {
      config = new GuildConfig({ guildId });
    }
    
    // Lưu channel thông báo dưới trường mới (ví dụ: salaryNotificationChannelId)
    config.salaryNotificationChannelId = channel.id;
    await config.save();
    
    return interaction.reply({ content: `✅ Kênh thông báo nhận lương đã được đặt là ${channel}.`, ephemeral: true });
  }
};