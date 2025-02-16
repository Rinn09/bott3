const Discord = require('discord.js');
const { Client, Collection } = require('discord.js');
const { Player, useMainPlayer } = require('discord-player');
const MusicQueue = require('./queue');
const { YouTubeExtractor } = require('@discord-player/extractor');
const path = require('node:path');
const fs = require('node:fs');
const mongoose = require('mongoose');
const UserStat = require('./models/UserStat');
const { token, testChannel, mongoosedbURI } = require('./config.json');
const prefix = '%';
const foldersPath = path.join(__dirname, 'commands');
const disabledCommandsPath = path.join(__dirname, 'commands', 'utility', 'disabledCommands.json');
const commandFolders = fs.readdirSync(foldersPath);
const prefixModule = require('./prefix/prefix');
const musicModule = require('./prefix/music');

require('./scr/utils/voice')

let userStats = {
  userMessages: {},
  userExp: {},
  userLevels: {},
  userCash: {},
  lastLevel: {},
};

const client = new Discord.Client({
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true,
  },
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildMembers",
    "GuildMessageReactions",
    "MessageContent",
    "GuildMessageTyping",
    "DirectMessageReactions",
    "DirectMessageTyping",
    "DirectMessages",
    "GuildWebhooks",
    "GuildIntegrations",
    "GuildVoiceStates",
    "GuildBans",
    "GuildPresences",
  ]
});

client.on('ready', async () => {
  console.log('Đã bật bot');
  client.guilds.cache.forEach(async (guild) => {
    guild.members.cache.forEach(async (member) => {
      if (!member.user.bot) {
        const userId = member.user.id;
        await updateLevel(userId);
      }
    });
  });
});

client.commands = new Collection();

client.player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25
  }
});
client.queues = new Map();
client.player.extractors.register(YouTubeExtractor);
client.musicQueue = MusicQueue;

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
  try {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args[0].toLowerCase();

    if (command === 'test') {
      message.channel.send('ok!');
    }

    if (args.includes('anh') && args.includes('iu') && args.includes('em')) {
      prefixModule.yeu(message, prefix);
    }

    if (command === 'play' || command === 'pl') {
      musicModule.playMusic(message, prefix);
    }

    if (command === 'pause' || command === 'p') {
      musicModule.pause(message);
    }

    if (command === 'resume' || command === 'r') {
      musicModule.resume(message);
    }

    if (command === 'stop' || command === 'st') {
      musicModule.stop(message);
    }

  } catch (error) {
    console.error('Có lỗi xảy ra khi gửi lệnh prefix!', error);
  }
});

client.on('messageCreate', async message => {
  try {
    if (!message.author.bot) {
      const userId = message.author.id;
      userStats.userMessages = userStats.userMessages || {};
      userStats.userExp = userStats.userExp || {};
      userStats.userLevels = userStats.userLevels || {};
      userStats.userCash = userStats.userCash || {};
      userStats.userMessages[userId] = (userStats.userMessages[userId] || 0) + 1;
      updateExp(userId);
      updateLevel(userId, message);
      updateCash(userId);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

async function updateExp(userId) {
  try {
    const expPerMessage = 10;
    let stats = await UserStat.findOneAndUpdate(
      { userId: userId },
      { $inc: { userExp: expPerMessage } },
      { upsert: true, new: true }
    );

    if (!stats) {
      stats = new UserStat({ userId: userId, userExp: expPerMessage });
    }

    await stats.save();
  } catch (error) {
    console.error('Error updating EXP:', error);
  }
}

async function updateLevel(userId, message = null) {
  if (message && message.guild) {
    try {
      let stats = await UserStat.findOne({ userId: userId });

      if (!stats) {
        stats = new UserStat({ userId: userId, userLevels: 0 });
      }

      const currentLevel = stats.userLevels || 0;
      const expPerLevel = Math.floor(10 * Math.pow(1.35, currentLevel));
      const messages = userStats.userMessages[userId] || 0;

      const newLevel = Math.floor(messages / expPerLevel);

      if (newLevel > currentLevel) {
        stats.userLevels = newLevel;
        await updateCash(userId);
        const channel = message.guild.channels.cache.get(testChannel);

        if (channel) {
          channel.send(`Chúc mừng <@${userId}>, đã đạt cấp độ **${newLevel}**!`);
        }
      }

      await stats.save();
    } catch (error) {
      console.error('Error updating level:', error);
    }
  }
}

async function updateCash(userId) {
  try {
    let stats = await UserStat.findOne({ userId: userId });

    if (stats) {
      const currentLevel = stats.userLevels || 0;
      stats.userCash = stats.userCash || 0;
      userStats.lastLevel = userStats.lastLevel || {};
      userStats.lastLevel[userId] = userStats.lastLevel[userId] || 0;

      if (currentLevel > userStats.lastLevel[userId]) {
        const levelBonusBase = 100;
        const bonusPercentage = 0.2;
        const levelBonus = levelBonusBase * Math.pow(1 + bonusPercentage, currentLevel);
        stats.userCash += levelBonus;
        userStats.lastLevel[userId] = currentLevel;
        await stats.save();
      }
    }
  } catch (error) {
    console.error('Error updating cash:', error);
  }
}

(async () => {
  try {
    await mongoose.connect(mongoosedbURI);
    console.log("đã kết nối với database");
    client.login(token);
  } catch (error) {
    console.log(`error: ${error}`);
  }
})();
