const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { joinVoiceChannel, createAudioResource, createAudioPlayer, entersState, StreamType } = require("@discordjs/voice");
const playDL = require("play-dl");
const prism = require("prism-media"); // Import prism-media để dùng FFmpeg
const queues = new Map();
const ytdl = require('ytdl-core');

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
        .setName("play")
        .setDescription("Phát nhạc từ URL hoặc tìm kiếm trên YouTube")
        .addStringOption(option =>
            option.setName("url")
                .setDescription("URL của video YouTube")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("search")
                .setDescription("Tìm kiếm video YouTube")
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const url = interaction.options.getString("url");
        const search = interaction.options.getString("search");
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setTitle("Lỗi")
                .setDescription("Bạn cần ở trong kênh thoại để phát nhạc!")
                .setColor(0xff0000);
            return interaction.editReply({ embeds: [embed] });
        }
        if (!url && !search) {
            const embed = new EmbedBuilder()
                .setTitle("Lỗi")
                .setDescription("Cần cung cấp URL hoặc từ khóa tìm kiếm!")
                .setColor(0xff0000);
            return interaction.editReply({ embeds: [embed] });
        }

        const queue = getQueue(interaction.guild.id);
        // Nếu chưa có kết nối, tạo mới
        if (!queue.connection || queue.connection.state.status === "destroyed") {
            queue.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });
            queue.player = createAudioPlayer();
            queue.connection.subscribe(queue.player);
        }

        // Nếu người dùng nhập URL, ưu tiên URL
        if (url) {
            const trackInfo = await playDL.video_basic_info(url);
            queue.queue.push({
                title: trackInfo.video_details.title,
                url: url
            });
            if (!queue.isPlaying) {
                await playNext(interaction, interaction.guild.id);
            } else {
                const embed = new EmbedBuilder()
                    .setTitle("Hàng đợi")
                    .setDescription(`[**${trackInfo.video_details.title}**] đã được thêm vào hàng đợi.`)
                    .setColor(0x00ff00);
                return interaction.editReply({ embeds: [embed] });
            }
        }
        // Nếu không có URL, dùng từ khóa tìm kiếm (ở đây mình chỉ chọn kết quả đầu tiên)
        else if (search) {
            const results = await playDL.search(search, { limit: 5, source: { youtube: "video" } });
            if (!results || results.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Lỗi")
                    .setDescription("Không tìm thấy video phù hợp.")
                    .setColor(0xff0000);
                return interaction.editReply({ embeds: [embed] });
            }
            const chosen = results[0];
            queue.queue.push({
                title: chosen.title,
                url: chosen.url
            });
            if (!queue.isPlaying) {
                await playNext(interaction, interaction.guild.id);
            } else {
                const embed = new EmbedBuilder()
                    .setTitle("Hàng đợi")
                    .setDescription(`[**${chosen.title}**] đã được thêm vào hàng đợi.`)
                    .setColor(0x00ff00);
                return interaction.editReply({ embeds: [embed] });
            }
        }
    }
};

async function playNext(interaction, guildId) {
    const queue = getQueue(guildId);
    console.log("🔊 Trạng thái queue:", {
        isPlaying: queue.isPlaying,
        queueLength: queue.queue.length,
        connection: !!queue.connection,
        player: !!queue.player
    });

    if (queue.queue.length === 0) {
        console.log("🎵 Hàng đợi trống, dừng phát nhạc");
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
        const stream = ytdl(track.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        });
        console.log(`🎵 Đang xử lý track: ${track.title} (${track.url})`);
        queue.currentTrack = track;

        // Lấy thông tin và stream video với play-dl
        const info = await playDL.video_info(track.url);
        const streamData = await playDL.stream_from_info(info);  // Không dùng discordPlayerCompatibility ở đây
        console.log("📦 Stream có readable:", streamData.stream.readable);

        // Chuyển đổi stream sang định dạng Opus với FFmpeg qua prism-media
        const ffmpeg = new prism.FFmpeg({
            args: [
                "-analyzeduration", "0",
                "-loglevel", "0",
                "-i", "pipe:0",
                "-ac", "2",
                "-f", "opus",
                "pipe:1"
            ]
        });
        ffmpeg.on("error", (error) => {
            console.error("❌ FFmpeg error:", error);
        });
        
        const resource = createAudioResource(stream, {
            inputType: StreamType.Arbitrary
        });
        
        // Kiểm tra trước khi setVolume
        if (resource.volume) {
            resource.volume.setVolume(1.0);
        } else {
            console.warn("⚠️ Volume control không khả dụng cho resource này.");
        }

        // Xóa các listener cũ và thêm listener cho stateChange
        queue.player.removeAllListeners("stateChange");
        queue.player.on("stateChange", (oldState, newState) => {
            console.log(`🔊 Trạng thái player: ${oldState.status} → ${newState.status}`);
            if (newState.status === "idle") {
                playNext(interaction, guildId);
            }
        });
        queue.player.on("error", (error) => {
            console.error("❌ Lỗi player:", error);
            playNext(interaction, guildId);
        });

        queue.player.play(resource);
        queue.isPlaying = true;
        await entersState(queue.player, "playing", 15_000).catch(() => {
            console.error("❌ Timeout khi chờ phát nhạc");
            playNext(interaction, guildId);
        });

        console.log("▶️ Đang phát nhạc...");
        const embed = new EmbedBuilder()
            .setTitle("Đang phát")
            .setDescription(`**${track.title}**`)
            .setColor(0x00ff00);
        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error("Lỗi khi phát nhạc:", err);
        const embed = new EmbedBuilder()
            .setTitle("Lỗi")
            .setDescription("Không thể phát bài hát này!")
            .setColor(0xff0000);
        await interaction.editReply({ embeds: [embed] });
        playNext(interaction, guildId);
    }
}


