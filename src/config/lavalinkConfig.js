module.exports = {
    nodes: [{
      id: process.env.LAVALINK_ID || "main",
      host: process.env.LAVALINK_HOST || "localhost",
      port: parseInt(process.env.LAVALINK_PORT) || 2333,
      password: process.env.LAVALINK_PASSWORD || "1234",
      secure: process.env.LAVALINK_SECURE === 'true' || false
    }]
  };