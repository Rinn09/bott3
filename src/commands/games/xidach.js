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
const { Emojis } = require("../../models/emojis"); // Đảm bảo đường dẫn đúng
const {
  createDeck,
  shuffleDeck,
  dealCards,
  formatHandEmojis,
  Card,
} = require("../../utils/deckUtils");
const { getRandomInt } = require("../../utils/gameUtils");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const GAME_ID_XIDACH = "xidach";
const XIDACH_COOLDOWN_SECONDS = 10; // Tăng cooldown 1 chút
const MIN_BET_XIDACH = 1000;
const MAX_BET_XIDACH = 500000; // Giới hạn cược
const BLACKJACK_PAYOUT_MULTIPLIER = 1.5; // Thắng Xì Bàn lời 1.5 lần tiền cược (tổng nhận 2.5 lần)
const NORMAL_WIN_MULTIPLIER = 1; // Thắng bình thường lời 1 lần tiền cược (tổng nhận 2 lần)

// --- Logic Tính Điểm Xì Dách ---
function calculateBlackjackHandValue(hand) {
  let aceCount = 0;
  let sum = 0;
  for (const card of hand) {
    sum += card.blackjackValue; // blackjackValue được định nghĩa trong class Card
    if (card.rankKey === "A") {
      // Giả sử rankKey của Át là 'A'
      aceCount++;
    }
  }
  while (sum > 21 && aceCount > 0) {
    sum -= 10;
    aceCount--;
  }
  return sum;
}

function getHandDescriptionAndState(hand) {
  const value = calculateBlackjackHandValue(hand);
  const numCards = hand.length;

  if (value > 21)
    return {
      value,
      readable: `Quắc (${value})`,
      isBust: true,
      isBlackjack: false,
      isNguLinh: false,
      canHit: false,
      canStand: false,
    };
  if (numCards === 2 && value === 21)
    return {
      value,
      readable: `Xì Bàn (21)`,
      isBlackjack: true,
      isBust: false,
      isNguLinh: false,
      canHit: false,
      canStand: true,
    };
  // Xử lý trường hợp 2 lá A (Xì Dách) tùy theo luật bạn muốn. Ví dụ, có thể là một chiến thắng đặc biệt hoặc chỉ là 2/12 điểm.
  // Hiện tại, A+A sẽ được tính là 12 điểm (11+1) hoặc 2 điểm (1+1) bởi calculateBlackjackHandValue.
  if (numCards === 2 && hand.every((card) => card.rankKey === "A")) {
    // Theo luật phổ thông, AA là 2 hoặc 12. Nếu bạn muốn nó là "Xì Dách" thắng luôn thì cần thêm logic ở đây.
    // Hiện tại, nó sẽ được tính là 12 điểm (nếu 1 Át là 11, 1 Át là 1).
    // Hoặc 2 điểm nếu cả 2 Át đều là 1.
  }
  if (numCards === 5 && value <= 21)
    return {
      value,
      readable: `Ngũ Linh (${value})`,
      isNguLinh: true,
      isBust: false,
      isBlackjack: false,
      canHit: false,
      canStand: true,
    };

  return {
    value,
    readable: `${value} điểm`,
    isBust: false,
    isBlackjack: false,
    isNguLinh: false,
    canHit: value < 21 && numCards < 5, // Cho phép rút khi dưới 21 và chưa đủ 5 lá
    canStand: true, // Luôn có thể dằn
  };
}

// Lưu trữ trạng thái game đang diễn ra (nên được quản lý bởi một service/manager nếu có nhiều game)
// Trong ví dụ này, dùng Map đơn giản. Key là interaction.id để mỗi lần gọi lệnh là một game mới.
const activeBlackjackGames = new Map();

async function revealXidachHandsStepByStep(
  interaction,
  gameData,
  user,
  resultText,
) {
  const faceDown = Emojis.cardMeta.faceDown;
  const playerHand = gameData.playerHand;
  const botHand = gameData.botHand;

  const playerStatus = getHandDescriptionAndState(playerHand);
  const botStatus = getHandDescriptionAndState(botHand);

  let playerDisplay = [playerHand[0].getEmoji(), faceDown];
  let botDisplay = [botHand[0].getEmoji(), faceDown];

  const embed = new EmbedBuilder()
    .setTitle(`🃏 Xì Dách - ${interaction.user.username} vs. Bot`)
    .setColor(
      playerStatus.isBust
        ? "Red"
        : playerStatus.isBlackjack
          ? "#FFD700"
          : "#5865F2",
    )
    .addFields(
      { name: `Bài của bạn`, value: playerDisplay.join(" ") },
      { name: `Bài của Nhà Cái`, value: botDisplay.join(" ") },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  await wait(1200);

  // Lật lá thứ hai
  playerDisplay[1] = playerHand[1].getEmoji();
  embed.spliceFields(0, 1, {
    name: `Bài của bạn`,
    value: playerDisplay.join(" "),
  });
  await interaction.editReply({ embeds: [embed] });

  if (playerHand.length > 2) {
    await wait(1200);
    playerDisplay.push(playerHand[2].getEmoji());
    embed.spliceFields(0, 1, {
      name: `Bài của bạn`,
      value: playerDisplay.join(" "),
    });
    await interaction.editReply({ embeds: [embed] });
  }

  await wait(1500);
  const botFull = botHand.map((c) => c.getEmoji()).join(" ");
  embed.spliceFields(1, 1, {
    name: `Bài của Nhà Cái (${botStatus.readable})`,
    value: botFull,
  });

  embed.addFields(
    {
      name: "🧠 Trạng Thái",
      value: `👤 Bạn: ${playerStatus.readable}\n🤖 Bot: ${botStatus.readable}`,
    },
    {
      name: "🎯 Kết Quả",
      value: resultText,
    },
    {
      name: "💰 Số Dư Mới",
      value: `${user.balance.toLocaleString()} VNĐ`,
      inline: true,
    },
  );

  embed.setColor(
    playerStatus.isBust
      ? "Red"
      : playerStatus.value > botStatus.value
        ? "Green"
        : "Red",
  );

  await interaction.editReply({ embeds: [embed] });
}

function createXidachButtons(interactionId, gameData) {
  const playerStatus = getHandDescriptionAndState(gameData.playerHand);
  const canDouble =
    gameData.playerHand.length === 2 &&
    !gameData.doubledDown &&
    gameData.user.balance >= gameData.betAmount;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`xidach_hit_${interactionId}`)
      .setLabel("Rút Bài")
      .setEmoji("➕") // Thay bằng emoji của bạn nếu có
      .setStyle(ButtonStyle.Success)
      .setDisabled(!playerStatus.canHit || gameData.playerTurnEnded),
    new ButtonBuilder()
      .setCustomId(`xidach_stand_${interactionId}`)
      .setLabel("Dằn Bài")
      .setEmoji("✋") // Thay bằng emoji của bạn nếu có
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!playerStatus.canStand || gameData.playerTurnEnded),
    new ButtonBuilder()
      .setCustomId(`xidach_double_${interactionId}`)
      .setLabel("Cược Gấp Đôi")
      .setEmoji("💰") // Thay bằng emoji của bạn nếu có
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!canDouble || gameData.playerTurnEnded),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName(GAME_ID_XIDACH)
    .setDescription("Chơi Xì Dách với Nhà Cái (Bot). Cố gắng đạt 21 điểm!")
    .addIntegerOption((option) =>
      option
        .setName("bet_amount")
        .setDescription(
          `Số tiền VNĐ bạn muốn cược (Tối thiểu: ${MIN_BET_XIDACH.toLocaleString()}).`,
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
      activeBlackjackGames.has(interaction.id) ||
      Array.from(activeBlackjackGames.values()).some(
        (g) => g.playerId === userId && !g.gameOver,
      )
    ) {
      return interaction.reply({
        content:
          "Bạn đang trong một ván Xì Dách khác. Hãy hoàn thành ván đó trước!",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      let user = await User.findOne({ userId, guildId });
      if (!user) {
        user = await User.create({
          userId,
          guildId,
          balance: 0,
          cooldowns: { games: new Map() },
        });
      } else {
        if (!user.cooldowns) user.cooldowns = { games: new Map() };
        else if (!user.cooldowns.games) user.cooldowns.games = new Map();
      }

      const now = Date.now();
      const gameCooldowns = user.cooldowns.games;
      const lastPlayed = gameCooldowns.get(GAME_ID_XIDACH) || 0;

      if (now - lastPlayed < XIDACH_COOLDOWN_SECONDS * 1000) {
        const timeLeft = Math.ceil(
          (XIDACH_COOLDOWN_SECONDS * 1000 - (now - lastPlayed)) / 1000,
        );
        return interaction.editReply(
          `⏳ Chờ **${timeLeft} giây** nữa để chơi Xì Dách tiếp.`,
        );
      }

      if (user.balance < initialBetAmount) {
        return interaction.editReply(
          `😢 Ví không đủ **${initialBetAmount.toLocaleString()} VNĐ**. Số dư: ${user.balance.toLocaleString()} VNĐ.`,
        );
      }

      user.balance -= initialBetAmount;
      user.totalSpent = (user.totalSpent || 0) + initialBetAmount;
      // Sẽ save user sau khi có kết quả cuối cùng

      const deck = shuffleDeck(createDeck());
      const playerHand = dealCards(deck, 2);
      const botHand = dealCards(deck, 2);

      const gameData = {
        interactionId: interaction.id,
        playerId: userId,
        guildId: guildId,
        user: user, // Truyền cả document user để cập nhật
        deck: deck,
        playerHand: playerHand,
        botHand: botHand,
        betAmount: initialBetAmount,
        doubledDown: false,
        playerTurnEnded: false,
        gameOver: false,
        messageId: null,
      };
      activeBlackjackGames.set(interaction.id, gameData);
      // Kiểm tra Xì Bàn ngay từ đầu
      const playerInitialStatus = getHandDescriptionAndState(
        gameData.playerHand,
      );
      const botInitialStatus = getHandDescriptionAndState(gameData.botHand);

      if (playerInitialStatus.isBlackjack) {
        gameData.playerTurnEnded = true; // Kết thúc lượt player
        // (Logic xử lý Xì Bàn sẽ được gọi trong button handler nếu stand, hoặc tự động ở đây)
        // Tạm thời, nếu player có blackjack, lượt họ kết thúc, đợi bot
        // Hoặc xử lý thắng ngay nếu bot không có blackjack
        if (!botInitialStatus.isBlackjack) {
          const winnings = Math.floor(
            gameData.betAmount * BLACKJACK_PAYOUT_MULTIPLIER,
          );
          const totalReceived = gameData.betAmount + winnings;
          gameData.user.balance += totalReceived;
          gameData.user.totalEarned =
            (gameData.user.totalEarned || 0) + totalReceived;
          resultMessage = `🎉 Xì Bàn! Bạn thắng ${winnings.toLocaleString()} VNĐ!`;
          gameData.gameOver = true;
        } else {
          gameData.user.balance += gameData.betAmount; // Hòa, hoàn tiền
          gameData.user.totalSpent -= gameData.betAmount;
          resultMessage = `✨ Cả hai cùng Xì Bàn! Hòa tiền!`;
          gameData.gameOver = true;
        }
      } else if (botInitialStatus.isBlackjack) {
        gameData.playerTurnEnded = true; // Player không có cơ hội rút nếu bot có blackjack
        resultMessage = `😭 Nhà cái Xì Bàn! Bạn thua.`;
        gameData.gameOver = true;
      }
      /*
      const buttons = createXidachButtons(interaction.id, gameData);

      const embed = new EmbedBuilder()
        .setTitle(`🎴 Xì Dách - ${interaction.user.username} vs. Bot`)
        .setDescription("⏳ Chờ hành động của bạn (Rút / Dằn / Gấp đôi)...")
        .addFields(
          {
            name: "Bài của bạn",
            value: formatHandEmojis(gameData.playerHand),
          },
          {
            name: "Bài của Nhà Cái",
            value: `${gameData.botHand[0].getEmoji()} 🂠`, // 1 lá úp
          },
        )
        .setColor("#5865F2")
        .setTimestamp();

      const gameMessage = await interaction.editReply({
        embeds: [embed],
        components: [buttons],
      });
      gameData.messageId = gameMessage.id;
*/
      if (gameData.gameOver) {
        await revealXidachHandsStepByStep(
          interaction,
          gameData,
          gameData.user,
          resultMessage,
        );
        gameData.user.cooldowns.games.set(GAME_ID_XIDACH, Date.now());
        gameData.user.markModified("cooldowns.games");
        await gameData.user.save();
        activeBlackjackGames.delete(interaction.id);
        Logger.info(
          `[Game/Xidach] Initial Blackjack/Push for User ${userId}. Bet: ${gameData.betAmount}. Result: ${resultMessage}`,
        );
        return;
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /xidach: ${error.message}`, {
        stack: error.stack,
      });
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
    }
  },
};

// Thêm module.exports.activeBlackjackGames để interactionHandler có thể truy cập
module.exports.activeBlackjackGames = activeBlackjackGames;
module.exports.getHandDescriptionAndState = getHandDescriptionAndState;
module.exports.revealXidachHandsStepByStep = revealXidachHandsStepByStep;
module.exports.createXidachButtons = createXidachButtons;
module.exports.calculateBlackjackHandValue = calculateBlackjackHandValue; // Export thêm hàm này
module.exports.NORMAL_WIN_MULTIPLIER = NORMAL_WIN_MULTIPLIER;
module.exports.GAME_ID_XIDACH = GAME_ID_XIDACH;
