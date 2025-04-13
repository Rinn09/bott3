const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const playDL = require('play-dl');
const { useMainPlayer } = require("discord-player");
const queues = new Map();

const getQueue = (guildId) => {
    if (!queues.has(guildId)) {
        queues.set(guildId, {
            isPlaying: false,
            queue: [],
            currentTrack: null,
            queueMessage: null,
            timeout: null, // Thêm trường timeout
            connection: null, // Thêm connection vào queue
            player: null // Thêm player vào queue
        });
    }
    return queues.get(guildId);
};

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

        try {

            const queue = getQueue(interaction.guild.id);
            if (!queue.connection || queue.connection.state.status === 'destroyed') {
                queue.connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: false,
                });
                queue.player = createAudioPlayer();
                queue.connection.subscribe(queue.player); // Subscribe player vào connection
            }
            
            // Đảm bảo player được khởi tạo
            if (!queue.player) {
                queue.player = createAudioPlayer();
                queue.connection.subscribe(queue.player);
            }

            if (url) {
                const track = await playDL.video_basic_info(url);
                const queue = getQueue(interaction.guild.id)
                queue.queue.push({ // Thêm vào hàng đợi cụ thể
                    title: track.video_details.title,
                    url: url
                });
            
                if (!queue.isPlaying) {
                    playNext(interaction, interaction.guild.id);
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
                    const queue = getQueue(interaction.guild.id);
                    const index = parseInt(i.customId.split('_')[1], 10);
                    const track = tracks[index];

                    if (queue.timeout) {
                        clearTimeout(queue.timeout);
                        queue.timeout = null;
                    }

                    if (!queue.connection || queue.connection.state.status === 'destroyed') {
                        queue.connection = joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: interaction.guild.id,
                            adapterCreator: interaction.guild.voiceAdapterCreator,
                            selfDeaf: false
                        });
                        
                        queue.player = createAudioPlayer();
                        queue.connection.subscribe(queue.player);
                    }

                    queue.queue.push({ 
                        title: track.title, 
                        url: track.url });

                        if (queue.timeout) {
                            clearTimeout(queue.timeout);
                            queue.timeout = null;
                        }

                    if (!queue.isPlaying) {
                        const embed = new EmbedBuilder()
                            .setTitle('Đang phát')
                            .setDescription(`**${track.title}**`)
                            .setColor(0x00FF00);
                        await i.update({ embeds: [embed], components: [] });
                        playNext(interaction, interaction.guild.id);
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

async function playNext(interaction, guildId) {
    const queue = getQueue(guildId);

    if (queue.queue.length === 0) {
        queue.isPlaying = false;
        queue.currentTrack = null;

        queue.timeout = setTimeout(() => {
            if (queue.connection) {
                queue.connection.destroy();
                queues.delete(guildId);
                console.log(`🛑 Tự động ngắt kết nối khỏi ${guildId}`);
            }
        }, 300000);
        return;
    }

    if (queue.timeout) {
        clearTimeout(queue.timeout);
        queue.timeout = null;
    }

    try {
        const track = queue.queue.shift();
        queue.currentTrack = track;
        const stream = await playDL.stream(track.url).catch(async (err) => {
            console.error('Lỗi khi tải video:', err);
            const embed = new EmbedBuilder()
                .setTitle('Lỗi')
                .setDescription('Không thể tải video từ URL này!')
                .setColor(0xFF0000);
            await interaction.editReply({ embeds: [embed] });
            return;
        });

        const resource = createAudioResource(stream.stream, { inputType: stream.type });

        // Khởi tạo player nếu chưa có
        if (!queue.player) {
            queue.player = createAudioPlayer();
            queue.connection.subscribe(queue.player); // Subscribe player vào connection
        }

        queue.player.play(resource);
        queue.isPlaying = true;

        // Thêm sự kiện stateChange
        queue.player.removeAllListeners('stateChange');
        queue.player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle') {
                playNext(interaction, guildId);
            }
        });

        // Gửi thông báo phát nhạc
        const embed = new EmbedBuilder()
            .setTitle('Đang phát')
            .setDescription(`**${track.title}**`)
            .setColor(0xFF0000);
        await interaction.editReply({ embeds: [embed] });

    } catch (err) {
        console.error('Lỗi khi phát nhạc:', err);
        const embed = new EmbedBuilder()
            .setTitle('Lỗi')
            .setDescription('Không thể phát bài hát này!')
            .setColor(0xFF0000);
        await interaction.editReply({ embeds: [embed] });
        playNext(interaction, guildId); // Thử phát bài tiếp theo
    }
}