const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Tạo một mảng để chứa các lệnh cần đăng ký
const commands = [];

// Lấy tất cả các thư mục lệnh
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Đọc tất cả các file lệnh từ các thư mục
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`Đang chuẩn bị đăng ký lệnh: ${command.data.name}`);
    } else {
      console.log(`Lệnh tại ${filePath} thiếu thuộc tính data hoặc execute`);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Bắt đầu đăng ký ${commands.length} lệnh cho Discord API...`);
    const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log(`Đã đăng ký ${data.length} lệnh global thành công.`);
    
  } catch (error) {
    console.error('Lỗi khi đăng ký lệnh:', error);
  }
})();

// node src/register-commands.js