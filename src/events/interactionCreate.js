const Logger = require("../utils/logger");
const rateLimiter = require("../utils/ratelimiter");
const mongoose = require("mongoose");
const { PermissionFlagsBits } = require("discord.js");

// Bạn có thể cấu hình ở đây nếu muốn
const OWNER_IDS = (process.env.BOT_OWNER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const running = new Set(); // per-user concurrency lock

module.exports = {
  name: "interactionCreate",

  /**
   * Hỗ trợ cả EventHandler kiểu mới (execute(client, interaction))
   * và kiểu cũ (execute(interaction)) nhờ patch EventHandler đã làm trước đó.
   */
  async execute(client, interaction) {
    try {
      // 1) Chỉ xử lý command slash
      if (!interaction?.isChatInputCommand?.()) return;

      const key = `${interaction.user.id}:${interaction.guildId}`;
      const rate = rateLimiter.consume(key);
      if (!rate.ok) {
        const sec = Math.ceil(rate.retryAfterMs / 1000);
        return interaction
          .reply({
            content: `⏳ Chậm thôi bạn ơi! Hãy thử lại sau **${sec}s**.`,
            ephemeral: true,
          })
          .catch(() => {});
      }

      // 2) Khoá chạy song song 1 user
      if (running.has(interaction.user.id)) {
        return interaction
          .reply({
            content: "⚠️ Lệnh trước của bạn vẫn đang chạy, đợi xíu nhé.",
            ephemeral: true,
          })
          .catch(() => {});
      }
      running.add(interaction.user.id);

      // 3) Tìm command đã load
      const command = client.commands?.get(interaction.commandName);
      if (!command || typeof command.execute !== "function") {
        running.delete(interaction.user.id);
        return interaction
          .reply({
            content: "❌ Lệnh không tồn tại hoặc chưa được tải.",
            ephemeral: true,
          })
          .catch(() => {});
      }

      // 4) Kiểm tra DB (nhẹ nhàng)
      if (mongoose.connection?.readyState !== 1) {
        // cho qua các lệnh không cần DB, nhưng cảnh báo
        Logger.warn(
          `[DB] readyState=${mongoose.connection?.readyState} while handling /${interaction.commandName}`,
        );
      }

      // 5) Kiểm tra quyền user/bot nếu command có khai báo
      //   - command.requiredUserPerms / command.userPerms
      //   - command.requiredBotPerms  / command.botPerms
      const userPerms = command.requiredUserPerms || command.userPerms || [];
      const botPerms = command.requiredBotPerms || command.botPerms || [];

      if (userPerms.length && !interaction.memberPermissions?.has(userPerms)) {
        running.delete(interaction.user.id);
        return interaction
          .reply({
            content: `🚫 Bạn thiếu quyền: ${userPerms.map((p) => `\`${p}\``).join(", ")}`,
            ephemeral: true,
          })
          .catch(() => {});
      }
      if (
        botPerms.length &&
        !interaction.guild?.members?.me?.permissions?.has(botPerms)
      ) {
        running.delete(interaction.user.id);
        return interaction
          .reply({
            content: `🤖 Bot thiếu quyền: ${botPerms.map((p) => `\`${p}\``).join(", ")}. Hãy cấp đủ quyền cho bot.`,
            ephemeral: true,
          })
          .catch(() => {});
      }

      // 6) Owner-only (nếu command gắn cờ)
      if (command.ownerOnly && !OWNER_IDS.includes(interaction.user.id)) {
        running.delete(interaction.user.id);
        return interaction
          .reply({
            content: "🔐 Lệnh này chỉ dành cho owner.",
            ephemeral: true,
          })
          .catch(() => {});
      }

      // 7) Auto-defer fallback (không phá lệnh cũ): sau 2s mà chưa reply → defer ephemeral
      const autoDefer = setTimeout(() => {
        if (!interaction.deferred && !interaction.replied) {
          interaction
            .deferReply({ ephemeral: !!command.ephemeralByDefault })
            .catch(() => {});
        }
      }, 2000);

      // 8) Thực thi lệnh
      await Promise.resolve(command.execute(interaction));

      clearTimeout(autoDefer);
      running.delete(interaction.user.id);
    } catch (err) {
      Logger.error(
        `Error executing event interactionCreate: ${err?.stack || err}`,
      );
      running.delete(interaction.user.id);

      // cố gắng phản hồi gọn
      if (interaction && !interaction.replied) {
        try {
          if (!interaction.deferred) {
            await interaction.reply({
              content: "❌ Có lỗi xảy ra khi xử lý lệnh.",
              ephemeral: true,
            });
          } else {
            await interaction.editReply({
              content: "❌ Có lỗi xảy ra khi xử lý lệnh.",
            });
          }
        } catch {}
      }
    }
  },
};
