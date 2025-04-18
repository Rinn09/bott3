const path = require('path');
const fs = require('fs');
const { Logger } = require('../utils/logger');

class EventHandler {
  constructor(client) {
    this.client = client;
  }

  async loadEvents() {
    try {
      const eventsPath = path.join(__dirname, '..', 'events');
      const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
          this.client.once(event.name, (...args) => event.execute(...args));
        } else {
          this.client.on(event.name, (...args) => event.execute(...args));
        }
        Logger.info(`Loaded event: ${event.name}`);
      }
    } catch (error) {
      Logger.error('Error loading events:', error);
      throw error;
    }
  }
}

module.exports = { EventHandler };