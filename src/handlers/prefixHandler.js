
const GuildConfig = require('../models/GuildConfig');
const botConfig = require('../config/botConfig');

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
  'so_du': ['sd'],
  'daily': ['dl'],
  'work': ['wk'],
  'chuyen_tien': ['ct'],
  'bank': ['bk'],
  'top-money': ['tm'],
  'level-reward': ['lr'],
  'level': ['lv'],
  'nhan_luong': ['nl'],
  'nhan_viec': ['nv'],
  'nghi_viec': ['ngv'],
  'rank': ['rk'],
  'cong_viec_hien_tai': ['cvht'],
  'cac_cong_viec': ['ccv'],
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

    const argsText = message.content.slice(prefix.length).trim();
    const firstSpace = argsText.indexOf(' ');
    const commandName = (firstSpace === -1 ? argsText : argsText.slice(0, firstSpace)).toLowerCase();
    const optionsText = firstSpace === -1 ? '' : argsText.slice(firstSpace + 1);

    if (commandName.startsWith('setup-') || ['change-prefix', 'refreshcommands', 'disablecommands'].includes(commandName)) {
      return message.reply('❌ Lệnh này chỉ dùng được bằng slash command!');
    }

    // Tìm lệnh gốc
    const realCommand = [...client.commands.values()].find(cmd => {
      return (
        cmd.data.name === commandName ||
        (commandAliases[cmd.data.name] && commandAliases[cmd.data.name].includes(commandName))
      );
    });

    if (!realCommand) return;

    // Tách các phần bắt đầu bằng '!' → phân tích option
    const rawParts = optionsText.split(/(?=\s*!)/g).map(p => p.trim()).filter(Boolean);
    const rawOptions = rawParts.map(part => part.replace(/^!/, '').trim());

    const fakeInteraction = {
      guild: message.guild,
      channel: message.channel,
      user: message.author,
      member: message.member,
      client: client,
      reply: (data) => message.reply(data),
      options: {
        getString: (index = 0) => rawOptions[index] || null,
        getInteger: (index = 0) => {
          const val = parseInt(rawOptions[index]);
          return isNaN(val) ? null : val;
        },
        getUser: (index = 0) => {
          const mention = message.mentions.members.at(index);
          return mention?.user || null;
        },
        getMember: (index = 0) => {
          return message.mentions.members.at(index) || null;
        },
        get: (index = 0) => rawOptions[index] || null
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