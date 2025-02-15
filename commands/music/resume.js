const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Tiếp tục phát nhạc'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        
        if (!voiceChannel) {
            return interaction.reply('Bạn cần phải ở trong một kênh thoại để tiếp tục nhạc!');
        }

        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply('Hiện không có nhạc đang phát!');
        }

        const player = connection.state.subscription.player;
        player.unpause();
        return interaction.reply('Đã tiếp tục phát nhạc.');
    },
};
