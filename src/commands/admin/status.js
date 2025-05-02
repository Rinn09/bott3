const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Xem tình trạng cấu hình bot trong server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const config = await GuildConfig.findOne({ guildId: interaction.guild.id });

    if (!config) {
      return interaction.reply({ content: '⚠️ Server này chưa được cấu hình.', ephemeral: true });
    }

    const check = (val) => val ? '✅' : '❌';
    const stats = config.statsChannels || {};
    const roles = config.roleMessageIds || {};

    const embed = new EmbedBuilder()
      .setColor('#00cc99')
      .setTitle('📊 Tình trạng cấu hình Bot')
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: '👋 Welcome Channel', value: check(config.welcomeChannelId), inline: true },
        { name: '👋 Goodbye Channel', value: check(config.goodbyeChannelId), inline: true },
        { name: '📜 Nội Quy (Rule)', value: check(config.rulesChannelId), inline: true },
        { name: '🧑 Pick Role Channel', value: check(config.roleChannelId), inline: true },
        { name: '📝 Log Channel', value: check(config.logChannelId), inline: true },
        { name: '🎯 Auto Role', value: check(config.autoRoleId), inline: true },
        { name: '🎮 Role Msg ID (Game)', value: check(roles.game), inline: true },
        { name: '🧑 Role Msg ID (Gender)', value: check(roles.gender), inline: true },
        { name: '👥 Stats: Tổng thành viên', value: check(stats.total), inline: true },
        { name: '🟢 Stats: Online', value: check(stats.online), inline: true },
        { name: '🤖 Stats: Bot', value: check(stats.bots), inline: true }
      )
      .setFooter({ text: `Server: ${interaction.guild.name}` });

    await interaction.reply({ embeds: [embed] });
  }
};
