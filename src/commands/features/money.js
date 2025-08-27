const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const Economy = require("../../services/economy");

// ====== cấu hình nhỏ ======
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const WORK_COOLDOWN_MS = 5 * 60 * 1000; // 5 phút
// biên độ tiền Daily (có thể chỉnh theo ý m)
const DAILY_MIN = 80_000;
const DAILY_MAX = 160_000;
// biên độ tiền Work cơ bản
const WORK_MIN = 3_000;
const WORK_MAX = 12_000;

// ====== text & event cho /work (giữ nguyên vibe cũ) ======
const workMessages = [
  "Bạn vừa giao hàng cho một khách hàng vui tính!",
  "Bạn vừa hoàn thành xong một ca làm mệt mỏi.",
  "Bạn đi làm từ sáng đến tối... nhưng lương vẫn bèo.",
  "Bạn cố gắng hết sức... và được trả công xứng đáng.",
  "Bạn đã giúp một cụ già qua đường và được bả cho tiền!",
  "Bạn đi đái bậy và nhặt được tiền lẻ!",
  "Bạn mới móc túi người khác mà nó cũng nghèo như bạn...",
];

const workEvents = [
  {
    type: "bonus",
    chance: 0.15,
    message: "🎉 May mắn! Bạn nhặt được thêm {amount} VNĐ trên đường!",
    min: 1_000,
    max: 20_000,
  },
  {
    type: "lost",
    chance: 0.03,
    message: "😥 Toang! Bạn bị móc túi mất {amount} VNĐ!",
    min: 5_000,
    max: 30_000,
  },
  {
    type: "drop",
    chance: 0.05,
    message: "😭 Rơi ví! Bạn làm rơi mất {amount} VNĐ!",
    min: 1_000,
    max: 15_000,
  },
  {
    type: "double",
    chance: 0.04,
    message: "✨ Tuyệt vời! Bạn được sếp thưởng gấp đôi tiền công!",
  },
  {
    type: "triple",
    chance: 0.01,
    message: "🎊 Jackpot! Sếp cực kỳ hài lòng và thưởng gấp ba lần tiền công!",
  },
  {
    type: "jackpot_item",
    chance: 0.005,
    message: "💎 Bạn tìm được nhẫn kim cương! Bán được {amount} VNĐ!",
    min: 50_000,
    max: 150_000,
  },
];

// ====== helpers ======
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function chooseRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("money")
    .setDescription("Các lệnh liên quan đến tiền tệ và kinh tế trong server.")

    .addSubcommand((sub) =>
      sub
        .setName("balance")
        .setDescription("Xem số dư tài khoản của bạn hoặc người khác.")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("Người dùng bạn muốn xem số dư.")
            .setRequired(false),
        ),
    )

    .addSubcommandGroup((group) =>
      group
        .setName("bank")
        .setDescription("Tương tác với tài khoản ngân hàng của bạn.")
        .addSubcommand((sub) =>
          sub
            .setName("deposit")
            .setDescription("Gửi tiền từ ví vào ngân hàng.")
            .addIntegerOption((opt) =>
              opt
                .setName("amount")
                .setDescription("Số tiền muốn gửi.")
                .setRequired(true)
                .setMinValue(1),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("withdraw")
            .setDescription("Rút tiền từ ngân hàng về ví.")
            .addIntegerOption((opt) =>
              opt
                .setName("amount")
                .setDescription("Số tiền muốn rút.")
                .setRequired(true)
                .setMinValue(1),
            ),
        ),
    )

    .addSubcommand((sub) =>
      sub
        .setName("daily")
        .setDescription("Nhận phần thưởng tiền mặt hàng ngày."),
    )

    .addSubcommand((sub) =>
      sub
        .setName("pay")
        .setDescription("Chuyển tiền cho người dùng khác.")
        .addUserOption((opt) =>
          opt
            .setName("recipient")
            .setDescription("Người nhận")
            .setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Số tiền muốn chuyển.")
            .setRequired(true)
            .setMinValue(1),
        ),
    )

    .addSubcommand((sub) =>
      sub.setName("top").setDescription("Xem top giàu nhất (ví + ngân hàng)."),
    )

    .addSubcommand((sub) =>
      sub.setName("work").setDescription("Làm việc để kiếm thêm thu nhập."),
    ),

  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      let user = await User.findOne({ userId, guildId });
      if (
        !user &&
        !["top"].includes(subcommand) &&
        !(subcommand === "balance" && interaction.options.getUser("user"))
      ) {
        user = await User.create({ userId, guildId });
      }

      // ====== BANK ======
      if (subcommandGroup === "bank") {
        await interaction.deferReply({ ephemeral: true });
        const amount = interaction.options.getInteger("amount", true);

        if (!user)
          return interaction.editReply(
            "❌ Không tìm thấy dữ liệu của bạn. Hãy thử tương tác với bot trước.",
          );

        if (subcommand === "deposit") {
          try {
            const { wallet, bank } = await Economy.moveToBank({
              guildId,
              userId,
              amount,
            });
            Logger.info(`[Money/Bank/Deposit] ${userId} -> ${amount}`);
            return interaction.editReply(
              `✅ Gửi **${amount.toLocaleString()} VNĐ** vào ngân hàng.\n💰 Ví: ${wallet.toLocaleString()} VNĐ\n🏦 Ngân hàng: ${bank.toLocaleString()} VNĐ`,
            );
          } catch (e) {
            return interaction.editReply({ content: `❌ ${e.message}` });
          }
        }

        if (subcommand === "withdraw") {
          try {
            const { wallet, bank } = await Economy.moveToWallet({
              guildId,
              userId,
              amount,
            });
            Logger.info(`[Money/Bank/Withdraw] ${userId} -> ${amount}`);
            return interaction.editReply(
              `✅ Rút **${amount.toLocaleString()} VNĐ** từ ngân hàng.\n💰 Ví: ${wallet.toLocaleString()} VNĐ\n🏦 Ngân hàng: ${bank.toLocaleString()} VNĐ`,
            );
          } catch (e) {
            return interaction.editReply({ content: `❌ ${e.message}` });
          }
        }

        return; // không rơi xuống dưới
      }

      // ====== NON-BANK ======
      if (subcommand === "balance") {
        await interaction.deferReply({
          ephemeral: !!interaction.options.getUser("user"),
        });
        const targetUser =
          interaction.options.getUser("user") || interaction.user;

        let view = user;
        if (targetUser.id !== userId) {
          view = await User.findOne({ userId: targetUser.id, guildId });
        }
        if (!view) {
          return interaction.editReply({
            content: `ℹ️ ${targetUser.tag} chưa có dữ liệu tài khoản trong server này.`,
          });
        }
        if (targetUser.bot && targetUser.id !== interaction.client.user.id) {
          return interaction.editReply({
            content: "❌ Không thể xem số dư của bot khác.",
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x00ae86)
          .setTitle(`💳 Thông Tin Tài Khoản của ${targetUser.username}`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .addFields(
            {
              name: "💰 Ví tiền",
              value: `${(view.balance || 0).toLocaleString()} VNĐ`,
              inline: true,
            },
            {
              name: "🏦 Ngân hàng",
              value: `${(view.bank || 0).toLocaleString()} VNĐ`,
              inline: true,
            },
            {
              name: "📊 Tổng Tài Sản (Tiền mặt)",
              value: `${((view.balance || 0) + (view.bank || 0)).toLocaleString()} VNĐ`,
              inline: false,
            },
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === "daily") {
        await interaction.deferReply({ ephemeral: true });
        const now = Date.now();

        if (user.lastDaily && now - user.lastDaily < DAILY_COOLDOWN_MS) {
          const remain = DAILY_COOLDOWN_MS - (now - user.lastDaily);
          const hrs = Math.floor(remain / 3600000);
          const mins = Math.floor((remain % 3600000) / 60000);
          const secs = Math.floor((remain % 60000) / 1000);
          return interaction.editReply(
            `⏳ Chưa hết cooldown. Hãy quay lại sau **${hrs}h ${mins}m ${secs}s**.`,
          );
        }

        const reward = getRandomInt(DAILY_MIN, DAILY_MAX);
        await Economy.credit({
          guildId,
          userId,
          amount: reward,
          reason: "daily",
        });
        user.lastDaily = now;
        user.totalEarned = (user.totalEarned || 0) + reward;
        await user.save();

        Logger.info(`[Money/Daily] ${userId} +${reward}`);
        return interaction.editReply(
          `✅ Bạn đã nhận **${reward.toLocaleString()} VNĐ** từ Daily!`,
        );
      }

      if (subcommand === "pay") {
        await interaction.deferReply({ ephemeral: false });
        const recipient = interaction.options.getUser("recipient", true);
        const amountToPay = interaction.options.getInteger("amount", true);

        if (!user)
          return interaction.editReply(
            "❌ Không tìm thấy dữ liệu của bạn để thực hiện chuyển tiền.",
          );
        if (recipient.bot || recipient.id === userId) {
          return interaction.editReply({
            content: "❌ Không thể chuyển tiền cho bot hoặc cho chính mình.",
            ephemeral: true,
          });
        }

        try {
          await Economy.transfer({
            guildId,
            fromUserId: userId,
            toUserId: recipient.id,
            amount: amountToPay,
          });
          Logger.info(
            `[Money/Pay] ${userId} -> ${recipient.id} : ${amountToPay}`,
          );
          return interaction.editReply(
            `💸 Đã chuyển **${amountToPay.toLocaleString()} VNĐ** cho ${recipient.username}!`,
          );
        } catch (e) {
          return interaction.editReply({
            content: `❌ ${e.message}`,
            ephemeral: true,
          });
        }
      }

      if (subcommand === "top") {
        await interaction.deferReply();
        const topUsers = await User.aggregate([
          { $match: { guildId } },
          { $addFields: { totalMoney: { $add: ["$balance", "$bank"] } } },
          { $sort: { totalMoney: -1 } },
          { $limit: 10 },
        ]);

        if (!topUsers.length)
          return interaction.editReply(
            "❌ Chưa có dữ liệu để hiển thị bảng xếp hạng.",
          );

        const lines = topUsers.map(
          (u, i) =>
            `**${i + 1}.** <@${u.userId}> — **${(u.totalMoney || 0).toLocaleString()}**`,
        );
        const embed = new EmbedBuilder()
          .setTitle("💸 Top 10 Đại Gia Giàu Nhất Server")
          .setDescription(lines.join("\n"))
          .setColor(0xf1c40f)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      if (subcommand === "work") {
        await interaction.deferReply();

        const now = Date.now();
        if (!user.cooldowns) user.cooldowns = {};
        const last = user.cooldowns.work || 0;
        const elapsed = now - last;

        if (elapsed < WORK_COOLDOWN_MS) {
          const remain = WORK_COOLDOWN_MS - elapsed;
          const mins = Math.floor(remain / 60000);
          const secs = Math.floor((remain % 60000) / 1000);
          return interaction.editReply(
            `⏳ Chưa hết cooldown. Vui lòng thử lại sau **${mins}m ${secs}s**.`,
          );
        }

        // tiền cơ bản
        let amountEarned = getRandomInt(WORK_MIN, WORK_MAX);
        let finalMultiplier = 1;
        let eventMessage = "";

        // một event ngẫu nhiên (nếu trúng xác suất)
        for (const ev of workEvents) {
          if (Math.random() < ev.chance) {
            switch (ev.type) {
              case "bonus": {
                const bonus = getRandomInt(ev.min, ev.max);
                amountEarned += bonus;
                eventMessage = ev.message.replace(
                  "{amount}",
                  bonus.toLocaleString(),
                );
                break;
              }
              case "lost":
              case "drop": {
                const loss = getRandomInt(ev.min, ev.max);
                amountEarned = Math.max(0, amountEarned - loss);
                eventMessage = ev.message.replace(
                  "{amount}",
                  loss.toLocaleString(),
                );
                break;
              }
              case "double":
                finalMultiplier = 2;
                eventMessage = ev.message;
                break;
              case "triple":
                finalMultiplier = 3;
                eventMessage = ev.message;
                break;
              case "jackpot_item": {
                const jack = getRandomInt(ev.min, ev.max);
                amountEarned += jack;
                eventMessage = ev.message.replace(
                  "{amount}",
                  jack.toLocaleString(),
                );
                break;
              }
            }
            break; // chỉ 1 event tối đa
          }
        }

        amountEarned = Math.max(0, Math.floor(amountEarned * finalMultiplier));

        // Ghi tiền qua EconomyService => tạo ledger
        if (amountEarned > 0) {
          await Economy.credit({
            guildId,
            userId,
            amount: amountEarned,
            reason: "work",
          });
        }
        user.totalEarned = (user.totalEarned || 0) + amountEarned;
        user.cooldowns.work = now;
        await user.save();

        const baseMessage = chooseRandom(workMessages);
        const embed = new EmbedBuilder()
          .setTitle("💼 Kết Quả Làm Việc")
          .setDescription(
            `${baseMessage}\n\n💰 Bạn nhận được **${amountEarned.toLocaleString()} VNĐ**!`,
          )
          .setColor(amountEarned > 0 ? 0x00b56a : 0xff4747)
          .setTimestamp();

        embed.setFooter({ text: eventMessage || "Hãy tiếp tục chăm chỉ nhé!" });

        Logger.info(
          `[Money/Work] ${userId} earned ${amountEarned}. Event: ${eventMessage || "None"}`,
        );
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      Logger.error(
        `Lỗi /money ${subcommandGroup ? subcommandGroup + " " : ""}${subcommand}: ${error.message}`,
        {
          stack: error.stack,
        },
      );
      const msg = "❌ Đã xảy ra lỗi khi xử lý lệnh tiền tệ.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: msg, ephemeral: true })
          .catch((e) => Logger.error("followUp /money:", e));
      } else {
        await interaction
          .reply({ content: msg, ephemeral: true })
          .catch((e) => Logger.error("reply /money:", e));
      }
    }
  },
};
