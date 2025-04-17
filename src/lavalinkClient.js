const { Manager } = require("erela.js");

const manager = new Manager({
  nodes: [
    {
      host: "localhost", // hoặc "127.0.0.1"
      port: 2333,
      password: "1234", // mặc định trong application.yml
    },
  ],
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
});

module.exports = manager;
