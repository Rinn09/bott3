const { Manager } = require("erela.js");

module.exports = (client) => {
  client.manager = new Manager({
    nodes: [
      {
        host: "localhost",
        port: 2333,
        password: "1234",
      },
    ],
    send: (id, payload) => {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  });

  client.manager.on("nodeConnect", node => {
    console.log(`Node "${node.options.identifier}" connected.`);
  });

  client.manager.on("nodeError", (node, error) => {
    console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}.`);
  });

  client.manager.on("trackStart", (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send(`Now playing: \`${track.title}\``);
  });

  client.manager.on("queueEnd", player => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send("Queue has ended.");
    player.destroy();
  });
};
