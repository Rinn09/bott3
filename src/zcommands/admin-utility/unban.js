const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Gỡ ban một người khỏi server')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('ID người dùng cần unban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do unban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'Không có lý do.';

    try {
      await interaction.guild.members.unban(userId, reason);
      return interaction.reply({ content: `✅ Đã gỡ ban người dùng có ID: ${userId}` });
    } catch (err) {
      return interaction.reply({ content: '❌ Không thể gỡ ban. Có thể ID không tồn tại hoặc người dùng không bị ban.', ephemeral: true });
    }
  }
};
