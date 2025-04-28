const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  customId: 'select-game',
  async execute(interaction) {
    const gameMenu = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('game-select')
          .setPlaceholder('🎮 Chọn tựa game bạn yêu thích...')
          .addOptions([
            {
              label: 'Minecraft',
              description: 'Xây dựng thế giới của riêng bạn',
              value: '1209129047729377331'
            },
            {
              label: 'PUBG',
              description: 'Chiến đấu sinh tồn cực căng thẳng',
              value: '1118388130542796891'
            },
            {
              label: 'CS2',
              description: 'Chiến thuật FPS đỉnh cao',
              value: '1118387847137857616'
            },
            {
              label: 'Don\'t Starve Together',
              description: 'Sinh tồn cùng bạn bè',
              value: '1034514711410118726'
            },
            {
              label: 'Valorant',
              description: 'FPS chiến thuật đỉnh cao',
              value: '1029342568581972018'
            },
            {
              label: 'Genshin Impact',
              description: 'Thế giới mở đầy kỳ diệu',
              value: '1029342342685130785'
            }
          ])
      );

    await interaction.reply({
      content: '🎮 Hãy chọn tựa game bạn chơi:',
      components: [gameMenu],
      ephemeral: true
    });
  }
};
