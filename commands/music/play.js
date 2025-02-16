const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const Queue = require('../../queue');

const queues = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc từ YouTube')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL YouTube')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.editReply('❌ Bạn cần vào voice channel trước!');

    const guildId = interaction.guild.id;
    const url = interaction.options.getString('url');
    let connection;

    try {
      if (!queues.has(guildId)) {
        queues.set(guildId, new Queue());
      }
      const queue = queues.get(guildId);

      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();

      player.on('error', error => {
        console.error('Lỗi AudioPlayer:', error);
        interaction.channel.send('❌ Lỗi khi phát nhạc!');
      });

      player.on('stateChange', (oldState, newState) => {
        if (newState.status === 'idle') {
          const nextTrack = queue.next();
          if (nextTrack) {
            const newResource = createAudioResource(ytdl(nextTrack.url, {
              filter: 'audioonly',
              highWaterMark: 1 << 25
            }));
            player.play(newResource);
          } else {
            connection.destroy();
            queues.delete(guildId);
          }
        }
      });

      const trackInfo = await ytdl.getInfo(url);
      const track = {
        title: trackInfo.videoDetails.title,
        url: trackInfo.videoDetails.video_url,
        duration: trackInfo.videoDetails.lengthSeconds
      };
      queue.add(track);

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      connection.subscribe(player);

      if (!queue.playing) {
        const stream = ytdl(track.url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25
        });

        const resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true
        });

        player.play(resource);
        queue.playing = true;

        await interaction.editReply({
          content: `🎶 Đang phát: **${track.title}**\n🕒 Thời lượng: ${Math.floor(track.duration / 60)}:${track.duration % 60 < 10 ? '0' : ''}${track.duration % 60}`,
          flags: 64
        });
      } else {
        await interaction.editReply({
          content: `🎵 Đã thêm vào hàng đợi: **${track.title}**`,
          flags: 64
        });
      }

    } catch (error) {
      console.error('Lỗi chính:', error);
      await interaction.editReply('❌ Có lỗi xảy ra khi phát nhạc!');
      if (connection) connection.destroy();
      queues.delete(guildId);
    }
  }
};  