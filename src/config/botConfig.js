module.exports = {
  intents: [
    'Guilds',
    'GuildVoiceStates',
    'GuildMessages',
    'MessageContent',
    'GuildMembers',
    'DirectMessages'
  ],
  prefix: '!',
  defaultCooldown: 3000,
  debug: process.env.NODE_ENV === 'development'
};