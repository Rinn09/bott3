const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc từ YouTube')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('URL hoặc từ khoá')
        .setRequired(true)
    ),
    
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const player = useMainPlayer();
      const query = interaction.options.getString('query');
      const { track } = await player.play(interaction.member.voice.channel, query, {
        nodeOptions: {
          metadata: interaction,
          volume: 50
        }
      });
      
      return interaction.editReply(`🎶 Đang phát: ${track.title}`);
    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Lỗi khi phát nhạc!');
    }
  }
};