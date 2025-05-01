const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-bans')
    .setDescription('Hiển thị danh sách user đã bị ban khỏi server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const bans = await interaction.guild.bans.fetch();

    if (!bans.size) {
      return interaction.reply({ content: '✅ Server không có ai đang bị ban.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff4444')
      .setTitle(`🚫 Danh sách ${bans.size} người bị ban`)
      .setDescription(
        bans.map(b => `- **${b.user.tag}** \`(${b.user.id})\`${b.reason ? ` • Lý do: ${b.reason}` : ''}`).join('\n').slice(0, 4000)
      )
      .setFooter({ text: `Server: ${interaction.guild.name}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
