require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

// Hàm đệ quy đọc tất cả file command
function readCommands(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      readCommands(filePath);
    } else if (file.endsWith('.js')) {
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(`⚠️ File ${filePath} thiếu cấu trúc command hợp lệ`);
      }
    }
  }
}

readCommands(commandsPath);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Bắt đầu đăng ký ${commands.length} lệnh...`);
    
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ Đã đăng ký thành công ${data.length} lệnh!`);
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký lệnh:', error);
  }
})();