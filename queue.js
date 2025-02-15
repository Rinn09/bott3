const { Player } = require('discord-player');

class MusicQueue {
    constructor() {
        this.queues = new Map();
    }

    getQueue(guildId) {
        return this.queues.get(guildId) || [];
    }

    addToQueue(guildId, song) {
        const queue = this.getQueue(guildId);
        queue.push(song);
        this.queues.set(guildId, queue);
    }

    clearQueue(guildId) {
        this.queues.set(guildId, []);
    }

    deleteQueue(guildId) {
        this.queues.delete(guildId);
    }
}

module.exports = new MusicQueue();
