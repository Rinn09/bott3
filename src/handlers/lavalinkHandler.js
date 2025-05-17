const Logger = require("../utils/logger");
const lavalinkConfig = require("../config/lavalinkConfig"); // Đảm bảo đường dẫn đúng
const { EmbedBuilder } = require("discord.js"); // Thêm EmbedBuilder
const { AttachmentBuilder } = require("discord.js");
const { createPlayerCard } = require("../utils/canvasPlayer");

const shoukakuImport = require("shoukaku");
console.log("--- Shoukaku Import Details ---");
console.log("Type of shoukakuImport:", typeof shoukakuImport);
console.log("Keys in shoukakuImport:", Object.keys(shoukakuImport));
if (shoukakuImport.Shoukaku) {
  console.log(
    "Type of shoukakuImport.Shoukaku (class):",
    typeof shoukakuImport.Shoukaku,
  );
  console.log(
    "Prototype of Shoukaku class:",
    Object.getOwnPropertyNames(shoukakuImport.Shoukaku.prototype),
  );
}
if (shoukakuImport.Connectors && shoukakuImport.Connectors.DiscordJS) {
  console.log(
    "Type of shoukakuImport.Connectors.DiscordJS (class):",
    typeof shoukakuImport.Connectors.DiscordJS,
  );
}
console.log("--- End Shoukaku Import Details ---");

const { Shoukaku, Connectors } = shoukakuImport;

class LavalinkHandler {
  constructor(client) {
    this.client = client;
    this.shoukaku = null;
    this.initialize();
  }

  initialize() {
    try {
      console.log("Type of Connectors.DiscordJS:", typeof Connectors.DiscordJS);
      console.log("Connectors.DiscordJS content:", Connectors.DiscordJS);
      const connector = new Connectors.DiscordJS(this.client);
      // console.log("Connector instance:", connector);
      this.shoukaku = new Shoukaku(
        new Connectors.DiscordJS(this.client),
        lavalinkConfig.nodes, // Chỉ truyền mảng nodes
        {
          // Các options của Shoukaku đặt ở đây
          resume: true,
          resumeTimeout: 30000,
          reconnectTries: 5,
          reconnectInterval: 5000,
          restTimeout: 15000,
          moveOnDisconnect: false,
          userAgent: `PerryDiscordBot (https://github.com/Rinn09/bott3, ${require("../../package.json").version})`,
          voiceConnectionTimeout: 15000,
        },
      );

      this.shoukaku.on("ready", (name, reconnected) =>
        Logger.info(
          `Lavalink Node: ${name} is ${reconnected ? "reconnected" : "ready"}.`,
        ),
      );

      this.shoukaku.on("error", (name, error) =>
        Logger.error(`Lavalink Node: ${name} encountered an error:`, error),
      );

      this.shoukaku.on("close", (name, code, reason) =>
        Logger.warn(
          `Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || "No reason"}`,
        ),
      );

      this.shoukaku.on("disconnect", (name, players, moved) => {
        if (moved) {
          Logger.warn(
            `Lavalink Node: ${name} disconnected; Gildan player moved to other node.`,
          );
        } else {
          Logger.warn(
            `Lavalink Node: ${name} disconnected; Player guild did not move.`,
          );
        }
      });

      this.shoukaku.on("debug", (name, info) => {
        if (process.env.LAVALINK_DEBUG === "true") {
          // Chỉ log debug nếu bật
          Logger.debug(`Lavalink Node: ${name} debug: ${info}`);
        }
      });

      // Thêm player events quan trọng
      this.shoukaku.on("playerCreate", (player) => {
        Logger.info(`Player created for guild ${player.guildId}`);
        console.log("playerCreate event triggered for guild:", player.guildId); // Add this line
        this.setupPlayerEventListeners(player);
      });
      /*
      if (this.shoukaku) {
        console.log("Shoukaku instance type:", typeof this.shoukaku);
        console.log(
          "Is shoukaku.getNode a function?",
          typeof this.shoukaku.getNode === "function",
        );
        if (typeof this.shoukaku.getNode !== "function") {
          console.error(
            "CRITICAL: shoukaku.getNode is NOT a function immediately after Shoukaku instantiation!",
          );
          console.log(
            "Available properties/methods on shoukaku instance:",
            Object.getOwnPropertyNames(this.shoukaku),
          );
          // Nếu shoukaku là một EventEmitter hoặc có cấu trúc khác, log thêm
          if (this.shoukaku.constructor && this.shoukaku.constructor.name) {
            console.log(
              "Constructor name of shoukaku instance:",
              this.shoukaku.constructor.name,
            );
          }
        }
      } else {
        console.error(
          "Shoukaku instance is null/undefined after instantiation!",
        );
      }
*/
      Logger.info("Shoukaku (Lavalink Handler) initialized.");
    } catch (error) {
      Logger.error("Failed to initialize Shoukaku (Lavalink Handler):", error);
    }
  }

  setupPlayerEventListeners(player) {
    player.on("start", async (data) => {
      const channel = this.client.channels.cache.get(player.textChannelId);
      if (channel) {
        const track = data.track;

        const cardBuffer = await createPlayerCard(track.info, 0); // Vị trí hiện tại ban đầu là 0
        const attachment = new AttachmentBuilder(cardBuffer, {
          name: "player-card.png",
        });

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          // .setTitle('▶️ Đang phát') // Có thể bỏ title nếu dùng ảnh
          // .setDescription(`[${track.info.title}](${track.info.uri})`)
          .setImage("attachment://player-card.png") // Gắn ảnh
          .setFooter({
            text: `Yêu cầu bởi: ${track.info.requester || "Không rõ"}`,
          });

        const message = await channel
          .send({
            embeds: [embed],
            files: [attachment],
            components: this.createPlayerButtons(player, false),
          })
          .catch((e) =>
            Logger.error("Failed to send 'start' message with canvas:", e),
          );

        if (message) {
          player.nowPlayingMessage = message;
          player.isPaused = false;

          // Cập nhật thanh tiến trình định kỳ
          if (player.updateInterval) clearInterval(player.updateInterval);
          player.updateInterval = setInterval(async () => {
            if (
              player.playing &&
              !player.paused &&
              player.nowPlayingMessage &&
              player.track
            ) {
              try {
                const currentTrackInfo = player.track.info; // Lấy info của track hiện tại
                const currentPosition = player.position; // Thời gian hiện tại của bài hát
                const newCardBuffer = await createPlayerCard(
                  currentTrackInfo,
                  currentPosition,
                  player.paused,
                );
                const newAttachment = new AttachmentBuilder(newCardBuffer, {
                  name: "player-card.png",
                });
                const newEmbed = new EmbedBuilder()
                  .setColor(player.paused ? "#FFA500" : "#00FF00")
                  .setImage("attachment://player-card.png")
                  .setFooter({
                    text: `Yêu cầu bởi: ${currentTrackInfo.requester || "Không rõ"}`,
                  });

                await player.nowPlayingMessage.edit({
                  embeds: [newEmbed],
                  files: [newAttachment],
                  components: this.createPlayerButtons(player, player.paused),
                });
              } catch (updateError) {
                Logger.error(
                  `Error updating player card for guild ${player.guildId}: ${updateError.message}`,
                );
                // Có thể dừng interval nếu lỗi nhiều lần
              }
            } else if (!player.playing && player.updateInterval) {
              clearInterval(player.updateInterval);
              player.updateInterval = null;
            }
          }, 5000); // Cập nhật mỗi 5 giây
        }
      }
    });

    player.on("end", async (data) => {
      if (player.updateInterval) {
        clearInterval(player.updateInterval);
        player.updateInterval = null;
      }
      if (player.nowPlayingMessage) {
        await player.nowPlayingMessage.delete().catch(() => {});
        player.nowPlayingMessage = null;
      }
      if (data.reason === "REPLACED") return; // Không làm gì nếu bài hát được thay thế (vd: skip)

      // Tự động phát bài tiếp theo nếu có
      if (player.queue.length > 0) {
        // Player của Shoukaku tự xử lý queue, không cần play() ở đây
        // Nếu bạn có logic auto-leave khi queue rỗng, bạn sẽ thêm ở đây hoặc trong 'queueEnd'
      } else {
        // Queue rỗng
        const channel = this.client.channels.cache.get(player.textChannelId);
        if (channel) {
          channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor("#FFFF00")
                  .setDescription(
                    "✅ Hàng chờ đã hết. Bot sẽ sớm rời kênh thoại.",
                  ),
              ],
            })
            .then((msg) =>
              setTimeout(() => msg.delete().catch(() => {}), 15000),
            ); // Tự xóa sau 15s
        }
        // Logic tự động rời kênh thoại sau một khoảng thời gian nếu không có gì phát
        setTimeout(() => {
          if (
            player.queue.length === 0 &&
            !player.playing &&
            player.connected
          ) {
            // node.leaveChannel(player.guildId); // Shoukaku tự xử lý destroy player
            Logger.info(
              `Player for guild ${player.guildId} left due to inactivity.`,
            );
          }
        }, 60000); // Ví dụ: 1 phút
      }
    });

    player.on("exception", (error) => {
      const channel = this.client.channels.cache.get(player.textChannelId);
      if (channel) {
        channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setDescription(
                  `❌ Có lỗi xảy ra khi phát bài: ${error.exception?.message || "Lỗi không xác định"}`,
                ),
            ],
          })
          .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 15000));
      }
      Logger.error(
        `Player for guild ${player.guildId} encountered an exception:`,
        error,
      );
    });

    player.on("stuck", (data) => {
      const channel = this.client.channels.cache.get(player.textChannelId);
      if (channel) {
        channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFA500")
                .setDescription(
                  "⚠️ Bài hát bị kẹt, đang thử phát lại hoặc bỏ qua...",
                ),
            ],
          })
          .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 10000));
      }
      Logger.warn(
        `Player for guild ${player.guildId} got stuck. Threshold: ${data.thresholdMs}ms`,
      );
      player.skip(); // Bỏ qua bài bị kẹt
    });

    player.on("resumed", () => {
      Logger.info(`Player for guild ${player.guildId} resumed.`);
      // Cập nhật UI nếu cần
      if (player.nowPlayingMessage) {
        player.nowPlayingMessage
          .edit({ components: this.createPlayerButtons(player, false) })
          .catch(() => {});
      }
    });

    player.on("pause", (isPaused) => {
      // Shoukaku v4: isPaused là boolean, v3 là object event data
      Logger.info(
        `Player for guild ${player.guildId} ${player.paused ? "paused" : "resumed"}.`,
      );
      if (player.nowPlayingMessage) {
        player.nowPlayingMessage
          .edit({ components: this.createPlayerButtons(player, player.paused) }) // Dùng player.paused
          .catch(() => {});
      }
    });

    player.on("closed", (data) => {
      Logger.warn(
        `Player for guild ${player.guildId} connection closed. Code: ${data.code}, Reason: ${data.reason}, By Remote: ${data.byRemote}`,
      );
      if (player.nowPlayingMessage) {
        player.nowPlayingMessage.delete().catch(() => {});
        player.nowPlayingMessage = null;
      }
      // Có thể cần dọn dẹp queue hoặc player instance ở đây nếu Shoukaku không tự làm
      // Shoukaku thường tự động dọn dẹp khi disconnect
    });
  }

  // Helper định dạng thời gian
  formatDuration(ms) {
    if (!ms || !isFinite(ms) || ms <= 0)
      return "Live Stream hoặc không xác định";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0)
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // Helper tạo các nút điều khiển
  createPlayerButtons(player, isPaused) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("music_toggle_play")
        .setLabel(isPaused ? "▶️ Phát tiếp" : "⏸️ Tạm dừng")
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("music_skip")
        .setLabel("⏭️ Bỏ qua")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(player.queue.length === 0 && !player.playing), // Disable nếu không có gì để skip
      new ButtonBuilder()
        .setCustomId("music_stop")
        .setLabel("⏹️ Dừng hẳn")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("music_queue")
        .setLabel("📜 Hàng chờ")
        .setStyle(ButtonStyle.Secondary),
    );
    return [row];
  }

  getNode() {
    if (!this.shoukaku) {
      Logger.error(
        "Shoukaku is not initialized in LavalinkHandler when trying to getNode.",
      );
      return null;
    }

    const idealNode = this.shoukaku.getIdealNode();

    // Kiểm tra xem idealNode có thực sự 'CONNECTED' (state 1) không
    if (idealNode && idealNode.state === 1) {
      // STATE 1 LÀ CONNECTED
      // Logger.info(`Using ideal node: ${idealNode.name}, state: ${idealNode.state}`);
      return idealNode;
    }

    // Nếu idealNode không có hoặc không ở trạng thái CONNECTED, thử tìm node khác
    Logger.warn(
      `Ideal node "${idealNode?.name}" is not in CONNECTED state (current state: ${idealNode?.state}). Looking for alternatives.`,
    );
    if (this.shoukaku.nodes.size > 0) {
      for (const node of this.shoukaku.nodes.values()) {
        if (node.state === 1) {
          // STATE 1 LÀ CONNECTED
          Logger.warn(
            `Falling back to the first available connected node: ${node.name}, state: ${node.state}`,
          );
          return node;
        }
      }
      Logger.warn("No nodes currently in CONNECTED state found in fallback.");
      return null; // Không có node nào connected
    }
    Logger.warn("No nodes in shoukaku.nodes map to fallback to.");
    return null;
  }
}

module.exports = LavalinkHandler;
