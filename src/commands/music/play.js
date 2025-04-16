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
        .setDescription('Phát nhạc từ URL hoặc tìm kiếm trên YouTube')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL của video YouTube')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Tìm kiếm video YouTube')
                .setRequired(false)),
    async execute(interaction) {
        const cookiePath = path.join(__dirname, '..', '..', '..', 'cookies.json');
        try {
            const cookieData = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'));
            const cookie = cookieData.youtubeCookie;
            if (cookie) {
                playDL.setToken({ youtube: { cookie } });
                console.log("✅ Cookie YouTube đã được thiết lập!");
            } else {
                console.warn("⚠️ Không tìm thấy khóa 'youtubeCookie' trong cookies.json.");
            }
        } catch (err) {
            console.error("❌ Không thể đọc hoặc parse file cookies.json:", err);
        }        

        await interaction.deferReply();
        const url = interaction.options.getString('url');
        const search = interaction.options.getString('search');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Bạn cần phải ở trong một kênh thoại để phát nhạc!')
                .setColor(0xFF0000);
            return interaction.editReply({ embeds: [embed] });
        }

        if (!url && !search) {
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Bạn phải cung cấp URL hoặc từ khóa tìm kiếm!')
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
                queue.queue.push({ title: track.video_details.title, url: url });
                if (!queue.isPlaying) {
                    playNext(interaction);
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('Hàng đợi')
                        .setDescription(`[**${track.video_details.title}**] đã được thêm vào hàng đợi.`)
                        .setColor(0x00FF00);
                    queue.queueMessage = await interaction.editReply({ embeds: [embed] });
                }
            } else if (search) {
                const searchResult = await playDL.search(search, { limit: 5, source: { youtube: 'video' } });
                if (!searchResult || !searchResult.length) {
                    const embed = new EmbedBuilder()
                        .setTitle('Lỗi')
                        .setDescription('Không tìm thấy kết quả nào!')
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
                    .setTitle('Chọn một kết quả')
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
                            .setTitle('Đang phát')
                            .setDescription(`**${track.title}**`)
                            .setColor(0x00FF00);
                        await i.update({ embeds: [embed], components: [] });
                        playNext(interaction);
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle('Hàng đợi')
                            .setDescription(`[**${track.title}**] đã được thêm vào hàng đợi.`)
                            .setColor(0x00FF00);
                        queue.queueMessage = await i.update({ embeds: [embed], components: [] });
                    }
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        const embed = new EmbedBuilder()
                            .setTitle('Hết thời gian')
                            .setDescription('Hết thời gian lựa chọn.')
                            .setColor(0xFF0000);
                        interaction.editReply({ embeds: [embed], components: [] });
                    }
                });
            }
        } catch (err) {
            console.error(err);
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Có lỗi xảy ra khi tìm kiếm video.')
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

    console.log("🎵 Lấy stream từ:", track.url);
    const stream = await playDL.stream(track.url, {
        discordPlayerCompatibility: true
    });
    console.log("📦 Stream OK, type:", stream.type);

    const resource = createAudioResource(stream.stream, {
        inputType: StreamType.WebmOpus, // hoặc stream.type nếu chắc chắn
        inlineVolume: true
    });

    console.log("✅ Tạo resource thành công");

    if (!queue.player) {
        queue.player = createAudioPlayer();
        queue.connection.subscribe(queue.player);
    }

    queue.player.play(resource);
    console.log("▶️ Phát nhạc...");

    try {
        await entersState(queue.player, AudioPlayerStatus.Playing, 10_000);
        console.log("✅ Player đang phát");
    } catch (err) {
        console.error("❌ Không thể phát:", err);
    }

    queue.isPlaying = true;
    const embed = new EmbedBuilder()
        .setTitle('Đang phát')
        .setDescription(`🎵 ${track.title}`)
        .setColor(0x00FF00);
    interaction.editReply({ embeds: [embed] });

    queue.player.once(AudioPlayerStatus.Idle, () => {
        queue.isPlaying = false;
        playNext(interaction);
    });
}