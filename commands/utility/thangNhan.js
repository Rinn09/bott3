const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('thg_nhan_co_rac_khong')
		.setDescription('Thằng Nhân có rác không?'),
	async execute(interaction) {
        
		await interaction.reply('Rác vãi cả lồn');
	},
};