const Discord = require('discord.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

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

client.login('MTM0MDkwODU5MzgyMTc4MjA1Nw.GpF7-d.mSUS5ayNe7cim_h1O9oIWKiU2b9zL9BVMCjDD4');