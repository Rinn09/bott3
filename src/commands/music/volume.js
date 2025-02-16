const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Điều chỉnh âm lượng')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Mức âm lượng (1-100)')
        .setRequired(true)
    ),
    
  execute: async ({ interaction, player }) => {
    const volume = interaction.options.getInteger('level');
    const queue = player.nodes.get(interaction.guildId);

    if (!queue) return interaction.reply('❌ Không có bài nào đang phát!');
    if (volume < 1 || volume > 100) return interaction.reply('❌ Mức âm lượng phải từ 1-100!');

    queue.node.setVolume(volume);
    await interaction.reply(`🔉 Âm lượng đã chỉnh về **${volume}%**`);
  }
};