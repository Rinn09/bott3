const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const Queue = require('../../scr/utils/music/queue')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music')
    .addStringOption(option => 
      option.setName('url')
        .setDescription('YouTube URL')
        .setRequired(true)),
  
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply('❌ Bạn cần vào voice channel!');

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    const queue = new Queue();

    const stream = ytdl(interaction.options.getString('url'), { 
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25 
    });

    const resource = createAudioResource(stream);
    player.play(resource);
    connection.subscribe(player);

    await interaction.reply('🎶 Đang phát nhạc...');
  }
};