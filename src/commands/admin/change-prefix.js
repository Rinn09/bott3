const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('change-prefix')
    .setDescription('Thay đổi prefix của bot trong server này')
    .addStringOption(option =>
      option.setName('prefix')
        .setDescription('Prefix mới (1 ký tự trở lên)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const newPrefix = interaction.options.getString('prefix');

    if (!newPrefix || newPrefix.length > 5) {
      return interaction.reply({ content: '❌ Prefix phải từ 1 đến 5 ký tự.', ephemeral: true });
    }

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: interaction.guild.id });
    }

    config.prefix = newPrefix;
    await config.save();

    // Xóa cache prefix nếu có
    if (interaction.client.prefixCache) {
      interaction.client.prefixCache.delete(interaction.guild.id);
    }

    return interaction.reply({ content: `✅ Prefix mới của server là \`${newPrefix}\`` });
  }
};
