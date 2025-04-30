const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Bỏ mute thành viên (text hoặc voice)')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Người cần bỏ mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Kiểu unmute')
        .addChoices(
          { name: 'Text', value: 'text' },
          { name: 'Voice', value: 'voice' }
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do unmute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('target');
    const type = interaction.options.getString('type');
    const reason = interaction.options.getString('reason') || 'Không có lý do.';

    if (!target) {
      return interaction.reply({ content: '❌ Không tìm thấy thành viên.', ephemeral: true });
    }

    if (type === 'text') {
      const mutedRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
      if (!mutedRole) {
        return interaction.reply({ content: '❌ Không tìm thấy role `Muted` trong server.', ephemeral: true });
      }

      await target.roles.remove(mutedRole).catch(() => {});
      return interaction.reply({ content: `🔈 Đã unmute **text** ${target}.\n📌 Lý do: ${reason}` });
    }

    if (type === 'voice') {
      if (!target.voice.channel) {
        return interaction.reply({ content: '❌ Thành viên không ở trong kênh thoại.', ephemeral: true });
      }

      await target.voice.setMute(false, reason).catch(() => {});
      return interaction.reply({ content: `🔈 Đã unmute **voice** ${target}.\n📌 Lý do: ${reason}` });
    }
  }
};
