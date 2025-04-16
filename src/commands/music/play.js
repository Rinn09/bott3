const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, entersState, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const playDL = require('play-dl');
const queues = new Map();
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

console.log('✅ FFmpeg path:', ffmpegPath);

function getQueue(guildId) {
    if (!queues.has(guildId)) {
        queues.set(guildId, {
            isPlaying: false,
            queue: [],
            currentTrack: null,
            connection: null,
            player: null,
            timeout: null
        });
    }
    return queues.get(guildId);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from Youtube url')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Search a video on Youtube')
                .setRequired(false)),
    async execute(interaction) {
        const cookiePath = path.join(__dirname, '..', '..', '..', 'cookies.json');
        try {
            const raw = fs.readFileSync(cookiePath, 'utf-8');
            const cookie = JSON.parse(raw).youtubeCookie;
            if (cookie) {
                playDL.setToken({ youtube: { cookie } });
                console.log("✅ Cookie has been set up!");
            } else {
                console.warn("⚠️ Cant find 'youtubeCookie' on cookies.json.");
            }
        } catch (err) {
            console.error("❌ Cant read cookies.json:", err);
        }        

        await interaction.deferReply();
        const url = interaction.options.getString('url');
        const search = interaction.options.getString('search');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('You must join a voice channel!')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] });
        }

        if (!url && !search) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('You must provide a link or a query!')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] });
        }

        const queue = getQueue(interaction.guild.id);

        try {
            if (!queue.connection || queue.connection.state.status === 'destroyed') {
                queue.connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });

                queue.player = createAudioPlayer();
                queue.connection.subscribe(queue.player);
            }

            if (url) {
                const track = await playDL.video_basic_info(url);
                console.log("🎥 Video Info:", track.video_details);
                queue.queue.push({ title: track.video_details.title, url: url });
                if (!queue.isPlaying) {
                    playNext(interaction);
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('Queue')
                        .setDescription(`Added [**${track.video_details.title}**] to queue.`)
                        .setColor(0x00FF00);
                    queue.queueMessage = await interaction.editReply({ embeds: [embed] });
                }
            } else if (search) {
                const searchResult = await playDL.search(search, { limit: 5, source: { youtube: 'video' } });
                if (!searchResult || !searchResult.length) {
                    const embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription('No result!')
                        .setColor(0xFF0000);
                    return interaction.editReply({ embeds: [embed] });
                }

                const tracks = searchResult.map((track, index) => ({
                    title: track.title,
                    url: track.url,
                    description: track.description,
                    index: index
                }));

                const embed = new EmbedBuilder()
                    .setTitle('Select one')
                    .setDescription(tracks.map((t, i) => `${i + 1}. [${t.title}](${t.url})`).join('\n'))
                    .setColor(0xFF0000);

                const row = new ActionRowBuilder()
                    .addComponents(
                        tracks.map((t, i) =>
                            new ButtonBuilder()
                                .setCustomId(`select_${i}`)
                                .setLabel(`${i + 1}`)
                                .setStyle(ButtonStyle.Primary)
                        )
                    );

                await interaction.editReply({ embeds: [embed], components: [row] });

                const filter = i => i.customId.startsWith('select_') && i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

                collector.on('collect', async i => {
                    const index = parseInt(i.customId.split('_')[1], 10);
                    const track = tracks[index];
                    queue.queue.push({ title: track.title, url: track.url });
                    if (!queue.isPlaying) {
                        const embed = new EmbedBuilder()
                            .setTitle('Playing')
                            .setDescription(`**${track.title}**`)
                            .setColor(0x00FF00);
                        await i.update({ embeds: [embed], components: [] });
                        playNext(interaction);
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle('Queue')
                            .setDescription(`Added [**${track.title}**] to queue.`)
                            .setColor(0x00FF00);
                        queue.queueMessage = await i.update({ embeds: [embed], components: [] });
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        const embed = new EmbedBuilder()
                            .setTitle('Timeout!')
                            .setDescription('No more time to choose.')
                            .setColor(0xFF0000);
                        interaction.editReply({ embeds: [embed], components: [] });
                    }
                });
            }
        } catch (err) {
            console.error(err);
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Error while searching video.')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] });
        }
    },
};

async function playNext(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (queue.queue.length === 0) {
        queue.isPlaying = false;
        queue.currentTrack = null;
        return;
    }

    const track = queue.queue.shift();
    queue.currentTrack = track;

    console.log("🎵 Get stream from:", track.url);
    const stream = await playDL.stream(track.url, {
        quality: 2,
        discordPlayerCompatibility: true
    });
    console.log("📦 Stream OK, type:", stream.type);

    const resource = createAudioResource(stream.stream, {
        inputType: StreamType.WebmOpus, // hoặc stream.type nếu chắc chắn
        inlineVolume: true
    });

    console.log("✅ Resource created!");

    if (!queue.player) {
        queue.player = createAudioPlayer();
        queue.connection.subscribe(queue.player);
    }

    queue.player.play(resource);
    console.log("▶️ Playing music...");

    try {
        await entersState(queue.player, AudioPlayerStatus.Playing, 10_000);
        console.log("✅ Player is playing");
    } catch (err) {
        console.error("❌ Can not play:", err);
    }

    queue.isPlaying = true;
    const embed = new EmbedBuilder()
        .setTitle('Playing...')
        .setDescription(`🎵 ${track.title}`)
        .setColor(0x00FF00);
    interaction.editReply({ embeds: [embed] });

    queue.player.once(AudioPlayerStatus.Idle, () => {
        queue.isPlaying = false;
        playNext(interaction);
    });
}