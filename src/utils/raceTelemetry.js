// src/utils/raceTelemetry.js
const fs = require("fs");
const path = require("path");
const Logger = require("./logger");

const TRACE_ON = process.env.RACE_TRACE === "1";
const TO_DB = process.env.RACE_LOG_TO_DB === "1";

let RaceLogModel = null;
if (TO_DB) {
  try {
    RaceLogModel = require("../models/RaceLog");
  } catch {}
}

function ensureDir() {
  const base =
    process.env.RACE_TELEMETRY_DIR || path.join(process.cwd(), "telemetry");
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return base;
}
function writeJSON(name, data) {
  if (!TRACE_ON) return;
  const file = path.join(ensureDir(), name);
  fs.writeFile(file, JSON.stringify(data, null, 2), () => {});
}

function start(ctx) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = { ...ctx, id, t0: Date.now() };
  Logger.info(
    `[Race] start id=${id} user=${ctx.userId} car=${ctx.carId} track=${ctx.track} seed=${ctx.seed}`,
  );
  writeJSON(`race-${id}-start.json`, payload);
  return { id, t0: payload.t0 };
}

function point(id, label, payload) {
  Logger.debug(`[Race] ${id} :: ${label}`);
  writeJSON(`race-${id}-${label}.json`, { id, label, ...payload });
}

async function finish(id, summary) {
  Logger.info(
    `[Race] finish id=${id} place=${summary?.placement} time=${summary?.totalTimeMs}ms`,
  );
  writeJSON(`race-${id}-finish.json`, { id, ...summary });
  if (TO_DB && RaceLogModel) {
    try {
      await RaceLogModel.create({
        guildId: summary.guildId,
        userId: summary.userId,
        carId: summary.carId,
        track: summary.track,
        seed: summary.seed,
        weather: summary.weather,
        stats0: summary.stats0,
        stats1: summary.stats1,
        lapTimes: summary.lapTimes || [],
        placement: summary.placement,
        reward: summary.reward,
        wearDelta: summary.wearDelta,
        at: new Date(),
      });
    } catch (e) {
      Logger.warn(`[Race] write RaceLog to DB failed: ${e.message}`);
    }
  }
}

module.exports = { start, point, finish };
