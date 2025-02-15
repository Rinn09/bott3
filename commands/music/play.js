const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const playDL = require('play-dl');

let connection, player;
global.isPlaying = false;
global.queue = [];
global.currentTrack = null;
global.queueMessage = null;

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
            if (!connection || connection.state.status === 'destroyed') {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
            }

            if (url) {
                const track = await playDL.video_basic_info(url);
                global.queue.push({ title: track.video_details.title, url: url });
                if (!global.isPlaying) {
                    playNext(interaction);
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle('Hàng đợi')
                        .setDescription(`[**${track.video_details.title}**] đã được thêm vào hàng đợi.`)
                        .setColor(0x00FF00);
                    global.queueMessage = await interaction.editReply({ embeds: [embed] });
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
                    global.queue.push({ title: track.title, url: track.url });
                    if (!global.isPlaying) {
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
                        global.queueMessage = await i.update({ embeds: [embed], components: [] });
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
    if (global.queue.length === 0) {
        global.isPlaying = false;
        global.currentTrack = null;
        return;
    }

    const track = global.queue.shift();
    global.currentTrack = track;
    const stream = await playDL.stream(track.url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    if (!player) {
        player = createAudioPlayer();
        connection.subscribe(player);
    }

    player.play(resource);

    player.on('stateChange', async (oldState, newState) => {
        if (newState.status === 'idle') {
            if (global.queueMessage) {
                try {
                    await global.queueMessage.delete();
                } catch (error) {
                    console.error('Error deleting queue message:', error);
                }
                global.queueMessage = null;
            }
            playNext(interaction);
        }
    });

    global.isPlaying = true;
    const embed = new EmbedBuilder()
        .setTitle('Đang phát')
        .setDescription(`**${track.title}**`)
        .setColor(0xFF0000);
    interaction.editReply({ embeds: [embed] });
}
