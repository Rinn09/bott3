const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const Economy = require("../../services/economy");
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
    min: 1000,
    max: 20000,
  },
  {
    type: "lost",
    chance: 0.03,
    message: "😥 Toang! Bạn bị móc túi mất {amount} VNĐ!",
    min: 5000,
    max: 30000,
  },
  {
    type: "drop",
    chance: 0.05,
    message: "😭 Rơi ví! Bạn làm rơi mất {amount} VNĐ!",
    min: 1000,
    max: 15000,
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
    message:
      "💎 Bạn tìm thấy một chiếc nhẫn kim cương khi đang làm việc! Bán nó và nhận được {amount} VNĐ!",
    min: 50000,
    max: 150000,
  },
];
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
    .addSubcommand((subcommand) =>
      subcommand
        .setName("balance")
        .setDescription("Xem số dư tài khoản của bạn hoặc người khác.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người dùng bạn muốn xem số dư.")
            .setRequired(false),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("bank")
        .setDescription("Tương tác với tài khoản ngân hàng của bạn.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("deposit")
            .setDescription("Gửi tiền từ ví vào ngân hàng.")
            .addIntegerOption((option) =>
              option
                .setName("amount")
                .setDescription("Số tiền muốn gửi.")
                .setRequired(true)
                .setMinValue(1),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("withdraw")
            .setDescription("Rút tiền từ ngân hàng về ví.")
            .addIntegerOption((option) =>
              option
                .setName("amount")
                .setDescription("Số tiền muốn rút.")
                .setRequired(true)
                .setMinValue(1),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("daily")
        .setDescription("Nhận phần thưởng tiền mặt hàng ngày."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pay")
        .setDescription("Chuyển tiền từ ví của bạn cho người dùng khác.")
        .addUserOption((option) =>
          option
            .setName("recipient")
            .setDescription("Người bạn muốn chuyển tiền.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Số tiền muốn chuyển.")
            .setRequired(true)
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("top")
        .setDescription(
          "Xem bảng xếp hạng những người giàu nhất server (ví + ngân hàng).",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("work")
        .setDescription("Làm việc để kiếm thêm thu nhập."),
    ),

  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // Hầu hết các lệnh này nhanh, trừ top có thể query nhiều, work có thể có random
    // deferReply chung nếu cần, hoặc từng subcommand tự defer
    // await interaction.deferReply({ ephemeral: true }); // Để true cho các lệnh cá nhân

    try {
      let user = await User.findOne({ userId, guildId });
      if (
        !user &&
        !["top"].includes(subcommand) &&
        !(subcommand === "balance" && interaction.options.getUser("user"))
      ) {
        user = await User.create({ userId, guildId });
      }

      if (subcommandGroup === "bank") {
        await interaction.deferReply({ ephemeral: true });
        const amount = interaction.options.getInteger("amount");
        if (!user)
          return interaction.editReply(
            "❌ Không tìm thấy dữ liệu của bạn. Hãy thử tương tác với bot trước.",
          );

        if (subcommand === "deposit") {
          if (user.balance < amount) {
            return interaction.editReply({
              content: "❌ Bạn không có đủ tiền trong ví để gửi.",
            });
          }
          user.balance -= amount;
          user.bank = (user.bank || 0) + amount;
          await user.save();
          Logger.info(
            `[Money/Bank/Deposit] User ${userId} deposited ${amount}. New balance: ${user.balance}, New bank: ${user.bank}`,
          );
          return interaction.editReply(
            `✅ Bạn đã gửi thành công **${amount.toLocaleString()} VNĐ** vào ngân hàng.\n💰 Ví: ${user.balance.toLocaleString()} VNĐ\n🏦 Ngân hàng: ${user.bank.toLocaleString()} VNĐ`,
          );
        } else if (subcommand === "withdraw") {
          if ((user.bank || 0) < amount) {
            return interaction.editReply({
              content: "❌ Bạn không có đủ tiền trong ngân hàng để rút.",
            });
          }
          user.bank -= amount;
          user.balance += amount;
          await user.save();
          Logger.info(
            `[Money/Bank/Withdraw] User ${userId} withdrew ${amount}. New balance: ${user.balance}, New bank: ${user.bank}`,
          );
          return interaction.editReply(
            `✅ Bạn đã rút thành công **${amount.toLocaleString()} VNĐ** từ ngân hàng.\n💰 Ví: ${user.balance.toLocaleString()} VNĐ\n🏦 Ngân hàng: ${user.bank.toLocaleString()} VNĐ`,
          );
        }
      } else {
        if (subcommand === "balance") {
          await interaction.deferReply({
            ephemeral: interaction.options.getUser("user") ? true : false,
          });
          const targetUser =
            interaction.options.getUser("user") || interaction.user;
          let userDataToView = user; // Mặc định là người dùng hiện tại

          if (targetUser.id !== userId) {
            // Nếu xem của người khác
            userDataToView = await User.findOne({
              userId: targetUser.id,
              guildId,
            });
          }

          if (!userDataToView) {
            return interaction.editReply({
              content: `ℹ️ Người dùng ${targetUser.tag} chưa có dữ liệu tài khoản trong server này.`,
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
                value: `${(userDataToView.balance || 0).toLocaleString()} VNĐ`,
                inline: true,
              },
              {
                name: "🏦 Ngân hàng",
                value: `${(userDataToView.bank || 0).toLocaleString()} VNĐ`,
                inline: true,
              },
              {
                name: "🛢️ Castrol",
                value: `${(userDataToView.castrolBalance || 0).toLocaleString()}`,
                inline: true,
              },
              {
                name: "📊 Tổng Tài Sản (Tiền mặt)",
                value: `${((userDataToView.balance || 0) + (userDataToView.bank || 0)).toLocaleString()} VNĐ`,
                inline: false,
              },
            )
            .setFooter({ text: `ID: ${targetUser.id}` })
            .setTimestamp();
          await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === "daily") {
          await interaction.deferReply({ ephemeral: true });
          if (!user)
            return interaction.editReply(
              "❌ Không tìm thấy dữ liệu của bạn. Hãy thử tương tác với bot trước.",
            );

          const COOLDOWN_HOURS = 24;
          const now = new Date();
          const lastClaimed = user.lastDaily || new Date(0); // Default to epoch if never claimed
          const hoursPassed =
            (now.getTime() - lastClaimed.getTime()) / (1000 * 60 * 60);

          if (hoursPassed < COOLDOWN_HOURS) {
            const remainingMs = (COOLDOWN_HOURS - hoursPassed) * 60 * 60 * 1000;
            const hours = Math.floor(remainingMs / (1000 * 60 * 60));
            const minutes = Math.floor(
              (remainingMs % (1000 * 60 * 60)) / (1000 * 60),
            );
            return interaction.editReply({
              content: `🕒 Bạn cần chờ thêm **${hours} giờ ${minutes} phút** để nhận thưởng hàng ngày tiếp theo.`,
            });
          }

          const minReward = 10000;
          const maxRewardBase = 10000 + (user.level || 1) * 15000; // User level
          const maxReward = Math.min(maxRewardBase, 250000); // Giới hạn max reward
          const reward = getRandomInt(minReward, maxReward);

          user.balance += reward;
          user.lastDaily = now;
          user.totalEarned = (user.totalEarned || 0) + reward;
          await user.save();

          Logger.info(
            `[Money/Daily] User ${userId} claimed daily reward: ${reward}`,
          );
          return interaction.editReply(
            `✅ Bạn đã nhận được phần thưởng hàng ngày là **${reward.toLocaleString()} VNĐ**!`,
          );
        } else if (subcommand === "pay") {
          await interaction.deferReply({ ephemeral: false });
          const recipient = interaction.options.getUser("recipient");
          const amountToPay = interaction.options.getInteger("amount");
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
          if (user.balance < amountToPay) {
            return interaction.editReply({
              content:
                "❌ Bạn không có đủ tiền trong ví để thực hiện giao dịch này.",
              ephemeral: true,
            });
          }

          let recipientData = await User.findOne({
            userId: recipient.id,
            guildId,
          });
          if (!recipientData) {
            recipientData = await User.create({
              userId: recipient.id,
              guildId,
            });
          }

          user.balance -= amountToPay;
          user.totalSpent = (user.totalSpent || 0) + amountToPay;
          recipientData.balance = (recipientData.balance || 0) + amountToPay;
          recipientData.totalEarned =
            (recipientData.totalEarned || 0) + amountToPay;

          await user.save();
          await recipientData.save();

          Logger.info(
            `[Money/Pay] User ${userId} paid ${amountToPay} to ${recipient.id}`,
          );
          return interaction.editReply(
            `💸 Bạn đã chuyển thành công **${amountToPay.toLocaleString()} VNĐ** cho ${recipient.username}!`,
          );
        } else if (subcommand === "top") {
          await interaction.deferReply();
          const topUsersData = await User.aggregate([
            { $match: { guildId } },
            { $addFields: { totalMoney: { $add: ["$balance", "$bank"] } } },
            { $sort: { totalMoney: -1 } },
            { $limit: 10 },
          ]);

          if (!topUsersData.length) {
            return interaction.editReply(
              "❌ Hiện tại không có dữ liệu nào để hiển thị bảng xếp hạng.",
            );
          }

          const embed = new EmbedBuilder()
            .setTitle("💸 Top 10 Đại Gia Giàu Nhất Server")
            .setColor(0xffd700) // Màu vàng gold
            .setTimestamp()
            .setFooter({
              text: "Bảng xếp hạng dựa trên tổng tiền (Ví + Ngân hàng)",
            });

          let description = "";
          for (let i = 0; i < topUsersData.length; i++) {
            const topUser = topUsersData[i];
            // Cố gắng fetch member để lấy tag, nếu không được thì dùng ID
            let memberDisplay = `<@${topUser.userId}>`;
            try {
              const member = await interaction.guild.members.fetch(
                topUser.userId,
              );
              memberDisplay = member.user.tag;
            } catch (e) {
              Logger.warn(
                `Could not fetch member for top money: ${topUser.userId}`,
              );
            }
            description += `\`#${i + 1}\` **${memberDisplay}** – ${topUser.totalMoney.toLocaleString()} VNĐ\n`;
          }
          embed.setDescription(description);
          await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === "work") {
          await interaction.deferReply();
          if (!user)
            return interaction.editReply(
              "❌ Không tìm thấy dữ liệu của bạn. Hãy thử tương tác với bot trước.",
            );

          const workCooldown = 60 * 60 * 1000 + (user.level || 1) * 15000; // 1 giờ + 15 giây * level
          const now = Date.now();

          if (
            user.cooldowns?.work &&
            now - user.cooldowns.work < workCooldown
          ) {
            const remaining = workCooldown - (now - user.cooldowns.work);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            return interaction.editReply({
              content: `⏳ Bạn cần nghỉ ngơi thêm **${minutes} phút ${seconds} giây** trước khi có thể làm việc tiếp.`,
            });
          }

          let amountEarned = getRandomInt(5000, 25000); // Tăng mức lương cơ bản một chút
          let finalMultiplier = 1;
          let eventMessage = null;
          let eventApplied = false;

          for (const event of workEvents) {
            if (Math.random() < event.chance) {
              eventApplied = true;
              switch (event.type) {
                case "daily": {
                  const { ok, msg, amount, wallet } = await Economy.claimDaily({
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    amount: 200,
                    cooldownMs: 24 * 60 * 60 * 1000,
                  });
                  if (!ok)
                    return interaction.reply({
                      content: `⏳ ${msg}`,
                      ephemeral: true,
                    });
                  return interaction.reply(
                    `✅ Nhận daily **${amount}**. Ví hiện có: **${wallet}**`,
                  );
                }

                case "work": {
                  const { ok, msg, reward, wallet } = await Economy.doWork({
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    base: 120,
                    cooldownMs: 5 * 60 * 1000,
                  });
                  if (!ok)
                    return interaction.reply({
                      content: `⏳ ${msg}`,
                      ephemeral: true,
                    });
                  return interaction.reply(
                    `🛠️ Làm việc nhận **${reward}**. Ví: **${wallet}**`,
                  );
                }

                case "deposit": {
                  const amt = Math.floor(
                    Math.max(0, interaction.options.getInteger("amount") || 0),
                  );
                  if (amt <= 0)
                    return interaction.reply({
                      content: "Số tiền không hợp lệ.",
                      ephemeral: true,
                    });
                  try {
                    const { wallet, bank } = await Economy.moveToBank({
                      guildId: interaction.guild.id,
                      userId: interaction.user.id,
                      amount: amt,
                    });
                    return interaction.reply(
                      `🏦 Gửi **${amt}** vào bank. Ví: **${wallet}**, Bank: **${bank}**`,
                    );
                  } catch (e) {
                    return interaction.reply({
                      content: `❌ ${e.message}`,
                      ephemeral: true,
                    });
                  }
                }

                case "withdraw": {
                  const amt = Math.floor(
                    Math.max(0, interaction.options.getInteger("amount") || 0),
                  );
                  if (amt <= 0)
                    return interaction.reply({
                      content: "Số tiền không hợp lệ.",
                      ephemeral: true,
                    });
                  try {
                    const { wallet, bank } = await Economy.moveToWallet({
                      guildId: interaction.guild.id,
                      userId: interaction.user.id,
                      amount: amt,
                    });
                    return interaction.reply(
                      `💼 Rút **${amt}** về ví. Ví: **${wallet}**, Bank: **${bank}**`,
                    );
                  } catch (e) {
                    return interaction.reply({
                      content: `❌ ${e.message}`,
                      ephemeral: true,
                    });
                  }
                }

                case "pay": {
                  const target = interaction.options.getUser("target", true);
                  const amt = Math.floor(
                    Math.max(0, interaction.options.getInteger("amount") || 0),
                  );
                  if (target.id === interaction.user.id) {
                    return interaction.reply({
                      content: "Không thể tự chuyển cho chính mình.",
                      ephemeral: true,
                    });
                  }
                  if (amt <= 0)
                    return interaction.reply({
                      content: "Số tiền không hợp lệ.",
                      ephemeral: true,
                    });
                  try {
                    await Economy.transfer({
                      guildId: interaction.guild.id,
                      fromUserId: interaction.user.id,
                      toUserId: target.id,
                      amount: amt,
                    });
                    return interaction.reply(
                      `🤝 Đã chuyển **${amt}** cho <@${target.id}>.`,
                    );
                  } catch (e) {
                    return interaction.reply({
                      content: `❌ ${e.message}`,
                      ephemeral: true,
                    });
                  }
                }

                case "top-money": {
                  const top = await Economy.topMoney({
                    guildId: interaction.guild.id,
                    limit: 10,
                  });
                  if (!top.length) return interaction.reply("Chưa có dữ liệu.");
                  const lines = top.map(
                    (u, i) => `**${i + 1}.** <@${u.userId}> — **${u.total}**`,
                  );
                  return interaction.reply({
                    content: `💰 **Top tiền**\n${lines.join("\n")}`,
                  });
                }

                case "bonus":
                  const bonusAmount = getRandomInt(event.min, event.max);
                  amountEarned += bonusAmount;
                  eventMessage = event.message.replace(
                    "{amount}",
                    bonusAmount.toLocaleString(),
                  );
                  break;
                case "lost":
                case "drop":
                  const lossAmount = getRandomInt(event.min, event.max);
                  amountEarned -= lossAmount;
                  if (amountEarned < 0) amountEarned = 0; // Không để âm tiền
                  eventMessage = event.message.replace(
                    "{amount}",
                    lossAmount.toLocaleString(),
                  );
                  break;
                case "double":
                  finalMultiplier = 2;
                  eventMessage = event.message;
                  break;
                case "triple":
                  finalMultiplier = 3;
                  eventMessage = event.message;
                  break;
                case "jackpot_item": // Đổi tên từ jackpot để tránh nhầm lẫn
                  const jackpotItemAmount = getRandomInt(event.min, event.max);
                  amountEarned += jackpotItemAmount;
                  eventMessage = event.message.replace(
                    "{amount}",
                    jackpotItemAmount.toLocaleString(),
                  );
                  break;
              }
              break;
            }
          }

          amountEarned *= finalMultiplier;
          if (amountEarned < 0) amountEarned = 0;

          const baseMessage = chooseRandom(workMessages);
          user.balance += amountEarned;
          user.totalEarned = (user.totalEarned || 0) + amountEarned;
          if (!user.cooldowns) user.cooldowns = {};
          user.cooldowns.work = now;
          await user.save();

          const embed = new EmbedBuilder()
            .setTitle("💼 Kết Quả Làm Việc")
            .setDescription(
              `${baseMessage}\n\n💰 Bạn nhận được **${amountEarned.toLocaleString()} VNĐ**!`,
            )
            .setColor(amountEarned > 0 ? 0x00b56a : 0xff4747)
            .setTimestamp();

          if (eventMessage) {
            embed.setFooter({ text: eventMessage });
          } else {
            embed.setFooter({ text: "Hãy tiếp tục chăm chỉ nhé!" });
          }
          Logger.info(
            `[Money/Work] User ${userId} worked and earned ${amountEarned}. Event: ${eventMessage || "None"}`,
          );
          await interaction.editReply({ embeds: [embed] });
        }
      }
    } catch (error) {
      Logger.error(
        `Lỗi lệnh /money ${subcommandGroup ? subcommandGroup + " " : ""}${subcommand}: ${error.message}`,
        { stack: error.stack },
      );
      const errorMessage = "❌ Đã xảy ra lỗi khi xử lý lệnh tiền tệ.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for money:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for money:", e));
      }
    }
  },
};
