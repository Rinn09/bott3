const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Bỏ qua bài hiện tại'),
    
  execute: async ({ interaction, player }) => {
    const queue = player.nodes.get(interaction.guildId);
    
    if (!queue || !queue.node.isPlaying()) {
      return interaction.reply('❌ Không có bài nào đang phát!');
    }

    queue.node.skip();
    await interaction.reply('⏭️ Đã bỏ qua bài hiện tại');
  }
};