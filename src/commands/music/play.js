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
        // Tìm kiếm với extractor đã đăng ký
        const searchResult = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: 'youtube'
        });
  
        if (!searchResult.hasTracks()) {
          return interaction.editReply('❌ Không tìm thấy kết quả!');
        }
  
        const queue = player.nodes.create(interaction.guild, {
          metadata: interaction.channel,
          selfDeaf: true,
          volume: 50,
          leaveOnEnd: false
        });
  
        try {
          if (!queue.connection) await queue.connect(channel);
        } catch {
          await player.deleteQueue(interaction.guildId);
          return interaction.editReply('❌ Không thể vào voice channel!');
        }
  
        searchResult.playlist 
          ? queue.addTrack(searchResult.tracks)
          : queue.addTrack(searchResult.tracks[0]);
  
        if (!queue.node.isPlaying()) await queue.node.play();
        
        return interaction.editReply(`🎶 Đang phát: **${searchResult.tracks[0].title}**`);
      } catch (error) {
        console.error(error);
        return interaction.editReply('❌ Lỗi khi phát nhạc!');
      }
    }
};