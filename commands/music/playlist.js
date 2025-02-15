const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Hiển thị danh sách các bài hát trong hàng đợi'),
    async execute(interaction) {
        const queue = global.queue || [];

        if (queue.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('Hàng đợi trống')
                .setDescription('Hàng đợi hiện tại đang trống.')
                .setColor(0xFF0000);
            return interaction.reply({ embeds: [embed] });
        }

        const currentTrack = global.currentTrack;
        const upcomingTracks = queue;

        const embed = new EmbedBuilder()
            .setTitle('Danh sách phát')
            .setDescription(
                `**1. ${currentTrack ? currentTrack.title : 'Không có bài hát nào đang phát'} (hiện tại)**\n` +
                upcomingTracks.map((track, index) => `${index + 2}. ${track.title}`).join('\n')
            )
            .setColor(0xFFFF00);

        await interaction.reply({ embeds: [embed] });
    }
};
