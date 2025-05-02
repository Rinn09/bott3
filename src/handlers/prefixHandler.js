
const GuildConfig = require('../models/GuildConfig');
const botConfig = require('../config/botConfig');

// Bản đồ alias cho các lệnh
const commandAliases = {
  'server-info': ['si'],
  'user-info': ['ui'],
  'help': ['h'],
  'clear': ['cl'],
  'ping': ['p'],
  'avatar': ['av'],
  'addrole': ['ar'],
  'removerole': ['rr'],
  'roleinfo': ['ri'],
  'createrole': ['cr'],
  'deleterole': ['dr'],
  'lock': ['l'],
  'unlock': ['ul'],
  'mute': ['m'],
  'kick': ['k'],
  'ban': ['b'],
  'unban': ['ub'],
  'status': ['s'],
  'list-bans': ['lb'],
  'search': ['sr'],
};

const prefixCache = new Map();

module.exports = (client) => {
  client.prefixCache = prefixCache;

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    let prefix = prefixCache.get(message.guild.id);
    if (!prefix) {
      const config = await GuildConfig.findOne({ guildId: message.guild.id });
      prefix = config?.prefix || botConfig.prefix || '!';
      prefixCache.set(message.guild.id, prefix);
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (commandName.startsWith('setup-') || ['change-prefix', 'refreshcommands', 'disablecommands'].includes(commandName)) {
      return message.reply('❌ Lệnh này chỉ dùng được bằng slash command!');
    }

    const realCommand = [...client.commands.values()].find(cmd => {
      return (
        cmd.data.name === commandName ||
        (commandAliases[cmd.data.name] && commandAliases[cmd.data.name].includes(commandName))
      );
    });

    if (!realCommand) return;

    const fakeInteraction = {
      guild: message.guild,
      channel: message.channel,
      user: message.author,
      member: message.member,
      client: client,
      reply: (data) => message.reply(data),
      options: {
        getUser: () => null,
        getInteger: () => parseInt(args[0]) || null,
        getString: () => args.join(' ') || null,
        getChannel: () => null,
        getMember: () => null
      }
    };

    try {
      await realCommand.execute(fakeInteraction, client);
    } catch (err) {
      console.error('[PREFIX ERROR]', err);
      message.reply('❌ Đã xảy ra lỗi khi thực thi lệnh.');
    }
  });
};