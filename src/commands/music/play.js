const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc từ YouTube')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('URL hoặc tên bài hát')
        .setRequired(true)
    ),
    
  execute: async ({ interaction, player }) => {
    await interaction.deferReply();

    const channel = interaction.member.voice.channel;
    if (!channel) return interaction.editReply('❌ Bạn cần vào voice channel trước!');

    const query = interaction.options.getString('query');
    
    try {
      const searchResult = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: 'youtubeSearch'
      });

      if (!searchResult.hasTracks()) {
        return interaction.editReply('❌ Không tìm thấy kết quả!');
      }

      const { track } = await player.play(channel, searchResult, {
        nodeOptions: {
          metadata: interaction,
          volume: 50,
          bufferingTimeout: 15000,
          leaveOnEnd: false,
          leaveOnEmpty: true,
          leaveOnStop: false,
          selfDeaf: true
        }
      });

      return interaction.editReply(`🎶 Đã thêm vào queue: **${track.title}**`);
    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Lỗi khi phát nhạc!');
    }
  }
};