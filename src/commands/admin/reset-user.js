const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-user')
    .setDescription('Admin reset toàn bộ dữ liệu người dùng (tiền, level, XP)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Người cần reset')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    const userData = await User.findOne({ userId: target.id, guildId });
    if (!userData) {
      return interaction.reply({ content: '❌ Người dùng này chưa có dữ liệu để reset.', ephemeral: true });
    }

    // Reset dữ liệu cơ bản
    userData.balance = 0;
    userData.bank = 0;
    userData.level = 0;
    userData.xp = 0;
    userData.totalEarned = 0;
    userData.totalSpent = 0;
    userData.cooldowns = {};
    userData.lastDaily = null;
    userData.job = undefined;

    await userData.save();

    return interaction.reply({
      content: `✅ Đã reset toàn bộ dữ liệu của **${target.tag}**.`,
      ephemeral: false
    });
  }
};
