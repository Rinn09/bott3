// src/commands/games/xidach.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const Emojis = require("../../models/emojis");
const {
  createDeck,
  shuffleDeck,
  dealCards,
  formatHandEmojis,
  Card,
} = require("../../utils/deckUtils");
const { getRandomInt } = require("../../utils/gameUtils");
const mongoose = require("mongoose"); // Cần cho transaction

const GAME_ID_XIDACH = "xidach";
const XIDACH_COOLDOWN_SECONDS = 15; // Cooldown
const MIN_BET_XIDACH = 1000;
const MAX_BET_XIDACH = 500000;

// Tỷ lệ trả thưởng
const PAYOUT_XIBAN = 2; // Lời x2 tiền cược (tổng nhận 3 lần tiền cược)
const PAYOUT_XIDACH = 1.5; // Lời x1.5 tiền cược (tổng nhận 2.5 lần tiền cược)
const PAYOUT_NGULINH = 1.2; // Lời x1.2 tiền cược (tổng nhận 2.2 lần tiền cược) - tùy bạn
const PAYOUT_NORMAL = 1; // Lời x1 tiền cược (tổng nhận 2 lần tiền cược)

// --- Logic Tính Điểm và Trạng Thái Xì Dách (Cập nhật theo luật mới) ---
function calculateBlackjackHandValue(hand) {
  let aceCount = 0;
  let sum = 0;
  for (const card of hand) {
    sum += card.blackjackValue;
    if (card.isAce()) {
      aceCount++;
    }
  }
  while (sum > 21 && aceCount > 0) {
    sum -= 10;
    aceCount--;
  }
  return sum;
}

function getHandDetails(hand) {
  const value = calculateBlackjackHandValue(hand);
  const numCards = hand.length;
  let state = "NORMAL";
  let readable = `${value} điểm`;
  let isBust = value > 21;
  let isXiZach = false; // A + 10/J/Q/K
  let isXiBan = false; // A + A
  let isNguLinh = numCards === 5 && value <= 21;
  let canHit = !isBust && numCards < 5;
  let canStand = true;

  if (isBust) {
    state = "BUST";
    readable = `Quắc (${value} điểm)!`;
    canHit = false;
  } else if (numCards === 2) {
    const card1 = hand[0];
    const card2 = hand[1];
    if (card1.isAce() && card2.isAce()) {
      state = "XIBAN";
      readable = "Xì Bàn (AA)!";
      isXiBan = true;
      canHit = false; // Xì bàn dằn luôn
    } else if (
      (card1.isAce() && card2.isTenPointCard()) ||
      (card2.isAce() && card1.isTenPointCard())
    ) {
      state = "XIZACH";
      readable = "Xì Dách!";
      isXiZach = true;
      canHit = false; // Xì dách dằn luôn
    }
  }

  if (isNguLinh) {
    state = "NGULINH";
    readable = `Ngũ Linh (${value} điểm)!`;
    canHit = false;
  }

  return {
    value,
    readable,
    state,
    isBust,
    isXiZach,
    isXiBan,
    isNguLinh,
    canHit,
    canStand,
    numCards,
  };
}

// --- Lưu trữ trạng thái game ---
const activeBlackjackGames = new Map();

// --- HÀM TẠO EMBED VÀ BUTTONS ---
function createXidachEmbed(
  interaction,
  gameData,
  revealBotHand = false,
  resultMessage = null,
) {
  const playerDetails = getHandDetails(gameData.playerHand);
  let botHandStr;
  let botDetailsStr;

  if (revealBotHand || gameData.playerTurnEnded || gameData.gameOver) {
    const botFinalDetails = getHandDetails(gameData.botHand);
    botHandStr = formatHandEmojis(gameData.botHand, true);
    botDetailsStr = botFinalDetails.readable;
  } else {
    botHandStr = `${gameData.botHand[0].getEmoji()} ${Emojis.cardMeta.faceDown}`;
    const firstCardValue =
      gameData.botHand[0].blackjackValue === 11 && gameData.botHand[0].isAce()
        ? "A"
        : gameData.botHand[0].blackjackValue;
    botDetailsStr = `${firstCardValue} + ?`;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎲 Xì Dách: ${interaction.user.username} vs. Nhà Cái 🎲`)
    .setColor(
      playerDetails.isBust
        ? "#808080"
        : playerDetails.isXiBan || playerDetails.isXiZach
          ? "#FFD700"
          : "#2ECC71",
    )
    .addFields(
      {
        name: `Bài của bạn (${playerDetails.readable})`,
        value: formatHandEmojis(gameData.playerHand),
        inline: true,
      },
      {
        name: `Bài của Nhà Cái (${botDetailsStr})`,
        value: botHandStr,
        inline: true,
      },
    )
    .setFooter({
      text: `Tiền cược: ${gameData.betAmount.toLocaleString()} VNĐ`,
    })
    .setTimestamp();

  if (resultMessage) {
    embed.addFields({ name: "--- KẾT QUẢ ---", value: resultMessage });
  }
  if (gameData.gameOver && gameData.user) {
    // Thêm số dư cuối nếu game over
    embed.addFields({
      name: "Số dư mới của bạn",
      value: `${gameData.user.balance.toLocaleString()} VNĐ`,
    });
  }

  return embed;
}

function createXidachButtons(interactionId, gameData) {
  const playerDetails = getHandDetails(gameData.playerHand);
  const canDouble =
    gameData.playerHand.length === 2 &&
    !gameData.doubledDown &&
    gameData.user.balance >= gameData.betAmount;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`xidach_hit_${interactionId}`)
      .setLabel("Rút Bài")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Success)
      .setDisabled(
        !playerDetails.canHit || gameData.playerTurnEnded || gameData.gameOver,
      ),
    new ButtonBuilder()
      .setCustomId(`xidach_stand_${interactionId}`)
      .setLabel("Dằn Bài")
      .setEmoji("✋")
      .setStyle(ButtonStyle.Secondary) // Đổi thành Secondary cho đỡ chói
      .setDisabled(
        !playerDetails.canStand ||
          gameData.playerTurnEnded ||
          gameData.gameOver,
      ),
    new ButtonBuilder()
      .setCustomId(`xidach_double_${interactionId}`)
      .setLabel("Cược Gấp Đôi")
      .setEmoji("💰")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!canDouble || gameData.playerTurnEnded || gameData.gameOver),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName(GAME_ID_XIDACH)
    .setDescription("Chơi Xì Dách với Nhà Cái. Cố gắng đạt gần 21 điểm nhất!")
    .addIntegerOption((option) =>
      option
        .setName("bet_amount")
        .setDescription(
          `Số tiền VNĐ cược (Tối thiểu: ${MIN_BET_XIDACH.toLocaleString()}).`,
        )
        .setRequired(true)
        .setMinValue(MIN_BET_XIDACH)
        .setMaxValue(MAX_BET_XIDACH),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const initialBetAmount = interaction.options.getInteger("bet_amount");

    if (
      Array.from(activeBlackjackGames.values()).some(
        (g) => g.playerId === userId && !g.gameOver,
      )
    ) {
      return interaction.reply({
        content:
          "Bạn đang trong một ván Xì Dách khác. Hoàn thành ván đó trước!",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const session = await mongoose.startSession(); // Khởi tạo session ở ngoài cùng
    let userDocument; // Đổi tên biến để rõ ràng hơn

    try {
      await session.startTransaction();

      userDocument = await User.findOne({ userId, guildId }).session(session);

      if (!userDocument) {
        Logger.info(`[Xidach] New user: ${userId}. Creating...`);
        // Tạo user và đảm bảo nó nằm trong transaction
        const createdUsers = await User.create(
          [
            {
              userId,
              guildId,
              balance: 0,
              bank: 0,
              xp: 0,
              level: 1,
              cooldowns: { games: new Map() },
            },
          ],
          { session },
        );
        userDocument = createdUsers[0];
        if (!userDocument) {
          // Kiểm tra lại sau khi tạo
          throw new Error("Không thể tạo dữ liệu người dùng mới.");
        }
      } else {
        // Đảm bảo các trường cần thiết tồn tại
        if (userDocument.balance === undefined) userDocument.balance = 0;
        if (userDocument.totalSpent === undefined) userDocument.totalSpent = 0;
        if (userDocument.totalEarned === undefined)
          userDocument.totalEarned = 0;
        if (!userDocument.cooldowns)
          userDocument.cooldowns = { games: new Map() };
        else if (!userDocument.cooldowns.games)
          userDocument.cooldowns.games = new Map();
      }

      const now = Date.now();
      const lastPlayed = userDocument.cooldowns.games.get(GAME_ID_XIDACH) || 0;

      if (now - lastPlayed < XIDACH_COOLDOWN_SECONDS * 1000) {
        const timeLeft = Math.ceil(
          (XIDACH_COOLDOWN_SECONDS * 1000 - (now - lastPlayed)) / 1000,
        );
        // Không cần abort transaction ở đây vì chưa làm gì thay đổi DB
        return interaction.editReply(
          `⏳ Chờ **${timeLeft} giây** nữa để chơi Xì Dách.`,
        );
      }

      if (userDocument.balance < initialBetAmount) {
        // Sử dụng userDocument
        // Không cần abort transaction
        return interaction.editReply(
          `😢 Ví không đủ **${initialBetAmount.toLocaleString()} VNĐ**. Số dư: ${userDocument.balance.toLocaleString()} VNĐ.`,
        );
      }

      userDocument.balance -= initialBetAmount;
      userDocument.totalSpent += initialBetAmount;

      const deck = shuffleDeck(createDeck());
      const playerHand = dealCards(deck, 2);
      const botHand = dealCards(deck, 2);

      const gameData = {
        interactionId: interaction.id,
        playerId: userId,
        userDocId: userDocument._id.toString(), // Quan trọng: dùng _id của userDocument
        deck: deck,
        playerHand: playerHand,
        botHand: botHand,
        betAmount: initialBetAmount,
        doubledDown: false,
        playerTurnEnded: false,
        gameOver: false,
        messageId: null,
        // user: userDocument // Không cần lưu cả user document ở đây nữa, sẽ fetch lại trong button handler
      };
      activeBlackjackGames.set(interaction.id, gameData);

      const playerDetails = getHandDetails(playerHand);
      const botDetails = getHandDetails(botHand);
      let gameEndedPrematurely = false;
      let resultMessage = "";

      // ... (Logic xử lý Xì Bàn/Xì Dách sớm như cũ, nhưng thay user bằng userDocument)
      if (playerDetails.isXiBan) {
        gameEndedPrematurely = true;
        if (botDetails.isXiBan) {
          /* Hòa */ userDocument.balance += initialBetAmount;
          userDocument.totalSpent -= initialBetAmount;
          resultMessage = "✨ Cả hai cùng Xì Bàn! Hòa tiền.";
        } else {
          /* Thắng */ const winnings = Math.floor(
            initialBetAmount * PAYOUT_XIBAN,
          );
          const totalReceived = initialBetAmount + winnings;
          userDocument.balance += totalReceived;
          userDocument.totalEarned += totalReceived;
          resultMessage = `🏆 XÌ BÀN! Bạn thắng lớn ${winnings.toLocaleString()} VNĐ!`;
        }
      } else if (botDetails.isXiBan) {
        /* ... */
      }
      // ... Tương tự cho Xì Dách ...

      if (gameEndedPrematurely) {
        gameData.gameOver = true;
        gameData.playerTurnEnded = true;
        // Truyền userDocument vào createXidachEmbed nếu nó cần thông tin user (ví dụ: balance để hiển thị ở footer)
        // Hoặc sửa createXidachEmbed để nhận gameData và tự lấy user.balance từ gameData.user (nếu có)
        const finalEmbed = createXidachEmbed(
          interaction,
          { ...gameData, user: userDocument },
          true,
          resultMessage,
        );
        await interaction.editReply({ embeds: [finalEmbed], components: [] });

        userDocument.cooldowns.games.set(GAME_ID_XIDACH, Date.now());
        userDocument.markModified("cooldowns.games");
        await userDocument.save({ session });
        await session.commitTransaction();
        activeBlackjackGames.delete(interaction.id);
        Logger.info(
          `[Game/Xidach Premature End] User ${userId}. Bet: ${initialBetAmount}. Result: ${resultMessage}`,
        );
        return;
      }

      const embed = createXidachEmbed(interaction, {
        ...gameData,
        user: userDocument,
      });
      const buttons = createXidachButtons(interaction.id, {
        ...gameData,
        user: userDocument,
      }); // Truyền user vào đây để check balance cho nút double
      const gameMessage = await interaction.editReply({
        embeds: [embed],
        components: [buttons],
      });
      gameData.messageId = gameMessage.id;

      await userDocument.save({ session }); // Lưu việc trừ tiền cược ban đầu
      await session.commitTransaction();
    } catch (error) {
      Logger.error(`Lỗi lệnh /xidach khởi tạo: ${error.message}`, {
        stack: error.stack,
      });
      await session.abortTransaction(); // Abort nếu có lỗi trong khối try chính
      const errorMessage = "❌ Đã xảy ra lỗi khi bắt đầu ván Xì Dách.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for xidach:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for xidach:", e));
      }
      activeBlackjackGames.delete(interaction.id);
    } finally {
      if (session.inTransaction()) {
        // Đảm bảo abort nếu chưa commit
        await session.abortTransaction();
        Logger.warn(
          "[Xidach Execute] Transaction was aborted in finally block.",
        );
      }
      session.endSession(); // Luôn kết thúc session
    }
  },
  // Hàm xử lý button sẽ được đặt trong interactionHandler.js
};

// Export các hằng số và hàm cần thiết cho interactionHandler
module.exports.activeBlackjackGames = activeBlackjackGames;
module.exports.getHandDetails = getHandDetails;
module.exports.createXidachEmbed = createXidachEmbed;
module.exports.createXidachButtons = createXidachButtons;
module.exports.calculateBlackjackHandValue = calculateBlackjackHandValue;
module.exports.PAYOUT_NGULINH = PAYOUT_NGULINH;
module.exports.PAYOUT_NORMAL = PAYOUT_NORMAL;
module.exports.GAME_ID_XIDACH = GAME_ID_XIDACH;
