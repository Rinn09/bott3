require('dotenv').config();
const Discord = require('discord.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { execSync } = require('child_process');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('node:fs');
const path = require('path');
const disabledCommandsPath = path.join(__dirname, 'commands', 'utility', 'disabledCommands.json');
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);	

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessages
  ]
});

client.commands = new Collection();

try {
    const ffmpegPath = require('ffmpeg-static');
    console.log('✅ FFmpeg path:', ffmpegPath);
    console.log('ℹ️ FFmpeg version:', execSync(`"${ffmpegPath}" -version`).toString().split('\n')[0]);
} catch (error) {
    console.error('❌ Lỗi FFmpeg:', error);
    process.exit(1);
}

const player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
    filter: 'audioonly'
  } 
});

client.on('ready', async () => {
  // Load các extractor cụ thể
  await player.extractors.loadMulti(DefaultExtractors);
  
  console.log(`✅ ${client.user.tag} đã online!`);
  console.log(`🎧 Đã tải ${player.extractors.size} extractors`);
});

// Xử lý lỗi
player.events.on('error', (queue, error) => {
  console.error(`Lỗi tại server ${queue.guild.name}:`, error);
});

// Đăng ký commands
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] Có 1 lệnh tại ${filePath} bị thiếu thuộc tính bắt buộc: "data" hoặc "execute".`);
    }
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`Không tìm thấy lệnh nào khớp với ${interaction.commandName}.`);
    return;
  }

  const guildId = interaction.guild.id;
  let disabledCommands;
  try {
    disabledCommands = JSON.parse(fs.readFileSync(disabledCommandsPath, 'utf8') || '{}');
  } catch (error) {
    if (error.code === 'ENOENT') {
      disabledCommands = {};
    } else {
      console.error('Có lỗi xảy ra khi đọc file disabledCommands.json', error);
      return interaction.reply({ content: 'Có lỗi xảy ra khi kiểm tra lệnh bị vô hiệu hóa.', ephemeral: true });
    }
  }

  if (disabledCommands[guildId] && disabledCommands[guildId][interaction.commandName]) {
    const disabled = disabledCommands[guildId][interaction.commandName];
    if (disabled === 'all' || (Array.isArray(disabled) && disabled.includes(interaction.channel.id))) {
      return interaction.reply({ content: 'Lệnh này đã bị vô hiệu.', ephemeral: true });
    }
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Có lỗi xảy ra khi thực hiện(executing) lệnh này!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Có lỗi xảy ra khi thực hiện (executing) lệnh này!', ephemeral: true });
    }
  }
});

client.on('messageCreate', async message => {
  if (message.content === '!play') {
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) {
          return message.reply('❌ Bạn cần tham gia một kênh thoại trước!');
      }

      const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(path.join(__dirname, 'test', 'test1.mp3'));

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
          connection.destroy();
          console.log('✅ Phát xong tệp âm thanh.');
      });

      player.on('stateChange', (oldState, newState) => {
        console.log(`Trạng thái player: ${oldState.status} -> ${newState.status}`);
      });

      player.on('error', error => {
          console.error('❌ Lỗi khi phát tệp âm thanh:', error);
      });
  }
});

client.login(process.env.TOKEN);