const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Xoá số lượng tin nhắn trong kênh')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Số lượng tin nhắn cần xoá (1 - 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    const messages = await interaction.channel.bulkDelete(amount, true).catch(err => {
      console.error('[CLEAR ERROR]', err);
    });

    return interaction.reply({ content: `✅ Đã xoá ${messages.size} tin nhắn.`, ephemeral: true });
  }
};
