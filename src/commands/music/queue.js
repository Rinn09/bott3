// src/commands/music/queue.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Hiển thị hàng chờ nhạc hiện tại."),
  async execute(interaction) {
    const { client } = interaction;
    const player = client.lavalink?.shoukaku?.players.get(interaction.guildId);

    if (!player || (player.queue.length === 0 && !player.playing)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFFF00")
            .setDescription("📪 Hàng chờ hiện đang trống."),
        ],
        ephemeral: true,
      });
    }

    const queue = player.queue;
    const currentTrack = player.track; // Track đang phát

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🎵 Hàng Chờ Nhạc");

    if (currentTrack) {
      embed.addFields({
        name: "▶️ Đang phát",
        value: `[${currentTrack.info.title}](${currentTrack.info.uri}) - \`${client.lavalink.formatDuration(currentTrack.info.length)}\``,
      });
    }

    // Hiển thị các bài hát tiếp theo. Shoukaku queue[0] là bài đang phát nếu có.
    const upcomingTracks = player.playing ? queue.slice(1) : queue.slice(0);

    if (upcomingTracks.length > 0) {
      const trackList = upcomingTracks
        .slice(0, 10) // Hiển thị tối đa 10 bài
        .map(
          (track, index) =>
            `${index + 1}. [${track.info.title}](${track.info.uri}) - \`${client.lavalink.formatDuration(track.info.length)}\``,
        )
        .join("\n");
      embed.addFields({
        name: `🎶 Tiếp theo (${upcomingTracks.length} bài)`,
        value: trackList.substring(0, 1020) || "Không có bài nào.",
      });
    } else if (currentTrack) {
      embed.addFields({
        name: "🎶 Tiếp theo",
        value: "Không có bài nào trong hàng chờ.",
      });
    } else if (!currentTrack && queue.length === 0) {
      // Trường hợp rất hiếm khi player tồn tại nhưng không có track và queue rỗng
      embed.setDescription("📪 Hàng chờ hiện đang trống.");
    }

    await interaction.reply({ embeds: [embed] });
  },
};
