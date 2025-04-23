const { Shoukaku, Connectors } = require('shoukaku');
const Logger = require('../utils/logger');

class LavalinkHandler {
  constructor(client) {
    this.client = client;
    this.shoukaku = null;
  }

  async initialize(config) {
    try {
      Logger.info('Initializing Lavalink with config:', JSON.stringify(config, null, 2));
      
      // Make sure config has valid nodes
      if (!config.nodes || config.nodes.length === 0) {
        Logger.error('No Lavalink nodes configured');
        throw new Error('No Lavalink nodes configured');
      }
      
      // Manually validate the first node
      const node = config.nodes[0];
      if (!node.url) {
        if (!node.host || !node.port) {
          Logger.error('Node host or port is missing');
          throw new Error('Node host or port is missing');
        }
        // Nếu cần tự tạo, có thể khởi tạo với protocol, nhưng nếu bạn cung cấp url trực tiếp thì không cần!
        // node.url = `${node.secure ? 'wss' : 'ws'}://${node.host}:${node.port}`;
      }
      
      // Initialize Shoukaku with the validated config
      try {
        this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this.client), config.nodes, {
          resume: true,
          reconnectTries: 5,
          reconnectInterval: 3000
        });
      } catch (err) {
        Logger.error(`Failed to create Shoukaku instance: ${err.message}`, err);
        throw err;
      }
      
      // Add event listeners with better error handling
      this.shoukaku.on('ready', (name) => {
        Logger.info(`Lavalink Node ${name} is ready!`);
      });
      this.shoukaku.on('error', (name, error) => {
        Logger.error(`Lavalink Node ${name} encountered an error:`, error);
      });
      this.shoukaku.on('close', (name, code, reason) => {
        Logger.warn(`Lavalink Node ${name} closed with code ${code}`, reason);
      });
      this.shoukaku.on('disconnect', (name, reason) => {
        Logger.warn(`Lavalink Node ${name} disconnected:`, reason);
      });
      
      // Return a Promise that resolves when ready or times out
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          const nodesArray = Array.from(this.shoukaku.nodes.values() || []);
          Logger.info(`Nodes count: ${nodesArray.length}`);
          Logger.info(`Node states after timeout: ${nodesArray.map(n => `${n.options?.name}=${n.state}`).join(', ') || 'No nodes'}`);
          resolve();
        }, 5000);
    
        this.shoukaku.on('ready', () => {
          clearTimeout(timeout);
          Logger.info('Lavalink connection established - resolving initialize');
          resolve();
        });
      });
    } catch (error) {
      Logger.error(`Error initializing Lavalink: ${error.message}`);
      Logger.error(error.stack);
      throw error;
    }
  }

  getNode() {
    try {
      // First check if there are any nodes at all
      if (!this.shoukaku || !this.shoukaku.nodes || this.shoukaku.nodes.size === 0) {
        Logger.error('No Lavalink nodes exist');
        return null;
      }
      
      // Get all nodes
      const nodesArray = Array.from(this.shoukaku.nodes.values());
      Logger.info(`Found ${nodesArray.length} nodes`);
      
      // Log node details
      nodesArray.forEach(n => {
        const nodeName = n.options?.name || 'Unknown';
        Logger.info(`Node ${nodeName} state: ${n?.state}`);
        Logger.info(`Node ${nodeName} details: ${JSON.stringify({
          connected: !!n.connected,
          state: n.state,
          name: n.options?.name
        })}`);
      });
      
      // For Shoukaku v2 or later, the state might be numeric
      // 0 = CONNECTING, 1 = DISCONNECTED, 2 = CONNECTED
      let node = nodesArray.find(n => n?.state === 2 || n?.state === 'CONNECTED');
      
      if (!node) {
        Logger.error('No Lavalink nodes are ready');
        return null;
      }
      
      Logger.info(`Selected node ${node.options?.name || 'Unknown'} with state: ${node.state}`);
      return node;
    } catch (error) {
      Logger.error(`Error in getNode: ${error.message}`);
      return null;
    }
  }

  async createPlayer(guildId, channelId, options = {}) {
    try {
      const node = this.getNode();
      if (!node) {
        Logger.error('No available Lavalink nodes for createPlayer');
        throw new Error('No available Lavalink nodes');
      }

      Logger.info(`Creating player for guild ${guildId} in channel ${channelId}`);
      return await node.joinChannel({
        guildId: guildId,
        channelId: channelId,
        shardId: 0,
        ...options
      });
    } catch (error) {
      Logger.error(`Error creating player: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LavalinkHandler;