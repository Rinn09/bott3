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
      if (!node.host || !node.port) {
        Logger.error('Node host or port is missing');
        throw new Error('Node host or port is missing');
      }
      
      // Initialize Shoukaku with the validated config
      this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this.client), config.nodes);
  
      // Add event listeners
      this.shoukaku.on('ready', (name) => {
        Logger.info(`Lavalink Node ${name} is ready!`);
      });
  
      this.shoukaku.on('error', (name, error) => {
        Logger.error(`Lavalink Node ${name} encountered an error:`, error);
      });
  
      this.shoukaku.on('close', (name, code, reason) => {
        Logger.warn(`Lavalink Node ${name} closed with code ${code}`, reason);
      });
  
      // Return a Promise that resolves when ready or times out
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          const nodesArray = Array.from(this.shoukaku.nodes.values());
          Logger.info(`Node states after timeout: ${nodesArray.map(n => `${n.options?.name}=${n.state}`).join(', ')}`);
          resolve();
        }, 5000);
  
        this.shoukaku.on('ready', () => {
          clearTimeout(timeout);
          Logger.info('Lavalink connection established - resolving initialize');
          resolve();
        });
      });
    } catch (error) {
      Logger.error('Error initializing Lavalink:', error);
      throw error;
    }
  }

  getNode() {
    // First check if there are any nodes at all
    if (!this.shoukaku || !this.shoukaku.nodes || this.shoukaku.nodes.size === 0) {
      Logger.error('No Lavalink nodes exist');
      return null;
    }
    
    // Get all nodes
    const nodesArray = Array.from(this.shoukaku.nodes.values());
    
    // Log node details
    nodesArray.forEach(n => {
      const nodeName = n.options?.name || 'Unknown';
      Logger.info(`Node ${nodeName} state: ${n?.state}`);
      Logger.info(`Node ${nodeName} details: options=${JSON.stringify(n?.options || {})}`);
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