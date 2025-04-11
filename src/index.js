const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { YouTubeExtractor } = require('@discord-player/extractor'); // Chỉ import YouTubeExtractor

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

const player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25
  }
});

client.on('ready', async () => {
  // Đăng ký extractor theo cách mới
  await player.extractors.register(YouTubeExtractor);
  
  console.log(`✅ ${client.user.tag} đã online!`);
  console.log(`🎧 Đã tải ${player.extractors.size} extractors`);
});

// Xử lý lỗi
player.events.on('error', (queue, error) => {
  console.error(`Lỗi tại server ${queue.guild.name}:`, error);
});

// Đăng ký commands
client.commands = new Collection();
['play', 'skip', 'queue'].forEach(cmd => {
  const command = require(`./commands/music/${cmd}`);
  client.commands.set(command.data.name, command);
});

// Xử lý interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction); // Truyền interaction trực tiếp
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '❌ Lỗi khi thực hiện lệnh!',
      flags: 64
    });
  }
});

client.login(process.env.TOKEN);