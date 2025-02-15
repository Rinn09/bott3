const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer } = require('@discordjs/voice');
const playDL = require('play-dl');

let connection, player;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Bỏ qua bài hát hiện tại và phát bài hát tiếp theo trong hàng đợi'),
    async execute(interaction) {
        if (!global.isPlaying || !global.currentTrack) {
            const embed = new EmbedBuilder()
                .setTitle('Không có bài hát nào đang phát')
                .setDescription('Hiện tại không có bài hát nào để bỏ qua.')
                .setColor(0xFF0000);
            return interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('Bỏ qua bài hát')
            .setDescription(`Đã bỏ qua: **${global.currentTrack.title}**`)
            .setColor(0x00FF00);
        await interaction.reply({ embeds: [embed] });

        playNext(interaction);
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
        .setDescription(`Đang phát: **${track.title}**`)
        .setColor(0x00FF00);
    await interaction.followUp({ embeds: [embed] });
}
