const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('id')
        .setDescription('Tìm ID của người dùng')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Chọn người dùng')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userId = interaction.options.getUser('user').id;
        await interaction.reply(`**${userId}**`);
    },
};
