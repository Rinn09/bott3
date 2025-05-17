require("dotenv").config();
module.exports = {
  resume: true,
  resumeTimeout: 30000,
  reconnectTries: 3,
  reconnectInterval: 5000,
  restTimeout: 15000,
  moveOnDisconnect: false,
  voiceConnectionTimeout: 15000,
  nodes: [
    {
      name: "localhost" || "lavalink-node",
      url: `${process.env.LAVALINK_HOST || "127.0.0.1"}:${process.env.LAVALINK_PORT || 2333}`,
      auth: process.env.LAVALINK_PASSWORD || "youshallnotpass",
      secure: false,
    },
  ],
};
