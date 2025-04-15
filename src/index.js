require('dotenv').config();
const Discord = require('discord.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { execSync } = require('child_process');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

try {
    const ffmpegPath = require('ffmpeg-static');
    console.log('✅ FFmpeg path:', ffmpegPath);
    console.log('ℹ️ FFmpeg version:', execSync(`"${ffmpegPath}" -version`).toString().split('\n')[0]);
} catch (error) {
    console.error('❌ Lỗi FFmpeg:', error);
    process.exit(1);
}

const client = new Discord.Client({
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
client.commands = new Collection();
['play', 'skip', 'queue'].forEach(cmd => {
  const command = require(`./commands/music/${cmd}`);
  client.commands.set(command.data.name, command);
});

// Xử lý interactions
client.on('interactionCreate', async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocompleteRun) return;
    await command.autocompleteRun(interaction); // ✅
    return;
  }

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction); // ✅
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Lỗi khi thực hiện lệnh!",
        ephemeral: true,
      });
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