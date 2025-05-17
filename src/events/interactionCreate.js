const { InteractionType, EmbedBuilder } = require("discord.js");
const Logger = require("../utils/logger");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    const { client } = interaction;

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        Logger.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        try {
          await interaction.reply({
            content: `❌ Lệnh ${interaction.commandName} không tồn tại!`,
            ephemeral: true,
          });
        } catch (e) {
          Logger.error("Error replying to unknown command:", e);
        }
        return;
      }
      try {
        await command.execute(interaction); // Truyền client nếu lệnh cần
      } catch (error) {
        Logger.error(`Error executing ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "❌ Có lỗi khi thực thi lệnh này!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "❌ Có lỗi khi thực thi lệnh này!",
            ephemeral: true,
          });
        }
      }
      return; // Kết thúc sớm để không chạy code button bên dưới nếu là slash command
    }

    if (interaction.isButton()) {
      const { customId } = interaction;
      // Sửa dòng này:
      const lavalinkHandler = client.lavalinkHandler; // Lấy từ client instance

      // if (!lavalinkHandler || !lavalinkHandler.shoukaku) { // Không cần check shoukaku ở đây nữa, chỉ cần lavalinkHandler
      if (!lavalinkHandler) {
        Logger.warn(
          "LavalinkHandler not found on client in interactionCreate for button.",
        );
        if (customId.startsWith("music_")) {
          await interaction
            .reply({
              content: "⚠️ Hệ thống nhạc chưa được khởi tạo đúng cách.",
              ephemeral: true,
            })
            .catch(() => {});
        }
        return;
      }

      const player = lavalinkHandler.shoukaku?.players.get(interaction.guildId);

      if (!player) {
        if (customId.startsWith("music_")) {
          await interaction
            .reply({
              content:
                "⚠️ Bot hiện không phát nhạc trong server này hoặc player đã bị hủy.",
              ephemeral: true,
            })
            .catch(() => {});
        }
        return;
      }

      if (interaction.member.voice.channelId !== player.channelId) {
        if (customId.startsWith("music_")) {
          return interaction.reply({
            content:
              "🔊 Bạn cần ở trong cùng kênh thoại với bot để điều khiển nhạc.",
            ephemeral: true,
          });
        }
      }

      try {
        await interaction.deferUpdate();

        switch (customId) {
          case "music_toggle_play":
            if (player.paused) {
              await player.setPaused(false);
            } else {
              await player.setPaused(true);
            }
            // Player event 'pause' và 'resume' trong lavalinkHandler sẽ tự động cập nhật nút
            break;
          case "music_skip":
            if (player.track || player.queue.length > 0) {
              // Kiểm tra cả track đang phát
              await player.skip();
            } else {
              interaction
                .followUp({
                  content: "❌ Không có bài nào để bỏ qua.",
                  ephemeral: true,
                })
                .catch(() => {});
            }
            break;
          case "music_stop":
            player.queue.clear();
            await player.stopTrack();
            // Cân nhắc gọi leaveChannel nếu muốn bot rời ngay
            // await lavalinkHandler.shoukaku.leaveChannel(interaction.guildId);
            // nowPlayingMessage sẽ được xóa bởi event 'end' hoặc 'closed'
            break;
          case "music_queue":
            const queue = player.queue;
            const currentTrackDisplay = player.track;

            const queueEmbed = new EmbedBuilder()
              .setColor("#0099ff")
              .setTitle("🎵 Hàng Chờ Nhạc");

            let description = "";

            if (currentTrackDisplay) {
              description += `**▶️ Đang phát:** [${currentTrackDisplay.info.title}](${currentTrackDisplay.info.uri}) - \`${lavalinkHandler.formatDuration(currentTrackDisplay.info.length)}\`\n\n`;
            }

            const upcomingTracks = player.playing
              ? queue.slice(1)
              : queue.slice(0);

            if (upcomingTracks.length > 0) {
              description += "**🎶 Tiếp theo:**\n";
              description += upcomingTracks
                .slice(0, 10) // Giới hạn 10 bài
                .map(
                  (track, index) =>
                    `${index + 1}. [${track.info.title}](${track.info.uri}) - \`${lavalinkHandler.formatDuration(track.info.length)}\``,
                )
                .join("\n");
              if (upcomingTracks.length > 10) {
                description += `\n...và ${upcomingTracks.length - 10} bài khác.`;
              }
            } else if (currentTrackDisplay) {
              description += "Không có bài nào khác trong hàng chờ.";
            } else {
              description = "📪 Hàng chờ hiện đang trống.";
            }

            queueEmbed.setDescription(description.substring(0, 4090));

            await interaction.followUp({
              embeds: [queueEmbed],
              ephemeral: true,
            });
            break;
        }
      } catch (error) {
        Logger.error(`Lỗi xử lý button nhạc (${customId}): ${error.message}`, {
          stack: error.stack,
        });
      }
    }
  },
};
