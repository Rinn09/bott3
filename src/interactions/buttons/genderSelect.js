const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  customId: 'select-gender',
  async execute(interaction) {
    const genderMenu = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('gender-select')
          .setPlaceholder('🧑 Chọn giới tính của bạn...')
          .addOptions([
            {
              label: 'Nam',
              description: 'Tôi là Nam',
              value: '1366311768934187068' // Role Nam
            },
            {
              label: 'Nữ',
              description: 'Tôi là Nữ',
              value: '1154763283534983219' // Role Nữ
            }
          ])
      );

    await interaction.reply({
      content: '🧑 Hãy chọn giới tính của bạn:',
      components: [genderMenu],
      flags: 64,
      ephemeral: true
    });
  }
};
