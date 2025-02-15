const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute_chat')
        .setDescription('Gỡ cấm chat người dùng')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Chọn người dùng để unmute')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);
        
        if (!member) {
            return interaction.reply({ content: 'Không tìm thấy người dùng.', ephemeral: true });
        }

        const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) {
            return interaction.reply({ content: 'Không tìm thấy vai trò Muted.', ephemeral: true });
        }

        if (!member.roles.cache.has(muteRole.id)) {
            return interaction.reply({ content: 'Người dùng không bị mute.', ephemeral: true });
        }

        await member.roles.remove(muteRole);
        await interaction.reply({ content: `${user.tag} đã được unmute.` });
    },
};
