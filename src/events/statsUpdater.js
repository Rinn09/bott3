const GuildConfig = require('../models/GuildConfig');

async function updateStats(guild) {
  const config = await GuildConfig.findOne({ guildId: guild.id });
  if (!config || !config.statsChannels) return;

  await guild.members.fetch();

  const total = guild.memberCount;
  const bots = guild.members.cache.filter(m => m.user.bot).size;

  const online = guild.presences.cache.filter(p =>
    !p.user?.bot && ['online', 'idle', 'dnd'].includes(p.status)
  ).size;

  const totalChan = guild.channels.cache.get(config.statsChannels.total);
  const onlineChan = guild.channels.cache.get(config.statsChannels.online);
  const botsChan = guild.channels.cache.get(config.statsChannels.bots);

  console.log('[STATS] Updating stats for guild:', guild.name);
  console.log('totalChan:', totalChan?.name, 'onlineChan:', onlineChan?.name, 'botsChan:', botsChan?.name);
  console.log('Values: total =', total, ', online =', online, ', bots =', bots);

  if (totalChan) totalChan.setName(`👥 Thành viên: ${total}`).catch(() => {});
  if (onlineChan) onlineChan.setName(`🟢 Online: ${online}`).catch(() => {});
  if (botsChan) botsChan.setName(`🤖 Bot: ${bots}`).catch(() => {});
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    for (const [_, guild] of client.guilds.cache) {
      await guild.members.fetch();
      updateStats(guild);
    }

    // Cập nhật mỗi 5 phút
    setInterval(() => {
      for (const [_, guild] of client.guilds.cache) {
        updateStats(guild);
      }
    }, 5 * 60 * 1000);

    // Cập nhật khi member join/leave
    client.on('guildMemberAdd', member => updateStats(member.guild));
    client.on('guildMemberRemove', member => updateStats(member.guild));
    client.on('presenceUpdate', (_, newPresence) => {
      const guild = newPresence.guild;
      if (guild) updateStats(guild);
    });
  }
};
