const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Tạm dừng phát nhạc'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        
        if (!voiceChannel) {
            return interaction.reply('Bạn cần phải ở trong một kênh thoại để tạm dừng nhạc!');
        }

        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply('Hiện không có nhạc đang phát!');
        }

        const player = connection.state.subscription.player;
        player.pause();
        return interaction.reply('Đã tạm dừng phát nhạc.');
    },
};
