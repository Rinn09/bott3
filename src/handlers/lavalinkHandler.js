const { Shoukaku, Connectors } = require('shoukaku');
const Logger = require('../utils/logger');

class LavalinkHandler {
  constructor(client) {
    this.client = client;
    this.shoukaku = null;
  }

  async initialize(config) {
    try {
      // Khởi tạo Shoukaku
      this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this.client), config.nodes);

      // Thêm các event listeners
      this.shoukaku.on('ready', (name) => {
        Logger.info(`Lavalink Node ${name} is ready!`);
      });

      this.shoukaku.on('error', (name, error) => {
        Logger.error(`Lavalink Node ${name} encountered an error:`, error);
      });

      this.shoukaku.on('close', (name, code, reason) => {
        Logger.warn(`Lavalink Node ${name} closed with code ${code}`, reason);
      });

      Logger.info('Lavalink handler initialized');
    } catch (error) {
      Logger.error('Error initializing Lavalink:', error);
      throw error;
    }
  }

  getNode() {
    const node = this.shoukaku.getNode();
    if (!node || !node.ready) {
      Logger.error('No Lavalink nodes are ready');
      return null;
    }
    return node;
  }

  async createPlayer(guildId, channelId, options = {}) {
    const node = this.getNode();
    if (!node) throw new Error('No available Lavalink nodes');

    return await node.joinChannel({
      guildId: guildId,
      channelId: channelId,
      shardId: 0,
      ...options
    });
  }
}

module.exports = LavalinkHandler;