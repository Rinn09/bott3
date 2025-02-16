require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', async () => {
  console.log('Đã bật bot');
});

// Khởi tạo music player
const player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
    requestOptions: {
      headers: {
        cookie: process.env.YOUTUBE_COOKIE || ''
      }
    }
  }
});

// Xử lý lỗi player
player.events.on('error', (queue, error) => {
  console.error(`[${queue.guild.name}] Lỗi player:`, error);
});

// Đăng ký commands
client.commands = new Collection();
const commands = [
  require('./commands/music/play'),
  require('./commands/music/skip'),
  require('./commands/music/queue'),
  require('./commands/music/volume')
];

commands.forEach(command => {
  client.commands.set(command.data.name, command);
});

// Xử lý interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute({ interaction, player });
  } catch (error) {
    console.error(error);
    await interaction.reply({ 
      content: '❌ Có lỗi khi thực hiện lệnh!',
      ephemeral: true 
    });
  }
});

client.login(process.env.TOKEN);