module.exports = {
  nodes: [
    {
      name: 'main',
      url: `${process.env.LAVALINK_HOST || 'localhost'}:${parseInt(process.env.LAVALINK_PORT, 10) || 2333}`,
      auth: process.env.LAVALINK_PASSWORD || '...',
      secure: process.env.LAVALINK_SECURE === 'true',
      retryAttempts: 5,
      retryDelay: 1000,
    },
  ],
};