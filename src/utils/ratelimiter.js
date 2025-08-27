class RateLimiter {
  constructor({ limit = 5, windowMs = 3000 } = {}) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.store = new Map(); // key -> [timestamps]
  }
  consume(key) {
    const now = Date.now();
    const arr = this.store.get(key) || [];
    const fresh = arr.filter((t) => now - t < this.windowMs);
    if (fresh.length >= this.limit) {
      const retryAfterMs = this.windowMs - (now - fresh[0]);
      this.store.set(key, fresh);
      return { ok: false, retryAfterMs };
    }
    fresh.push(now);
    this.store.set(key, fresh);
    return { ok: true, retryAfterMs: 0 };
  }
}

module.exports = new RateLimiter({ limit: 5, windowMs: 3000 });
