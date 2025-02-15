const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute_voice')
        .setDescription('Unmute người dùng trong voice chat')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Chọn người dùng để unmute')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) {
            return interaction.reply({ content: 'Không tìm thấy người dùng.', ephemeral: true });
        }

        if (!member.voice.channel) {
            return interaction.reply({ content: 'Người dùng không có trong voice channel.', ephemeral: true });
        }

        await member.voice.setMute(false);
        await interaction.reply({ content: `${user.tag} đã được unmute trong voice.` });
    },
};
