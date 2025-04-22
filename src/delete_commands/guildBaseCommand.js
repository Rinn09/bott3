const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.TOKEN);

rest.delete(Routes.applicationCommand(clientId, guildId, 'commandId'))
	.then(() => console.log('Xóa lệnh thành công (guild)'))
	.catch(console.error);

// node src/deleteCommands/guildBaseCommand.js