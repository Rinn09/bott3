const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute_voice')
        .setDescription('Mute người dùng trong voice chat')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Chọn người dùng để mute')
                .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName('time')
                .setDescription('Thời gian mute (phút)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('until_unmute')
                .setDescription('Mute đến khi được unMute')
                .setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const time = interaction.options.getInteger('time');
        const untilUnmute = interaction.options.getBoolean('until_unmute');
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) {
            return interaction.reply({ content: 'Không tìm thấy người dùng.', ephemeral: true });
        }

        if (!member.voice.channel) {
            return interaction.reply({ content: 'Người dùng không có trong voice channel.', ephemeral: true });
        }

        await member.voice.setMute(true);

        if (untilUnmute) {
            await interaction.reply({ content: `${user.tag} đã bị mute trong voice cho đến khi được unmute.` });
        } else if (time) {
            await interaction.reply({ content: `${user.tag} đã bị mute trong voice trong ${time} phút.` });

            setTimeout(async () => {
                if (member.voice.channel) {
                    await member.voice.setMute(false);
                }
            }, time * 60 * 1000);
        } else {
            await interaction.reply({ content: `${user.tag} đã bị mute trong voice.` });
        }
    },
};
