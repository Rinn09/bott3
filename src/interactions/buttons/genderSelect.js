const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  customId: 'select-gender',
  async execute(interaction) {
    const genderMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('gender-select')
        .setPlaceholder('🧑 Chọn giới tính của bạn...')
        .addOptions([
          { label: 'Nam', value: '1366311768934187068' },
          { label: 'Nữ', value: '1154763283534983219' }
        ])
    );

    console.log('genderSelect handler triggered');

    return interaction.reply({
      content: '🧑 Hãy chọn giới tính của bạn:',
      components: [genderMenu],
      ephemeral: true
    });
  }
};
