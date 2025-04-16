const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
const playDL = require('play-dl');

let connection, player;
global.repeatTimes = Infinity; // Default to repeat indefinitely

module.exports = {
    data: new SlashCommandBuilder()
        .setName('repeat')
        .setDescription('Lặp lại bài hát hiện tại một số lần nhất định hoặc lặp lại vĩnh viễn nếu không chỉ định số lần.')
        .addIntegerOption(option =>
            option.setName('times')
                .setDescription('Số lần lặp lại bài hát')
                .setRequired(false)),
    async execute(interaction) {
        const times = interaction.options.getInteger('times');

        if (!global.isPlaying || !global.currentTrack) {
            const embed = new EmbedBuilder()
                .setTitle('Không có bài hát nào đang phát')
                .setDescription('Hiện tại không có bài hát nào để lặp lại.')
                .setColor(0xFF0000);
            return interaction.reply({ embeds: [embed] });
        }

        global.repeatTimes = times !== null ? times : Infinity;

        const embed = new EmbedBuilder()
            .setTitle('Lặp lại bài hát')
            .setDescription(`Bài hát **${global.currentTrack.title}** sẽ được lặp lại ${times !== null ? `${times} lần` : 'vĩnh viễn'}.`)
            .setColor(0x00FF00);
        await interaction.reply({ embeds: [embed] });

        repeatTrack(interaction);
    },
};

async function repeatTrack(interaction) {
    if (global.repeatTimes === 0) {
        global.isPlaying = false;
        global.currentTrack = null;
        const embed = new EmbedBuilder()
            .setTitle('Hết lặp lại')
            .setDescription('Đã hết số lần lặp lại bài hát.')
            .setColor(0xFF0000);
        await interaction.followUp({ embeds: [embed] });
        return;
    }

    const track = global.currentTrack;
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
            if (global.repeatTimes !== Infinity) {
                global.repeatTimes--;
            }
            repeatTrack(interaction);
        }
    });

    global.isPlaying = true;
    const embed = new EmbedBuilder()
        .setTitle('Đang phát')
        .setDescription(`Đang phát lại: **${track.title}**`)
        .setColor(0x00FF00);
    await interaction.followUp({ embeds: [embed] });
}
