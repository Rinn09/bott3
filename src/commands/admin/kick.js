const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Đuổi một thành viên khỏi server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Người cần kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do kick')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'Không có lý do.';

    if (!target) {
      return interaction.reply({ content: '❌ Không tìm thấy thành viên.', ephemeral: true });
    }

    if (!target.kickable) {
      return interaction.reply({ content: '❌ Không thể kick người này. Có thể do role cao hơn bot.', ephemeral: true });
    }

    await target.kick(reason).catch(() => {});
    return interaction.reply({ content: `👢 Đã kick ${target.user.tag}.\n📌 Lý do: ${reason}` });
  }
};
