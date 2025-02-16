const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Xem danh sách phát'),
    
  execute: async ({ interaction, player }) => {
    const queue = player.nodes.get(interaction.guildId);
    
    if (!queue || queue.tracks.size < 1) {
      return interaction.reply('❌ Hàng đợi trống!');
    }

    const tracks = queue.tracks.map((track, index) => 
      `**${index + 1}.** [${track.title}](${track.url})`
    ).join('\n');

    const embed = {
      title: `🎵 Danh sách phát - ${queue.tracks.size + 1} bài`,
      description: `🔊 Đang phát: [${queue.currentTrack.title}](${queue.currentTrack.url})\n\n${tracks}`,
      color: 0x3498db
    };

    await interaction.reply({ embeds: [embed] });
  }
};