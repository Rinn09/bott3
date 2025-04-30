const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('Cài kênh gửi tin nhắn chào mừng')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Kênh để gửi embed chào mừng')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });

    if (!config) config = new GuildConfig({ guildId: interaction.guild.id });

    // 🔒 Kiểm tra thiếu cấu hình
    const missingConfigs = [];
    if (!config.rulesChannelId) {
      missingConfigs.push('❌ Bạn chưa dùng /setup-rule. Nút nội quy sẽ không hoạt động!');
    }
    if (!config.roleChannelId) {
      missingConfigs.push('❌ Bạn chưa dùng /setup-role-channel. Nút pick role sẽ không hoạt động!');
    }

    if (missingConfigs.length > 0) {
      return interaction.reply({
        content: missingConfigs.join('\n'),
      });
    }

    config.welcomeChannelId = channel.id;
    await config.save();

    await interaction.reply({
      content: `✅ Đã cài kênh chào mừng: ${channel}`,
    });
  }
};
