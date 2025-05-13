const { REST, Routes } = require("discord.js");
require("dotenv").config();

const rest = new REST().setToken(process.env.TOKEN);

rest
  .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
  .then(() => console.log("Xóa tất cả các lệnh thành công (application)."))
  .catch(console.error);

//node src/delete_commands/allGlobalCommand.js
