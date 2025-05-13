const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Khoá kênh hiện tại cho @everyone')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;
    const everyone = interaction.guild.roles.everyone;

    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: false
    });

    return interaction.reply({ content: `🔒 Đã khoá kênh ${channel.name}.`, ephemeral: false });
  }
};
