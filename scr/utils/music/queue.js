module.exports = class Queue {
  constructor() {
    this.tracks = [];
    this.volume = 1;
    this.loop = false;
    this.playing = false;
  }

  add(track) {
    this.tracks.push(track);
  }

  next() {
    return this.loop ? this.tracks[0] : this.tracks.shift();
  }

  clear() {
    this.tracks = [];
  }
};