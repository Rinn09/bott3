require('dotenv').config();
const { REST, Routes } = require('discord.js');
const rest = new REST().setToken(process.env.TOKEN);

rest.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log('Xóa tất cả các lệnh thành công (application).'))
	.catch(console.error);