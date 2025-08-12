// src/commands/utility/diag.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

function statusIcon(ok) {
  return ok ? "🟢" : "🔴";
}
function human(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return `${h}h ${m}m ${s}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("diag")
    .setDescription("Chẩn đoán nhanh trạng thái bot, MongoDB, Lavalink"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Discord
    const ping = interaction.client.ws.ping ?? 0;
    const guilds = interaction.client.guilds.cache.size;
    const up = human(process.uptime() * 1000);

    // Mongo status
    let mongoState = "disconnected",
      mongoOk = false,
      mongoPing = "N/A";
    try {
      const stateMap = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      };
      mongoState =
        stateMap[mongoose.connection.readyState] ||
        String(mongoose.connection.readyState);
      const t0 = Date.now();
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        mongoOk = true;
        mongoPing = `${Date.now() - t0}ms`;
      } else {
        mongoOk = false;
      }
    } catch {
      mongoOk = false;
    }

    // Lavalink / Shoukaku status (best-effort)
    let llText = "Not attached";
    try {
      const shoukaku =
        interaction.client.shoukaku ||
        interaction.client.music?.shoukaku ||
        global.shoukaku ||
        null;

      if (shoukaku?.nodes) {
        const nodes = shoukaku.nodes; // Map or array depending on version
        const entries = Array.isArray(nodes)
          ? nodes
          : nodes instanceof Map
            ? Array.from(nodes.values())
            : Object.values(nodes);

        if (entries.length > 0) {
          llText = entries
            .map((n) => {
              const name = n.name || n.identifier || "node";
              const state =
                n.state || n.stats || n.connection?.state || "unknown";
              return `${name}: ${JSON.stringify(state)}`;
            })
            .join("\n");
        } else {
          llText = "No nodes";
        }
      }
    } catch (e) {
      llText = `Error: ${e.message}`;
    }

    const embed = new EmbedBuilder()
      .setTitle("🧪 Bot Diagnostics")
      .addFields(
        {
          name: "Discord",
          value: `${statusIcon(true)} Ping: **${ping}ms**\nGuilds: **${guilds}**\nUptime: **${up}**`,
          inline: false,
        },
        {
          name: "MongoDB",
          value: `${statusIcon(mongoOk)} State: **${mongoState}**\nPing: **${mongoPing}**`,
          inline: false,
        },
        { name: "Lavalink", value: llText || "N/A", inline: false },
      )
      .setFooter({ text: `Node ${process.version}` })
      .setTimestamp(Date.now());

    return interaction.editReply({ embeds: [embed] });
  },
};
