const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const playDL = require('play-dl');

let connection, player;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play_playlist')
        .setDescription('Phát nhạc từ một playlist YouTube')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL của playlist YouTube')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const url = interaction.options.getString('url');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Bạn cần phải ở trong một kênh thoại để phát nhạc!')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] });
        }

        if (!url) {
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Bạn phải cung cấp URL của playlist!')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] });
        }

        try {
            if (!connection || connection.state.status === 'destroyed') {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
            }

            const playlistInfo = await playDL.playlist_info(url);
            const videos = await playlistInfo.all_videos();

            videos.forEach(video => {
                global.queue.push({ title: video.title, url: video.url });
            });

            // Send notification about playing the playlist
            const playlistEmbed = new EmbedBuilder()
                .setTitle('Đang phát playlist')
                .setDescription(`Playlist **${playlistInfo.title}** đang được phát.`)
                .setColor(0x00FF00);
            await interaction.editReply({ embeds: [playlistEmbed] });

            if (!global.isPlaying) {
                playNext(interaction);
            } else {
                const queueEmbed = new EmbedBuilder()
                    .setTitle('Playlist đã được thêm vào hàng đợi')
                    .setDescription(`Playlist **${playlistInfo.title}** đã được thêm vào hàng đợi.`)
                    .setColor(0x00FF00);
                return interaction.followUp({ embeds: [queueEmbed] });
            }
        } catch (err) {
            console.error(err);
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Có lỗi xảy ra khi thêm playlist vào hàng đợi.')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] });
        }
    },
};

async function playNext(interaction) {
    if (global.queue.length === 0) {
        global.isPlaying = false;
        global.currentTrack = null;
        const embed = new EmbedBuilder()
            .setTitle('Hết bài hát trong hàng đợi')
            .setDescription('Không còn bài hát nào trong hàng đợi.')
            .setColor(0xFF0000);
        await interaction.followUp({ embeds: [embed] });
        return;
    }

    const track = global.queue.shift();
    global.currentTrack = track;
    const stream = await playDL.stream(track.url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    if (!player) {
        player = createAudioPlayer();
        player.on(AudioPlayerStatus.Idle, async () => {
            if (global.queueMessage) {
                try {
                    await global.queueMessage.delete();
                } catch (error) {
                    console.error('Error deleting queue message:', error);
                }
                global.queueMessage = null;
            }
            playNext(interaction);
        });
    }

    if (!connection || connection.state.status === 'destroyed') {
        connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
    }

    connection.subscribe(player);
    player.play(resource);

    global.isPlaying = true;
    const trackEmbed = new EmbedBuilder()
        .setTitle('Đang phát')
        .setDescription(`Đang phát: **${track.title}**`)
        .setColor(0x00FF00);

    // Use interaction.token and interaction.client.api.webhooks for follow-up messages
    await interaction.client.api.webhooks(interaction.application_id, interaction.token).messages('@original').patch({
        data: {
            embeds: [trackEmbed.toJSON()]
        }
    });
}
