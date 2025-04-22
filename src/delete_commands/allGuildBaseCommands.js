const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] })
    .then(() => console.log('Xóa tất cả các lệnh thành công (guild).'))
    .catch(console.error);

// node src/delete_commands/allGuildBaseCommands.js