const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Dừng phát nhạc và xóa hàng đợi'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply('Bạn cần phải ở trong một kênh thoại để dừng nhạc!');
        }

        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply('Bot không đang phát nhạc.');
        }

        // Xóa hàng đợi và ngừng phát nhạc
        global.queue = [];
        global.currentTrack = null;
        global.isPlaying = false;

        const subscription = connection.state.subscription;

        if (subscription && subscription.player) {
            const player = subscription.player;
            player.stop();
        }

        connection.destroy();

        await interaction.reply('Đã dừng phát nhạc và xóa hàng đợi.');
    },
};
