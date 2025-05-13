const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Mở khoá kênh hiện tại cho @everyone')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;
    const everyone = interaction.guild.roles.everyone;

    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: true
    });

    return interaction.reply({ content: `🔓 Đã mở khoá kênh ${channel.name}.`, ephemeral: false });
  }
};
