const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute_chat')
        .setDescription('Cấm chat người dùng')
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
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const time = interaction.options.getInteger('time');
        const untilUnmute = interaction.options.getBoolean('until_unmute');
        const member = await interaction.guild.members.fetch(user.id);

        if (!member) {
            return interaction.reply({ content: 'Không tìm thấy người dùng.', ephemeral: true });
        }

        let muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) {
            muteRole = await interaction.guild.roles.create({
                name: 'Muted',
                permissions: []
            });

            interaction.guild.channels.cache.forEach(channel => {
                channel.permissionOverwrites.edit(muteRole, {
                    SendMessages: false,
                    Speak: false,
                    AddReactions: false
                });
            });
        }

        if (member.roles.cache.has(muteRole.id)) {
            return interaction.reply({ content: 'Người dùng đã bị mute.', ephemeral: true });
        }

        await member.roles.add(muteRole);

        if (untilUnmute) {
            await interaction.reply({ content: `${user.tag} đã bị mute cho đến khi được unmute.` });
        } else if (time) {
            await interaction.reply({ content: `${user.tag} đã bị mute trong ${time} phút.` });

            setTimeout(async () => {
                if (member.roles.cache.has(muteRole.id)) {
                    await member.roles.remove(muteRole);
                }
            }, time * 60 * 1000);
        } else {
            await interaction.reply({ content: `${user.tag} đã bị mute.` });
        }
    },
};
