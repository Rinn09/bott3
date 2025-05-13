const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban một thành viên khỏi server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Người cần ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do ban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'Không có lý do.';

    if (!target) {
      return interaction.reply({ content: '❌ Không tìm thấy thành viên.', ephemeral: true });
    }

    if (!target.bannable) {
      return interaction.reply({ content: '❌ Không thể ban người này. Có thể do role của họ cao hơn bot.', ephemeral: true });
    }

    await target.ban({ reason }).catch(() => {});
    return interaction.reply({ content: `🔨 Đã ban ${target.user.tag}.\n📌 Lý do: ${reason}` });
  }
};
