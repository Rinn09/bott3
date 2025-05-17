// src/commands/music/play.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Phát nhạc từ YouTube hoặc Spotify, hoặc tìm kiếm bài hát.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Link YouTube/Spotify hoặc tên bài hát để tìm kiếm.")
        .setRequired(true),
    ),

  async execute(interaction) {
    const lavalinkHandler = interaction.client.lavalinkHandler;
    console.log("--- DEBUG LOGS IN /play COMMAND ---");
    if (lavalinkHandler) {
      console.log("typeof lavalinkHandler:", typeof lavalinkHandler);
      // Kiểm tra xem lavalinkHandler có phải là instance của class bạn định nghĩa không
      // Bạn cần require class LavalinkHandler ở đầu file play.js CHỈ để dùng instanceof cho debug
      const LavalinkHandlerClass = require("../../handlers/lavalinkHandler"); // CHỈ DÙNG CHO DEBUG NÀY
      console.log(
        "lavalinkHandler instanceof LavalinkHandlerClass:",
        lavalinkHandler instanceof LavalinkHandlerClass,
      );

      if (lavalinkHandler.shoukaku) {
        console.log(
          "typeof lavalinkHandler.shoukaku:",
          typeof lavalinkHandler.shoukaku,
        );
        console.log(
          "lavalinkHandler.shoukaku.getNode type:",
          typeof lavalinkHandler.shoukaku.getNode,
        );
      } else {
        console.error(
          "!!! lavalinkHandler.shoukaku is undefined or null in play.js !!!",
        );
      }
    } else {
      console.error(
        "!!! interaction.client.lavalinkHandler is undefined in play.js !!!",
      );
    }

    console.log("--- END DEBUG LOGS ---");
    if (!lavalinkHandler || !lavalinkHandler.shoukaku) {
      return interaction.reply({
        content: "⚠️ Hệ thống nhạc chưa sẵn sàng, vui lòng thử lại sau.",
        ephemeral: true,
      });
    }

    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "🔊 Bạn cần phải ở trong một kênh thoại để phát nhạc!",
        ephemeral: true,
      });
    }

    const node = lavalinkHandler.getNode();
    // ---- DEBUG LOGS CHO NODE (CÓ THỂ GIỮ LẠI HOẶC XÓA SAU KHI FIX) ----
    console.log("--- DEBUG: NODE INFO IN /play ---");
    if (node) {
      console.log("Node object obtained:", node);
      console.log("Node name:", node.name);
      console.log("Node URL:", node.url);
      console.log("Node state (node.state):", node.state); // 0: CONNECTING, 1: CONNECTED, 2: DISCONNECTING, 3: DISCONNECTED
      console.log(
        "Is node actually connected (internal ws readyState)?",
        node.ws?.readyState === 1,
      ); // ws.readyState === 1 (OPEN) là một dấu hiệu tốt
    } else {
      console.error(
        "!!! Node object is NULL after lavalinkHandler.getNode() !!!",
      );
    }
    console.log("--- END DEBUG: NODE INFO ---");
    // ---- KẾT THÚC DEBUG LOGS ----

    // SỬA ĐIỀU KIỆN KIỂM TRA NODE
    if (!node || node.state !== 1) {
      // THAY ĐỔI Ở ĐÂY: node.state === 1 (CONNECTED)
      Logger.warn(
        `Lavalink node not available or not in CONNECTED state. Node state: ${node ? node.state : "null"}`,
      );
      await interaction.deferReply({ ephemeral: true }); // Defer trước khi reply lỗi
      return interaction.editReply({
        content:
          "⚠️ Không có máy chủ nhạc nào khả dụng hoặc chưa kết nối đúng trạng thái (state không phải là CONNECTED), vui lòng thử lại sau.",
      });
    }

    await interaction.deferReply();

    try {
      let player = node.players.get(interaction.guild.id);
      if (
        !player ||
        player.state === 0 /* CREATED */ ||
        player.state === 1 /* DESTROYED */
      ) {
        // Kiểm tra thêm state
        try {
          player = await node.joinChannel({
            guildId: interaction.guild.id,
            shardId: interaction.guild.shardId, // Đảm bảo shardId đúng, nếu không dùng sharding thì có thể là 0
            channelId: voiceChannel.id,
            deaf: true,
          });
          Logger.info(
            `Player created and joined channel ${voiceChannel.name} in guild ${interaction.guild.name}`,
          );
          // Không cần gọi lại setupPlayerEventListeners nếu playerCreate event trong LavalinkHandler đã xử lý
          // lavalinkHandler.setupPlayerEventListeners(player); // Chỉ gọi nếu playerCreate không được kích hoạt đúng cách
        } catch (joinError) {
          Logger.error(`Failed to join voice channel: ${joinError.message}`, {
            stack: joinError.stack,
          });
          return interaction.editReply({
            content:
              "❌ Không thể kết nối vào kênh thoại của bạn. Chi tiết: " +
              joinError.message,
          });
        }
      }

      player.textChannelId = interaction.channelId; // Lưu text channel ID vào player

      if (player.channelId !== voiceChannel.id && player.connected) {
        // Kiểm tra player.connected
        return interaction.editReply({
          content: "⚠️ Bot đang được sử dụng ở một kênh thoại khác!",
          ephemeral: true,
        });
      }

      let searchResult = await player.search(query, {
        requester: interaction.user,
      }); // Truyền cả user object

      if (!searchResult || searchResult.loadType === "NO_MATCHES") {
        return interaction.editReply({
          content: `❌ Không tìm thấy kết quả nào cho truy vấn: \`${query}\``,
        });
      }
      if (searchResult.loadType === "LOAD_FAILED") {
        Logger.error(
          `Lavalink load failed for query "${query}": ${searchResult.exception?.message}`,
        );
        return interaction.editReply({
          content: `❌ Lỗi khi tải bài hát: ${searchResult.exception?.message || "Không rõ nguyên nhân"}`,
        });
      }

      let tracksToAddInfo = []; // Để lưu thông tin track cho embed
      let replyMessage = "";

      if (searchResult.loadType === "PLAYLIST_LOADED") {
        const tracks = searchResult.tracks;
        for (const track of tracks) {
          // Shoukaku tự xử lý data, chỉ cần thêm track object
          player.queue.add(track);
          tracksToAddInfo.push({
            title: track.info.title,
            uri: track.info.uri,
          });
        }
        replyMessage = `🎶 Đã thêm playlist **${searchResult.playlistInfo?.name || "Không tên"}** (${tracks.length} bài) vào hàng chờ.`;
      } else if (
        searchResult.loadType === "TRACK_LOADED" ||
        searchResult.loadType === "SEARCH_RESULT"
      ) {
        const track = searchResult.tracks[0];
        player.queue.add(track);
        tracksToAddInfo.push({ title: track.info.title, uri: track.info.uri });
        replyMessage = `✅ Đã thêm **[${track.info.title}](${track.info.uri})** vào hàng chờ.`;
      } else {
        return interaction.editReply({
          content:
            "❓ Không thể tải bài hát hoặc playlist này (loadType không xác định).",
        });
      }

      if (!player.playing && !player.paused && player.queue.length > 0) {
        await player.playTrack({ track: player.queue[0].track }); // Shoukaku v3
        // await player.playTrack({ track: player.queue[0] }); // Shoukaku v4
      }

      // Tạo embed cho phản hồi
      const embed = new EmbedBuilder().setColor("#00FF7F");
      if (searchResult.loadType === "PLAYLIST_LOADED") {
        embed
          .setTitle(`🎶 Đã thêm Playlist vào hàng chờ!`)
          .setDescription(
            `**${searchResult.playlistInfo?.name || "Playlist không tên"}** với ${tracksToAddInfo.length} bài hát.`,
          )
          .setFooter({ text: `Yêu cầu bởi: ${interaction.user.tag}` });
      } else {
        embed.setDescription(replyMessage);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Lỗi lệnh /play: ${error.message}`, { stack: error.stack });
      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: "❌ Đã xảy ra lỗi khi xử lý yêu cầu phát nhạc.",
            ephemeral: true,
          })
          .catch((e) => Logger.error("Error replying to play error:", e));
      } else {
        await interaction
          .editReply({
            content: "❌ Đã xảy ra lỗi khi xử lý yêu cầu phát nhạc.",
          })
          .catch((e) => Logger.error("Error editing reply for play error:", e));
      }
    }
  },
};
