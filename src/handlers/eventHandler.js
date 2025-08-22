// src/handlers/eventHandler.js
const path = require("path");
const fs = require("fs");
const Logger = require("../utils/logger");

class EventHandler {
  constructor(client) {
    this.client = client;
    // Map<eventName, handlerFn> để có thể .off() chính xác
    this.eventMap = new Map();
    this._watchTimer = null;
    this.watchEvents(); // chỉ gắn watcher; nhớ gọi loadEvents() lúc khởi động
  }

  async loadEvents() {
    try {
      const eventsPath = path.join(__dirname, "..", "events");
      const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((f) => f.endsWith(".js"));

      // Gỡ các listener cũ do chính handler này đăng ký
      for (const [eventName, handler] of this.eventMap) {
        this.client.off(eventName, handler);
      }
      this.eventMap.clear();

      let loaded = 0;
      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        delete require.cache[require.resolve(filePath)];
        let event;
        try {
          event = require(filePath);
        } catch (e) {
          Logger.warn(`Event require failed ${filePath}: ${e.message}`);
          continue;
        }

        if (!event?.name || typeof event.execute !== "function") {
          Logger.warn(
            `Event at ${filePath} missing required 'name' or 'execute'`,
          );
          continue;
        }

        // Handler bao promise để bắt lỗi async
        const handler = (...args) => {
          // Nếu event.execute định nghĩa >= 2 tham số -> coi như (client, ...args)
          // Nếu chỉ 1 tham số -> coi như kiểu cũ (...args)
          const wantsClient = event.execute.length >= 2;
          const call = wantsClient
            ? () => event.execute(this.client, ...args)
            : () => event.execute(...args);

          return Promise.resolve(call()).catch((err) =>
            Logger.error(
              `Error executing event ${event.name}: ${err?.message || err}`,
            ),
          );
        };

        if (event.once) this.client.once(event.name, handler);
        else this.client.on(event.name, handler);

        this.eventMap.set(event.name, handler);
        Logger.info(`Loaded event: ${event.name}`);
        loaded++;
      }
      Logger.info(`Total ${loaded} events loaded.`);
    } catch (err) {
      Logger.error("Error loading events:", err);
      throw err;
    }
  }

  watchEvents() {
    const eventsDir = path.join(__dirname, "..", "events");

    // Debounce 300ms: gom nhiều thay đổi thành 1 lần reload
    const scheduleReload = () => {
      if (this._watchTimer) clearTimeout(this._watchTimer);
      this._watchTimer = setTimeout(() => {
        this._watchTimer = null;
        this.loadEvents()
          .then(() => Logger.info("Events reloaded successfully."))
          .catch((e) => Logger.error("Error reloading events:", e));
      }, 300);
    };

    // fs.watch có thể bắn 'rename' hoặc 'change' nhiều lần
    fs.watch(eventsDir, { persistent: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith(".js")) return;
      Logger.info(
        `Event file ${filename} changed (${eventType}). Reloading events...`,
      );
      scheduleReload();
    });
  }
}

module.exports = EventHandler;
