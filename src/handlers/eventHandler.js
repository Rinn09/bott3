const path = require('path');
const fs = require('fs');
const Logger = require('../utils/logger');

class EventHandler {
  constructor(client) {
    this.client = client;
    // map để lưu tên event đã được đăng ký (nếu cần xóa, tái đăng ký)
    this.eventMap = new Map();
    this.watchEvents();
  }

  async loadEvents() {
    try {
      const eventsPath = path.join(__dirname, '..', 'events');
      const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
      let loadedCount = 0;

      // Xóa tất cả các listener đã đăng ký từ trước để tránh đăng ký lặp lại
      for (const [eventName] of this.eventMap) {
        this.client.removeAllListeners(eventName);
      }
      this.eventMap.clear();

      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        // Xóa cache để load phiên bản mới nhất của file khi reload
        delete require.cache[require.resolve(filePath)];
        const event = require(filePath);

        if ('name' in event && typeof event.execute === 'function') {
          if (event.once) {
            this.client.once(event.name, (...args) => {
              try {
                event.execute(...args);
              } catch (err) {
                Logger.error(`Error executing event ${event.name}: ${err?.message || err}`);
              }
            });
          } else {
            this.client.on(event.name, (...args) => {
              try {
                event.execute(...args);
              } catch (err) {
                Logger.error(`Error executing event ${event.name}: ${err?.message || err}`);
              }
            });
          }
          Logger.info(`Loaded event: ${event.name}`);
          this.eventMap.set(event.name, event);
          loadedCount++;
        } else {
          Logger.warn(`Event at ${filePath} missing required 'name' or 'execute' properties.`);
        }
      }
      Logger.info(`Total ${loadedCount} events loaded.`);
    } catch (error) {
      Logger.error('Error loading events:', error);
      throw error;
    }
  }

  // Giám sát thay đổi file trong thư mục events để tự động reload
  watchEvents() {
    const eventsDir = path.join(__dirname, '..', 'events');
    fs.watch(eventsDir, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        Logger.info(`Event file ${filename} changed (${eventType}). Reloading events...`);
        // Dùng debounce cơ bản: reload sau 100ms
        setTimeout(() => {
          this.loadEvents()
            .then(() => Logger.info('Events reloaded successfully.'))
            .catch(err => Logger.error('Error reloading events:', err));
        }, 100);
      }
    });
  }
}

module.exports = EventHandler;