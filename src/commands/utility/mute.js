const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Tắt tiếng thành viên (text hoặc voice)')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Người cần mute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Kiểu mute')
        .addChoices(
          { name: 'Text', value: 'text' },
          { name: 'Voice', value: 'voice' }
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Lý do mute')
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
        return interaction.reply({ content: '❌ Không tìm thấy role `Muted`. Vui lòng tạo role này trước.', ephemeral: true });
      }

      await target.roles.add(mutedRole).catch(() => {});
      return interaction.reply({ content: `🔇 Đã mute **text** ${target}.\n📌 Lý do: ${reason}` });
    }

    if (type === 'voice') {
      if (!target.voice.channel) {
        return interaction.reply({ content: '❌ Thành viên không ở trong kênh thoại.', ephemeral: true });
      }

      await target.voice.setMute(true, reason).catch(() => {});
      return interaction.reply({ content: `🔇 Đã mute **voice** ${target}.\n📌 Lý do: ${reason}` });
    }
  }
};
