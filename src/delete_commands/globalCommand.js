const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.TOKEN);

rest.delete(Routes.applicationCommand(clientId, 'commandId'))
	.then(() => console.log('Xóa lệnh thành công (application)'))
	.catch(console.error);

// node src/deleteCommands/globalCommand.js