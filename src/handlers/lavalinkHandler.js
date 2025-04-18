const { Manager } = require('@lavaclient/discord');
const { Logger } = require('../utils/logger');

class LavalinkHandler {
  constructor(client) {
    this.client = client;
  }

  async initialize(config) {
    try {
      this.manager = new Manager({
        nodes: config.nodes,
        send: (id, payload) => {
          const guild = this.client.guilds.cache.get(id);
          if (guild) guild.shard.send(payload);
        }
      });

      this.manager.on('nodeConnect', node => {
        Logger.info(`Node ${node.options.identifier} connected`);
      });

      this.manager.on('nodeError', (node, error) => {
        Logger.error(`Node ${node.options.identifier} encountered an error:`, error);
      });

      await this.manager.init(this.client.user.id);
      Logger.info('Lavalink initialized successfully');
    } catch (error) {
      Logger.error('Error initializing Lavalink:', error);
      throw error;
    }
  }
}

module.exports = { LavalinkHandler };