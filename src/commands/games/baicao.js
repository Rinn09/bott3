const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const { Emojis } = require("../../models/emojis");
const { getRandomInt } = require("../../utils/gameUtils"); // Nếu cần
const { checkLevelUp } = require("../../utils/levelUtil");

// --- CẤU HÌNH CHO BÀI CÀO ---
const GAME_ID_BAICAO = "baicao";
const BAICAO_COOLDOWN_SECONDS = 5;
const MIN_BET_BAICAO = 500;
const MAX_BET_BAICAO = 1000000;
const WIN_MULTIPLIER_BAICAO = 2;

// --- LOGIC BỘ BÀI ---
const SUITS = ["spades", "clubs", "diamonds", "hearts"];
const RANKS_META = {
  // Key để lấy emoji, value là giá trị cho Bài Cào
  ace: { name: "Át", value: 1, emojiKey: "ace" },
  two: { name: "Hai", value: 2, emojiKey: "two" },
  three: { name: "Ba", value: 3, emojiKey: "three" },
  four: { name: "Bốn", value: 4, emojiKey: "four" },
  five: { name: "Năm", value: 5, emojiKey: "five" },
  six: { name: "Sáu", value: 6, emojiKey: "six" },
  seven: { name: "Bảy", value: 7, emojiKey: "seven" },
  eight: { name: "Tám", value: 8, emojiKey: "eight" },
  nine: { name: "Chín", value: 9, emojiKey: "nine" },
  ten: { name: "Mười", value: 0, emojiKey: "ten" }, // Hoặc 10 rồi lấy hàng đơn vị
  jack: { name: "J", value: 0, emojiKey: "jack" },
  queen: { name: "Q", value: 0, emojiKey: "queen" },
  king: { name: "K", value: 0, emojiKey: "king" },
};

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rankKey in RANKS_META) {
      const rankMeta = RANKS_META[rankKey];
      deck.push({
        suit: suit, // 'spades', 'clubs', ...
        rank: rankKey, // 'ace', 'two', ...
        value: rankMeta.value,
        name: `${rankMeta.name} ${Emojis.suits[suit]?.suit || suit.charAt(0).toUpperCase()}`, // Ví dụ: Át Bích
        emoji:
          Emojis.suits[suit]?.[rankMeta.emojiKey] ||
          `${rankMeta.name}${Emojis.suits[suit]?.suit || suit.charAt(0).toUpperCase()}`, // Lấy emoji từ file
      });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function dealCards(deck, numberOfCards) {
  const hand = [];
  for (let i = 0; i < numberOfCards; i++) {
    if (deck.length > 0) {
      hand.push(deck.pop());
    }
  }
  return hand;
}

function calculateBaiCaoScore(hand) {
  // hand là mảng 3 lá bài
  if (hand.length !== 3)
    return { score: 0, isBaTay: false, readableScore: "0 nút" };

  const isAllFaceCards = hand.every((card) =>
    ["jack", "queen", "king"].includes(card.rank),
  );
  if (isAllFaceCards) {
    return { score: 100, isBaTay: true, readableScore: "BA TÂY! ✨" }; // Điểm đặc biệt cho Ba Tây
  }

  let totalValue = 0;
  for (const card of hand) {
    totalValue += card.value;
  }
  const score = totalValue % 10;
  return {
    score: score === 0 ? 10 : score,
    isBaTay: false,
    readableScore: `${score === 0 ? "Bù (0 nút)" : score + " nút"}`,
  }; // 10 nút (Bù) là nhỏ nhất sau Ba Tây, rồi đến 9 nút...
}

function formatHand(hand) {
  return hand.map((card) => card.emoji).join(" ");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName(GAME_ID_BAICAO)
    .setDescription("Chơi Bài Cào (Ba Cây) may rủi với nhà cái (Bot).")
    .addIntegerOption((option) =>
      option
        .setName("bet_amount")
        .setDescription(
          `Số tiền VNĐ bạn muốn cược (tối thiểu ${MIN_BET_BAICAO.toLocaleString()}).`,
        )
        .setRequired(true)
        .setMinValue(MIN_BET_BAICAO)
        .setMaxValue(MAX_BET_BAICAO),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

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
      const lastPlayed = gameCooldowns.get(GAME_ID_BAICAO) || 0;

      if (now - lastPlayed < BAICAO_COOLDOWN_SECONDS * 1000) {
        const timeLeft = Math.ceil(
          (BAICAO_COOLDOWN_SECONDS * 1000 - (now - lastPlayed)) / 1000,
        );
        return interaction.editReply(
          `⏳ Bạn cần chờ **${timeLeft} giây** nữa để chơi Bài Cào tiếp.`,
        );
      }

      const betAmount = interaction.options.getInteger("bet_amount");

      if (user.balance < betAmount) {
        return interaction.editReply(
          `😢 Ví bạn không đủ **${betAmount.toLocaleString()} VNĐ**. Số dư: ${user.balance.toLocaleString()} VNĐ.`,
        );
      }

      user.balance -= betAmount;
      user.totalSpent = (user.totalSpent || 0) + betAmount;

      const deck = shuffleDeck(createDeck());
      const playerHand = dealCards(deck, 3);
      const botHand = dealCards(deck, 3);

      const playerScoreResult = calculateBaiCaoScore(playerHand);
      const botScoreResult = calculateBaiCaoScore(botHand);

      let resultMessage = "";
      let earnings = 0;
      let netWinLoss = -betAmount; // Mặc định là thua cược
      let playerWon = false;

      if (playerScoreResult.isBaTay && !botScoreResult.isBaTay) {
        playerWon = true;
      } else if (!playerScoreResult.isBaTay && botScoreResult.isBaTay) {
        playerWon = false;
      } else if (playerScoreResult.isBaTay && botScoreResult.isBaTay) {
        // Cả 2 Ba Tây -> Hòa (bot thắng do là nhà cái, hoặc hòa tùy luật)
        // Hiện tại cho nhà cái thắng nếu điểm bằng nhau
        playerWon = false;
        resultMessage = "Cả hai cùng Ba Tây! Nhà cái thắng theo luật.";
      } else {
        // So điểm
        if (playerScoreResult.score > botScoreResult.score) {
          playerWon = true;
        } else if (playerScoreResult.score < botScoreResult.score) {
          playerWon = false;
        } else {
          // Điểm bằng nhau
          playerWon = false; // Nhà cái thắng khi hòa điểm (trừ khi có so chất)
          resultMessage = "Hòa điểm! Nhà cái thắng theo luật.";
        }
      }

      const xpGain = playerWon ? getRandomInt(15, 30) : getRandomInt(3, 10);

      if (playerWon) {
        earnings = Math.floor(betAmount * WIN_MULTIPLIER_BAICAO);
        netWinLoss = earnings - betAmount;
        user.balance += earnings;
        user.totalEarned = (user.totalEarned || 0) + earnings;
        if (!resultMessage) resultMessage = `🎉 Chúc mừng! Bạn đã thắng!`;
      } else {
        if (!resultMessage) resultMessage = `😭 Rất tiếc! Bạn đã thua.`;
      }

      user.xp = (user.xp || 0) + xpGain;
      gameCooldowns.set(GAME_ID_BAICAO, now);
      user.markModified("cooldowns.games");

      const levelUpResult = checkLevelUp(user);
      await user.save();

      const embed = new EmbedBuilder()
        .setTitle(`🃏 Bài Cào (3 Cây) - ${interaction.user.username} 🃏`)
        .setColor(playerWon ? "#57F287" : "#ED4245")
        .addFields(
          {
            name: `Bài của bạn (${playerScoreResult.readableScore})`,
            value: formatHand(playerHand),
            inline: true,
          },
          {
            name: `Bài của Bot (${botScoreResult.readableScore})`,
            value: formatHand(botHand),
            inline: true,
          },
          { name: "Kết Quả", value: resultMessage },
        )
        .setTimestamp()
        .setFooter({ text: `Bạn đã cược: ${betAmount.toLocaleString()} VNĐ` });

      if (netWinLoss > 0) {
        embed.addFields({
          name: "Tiền lời",
          value: `+${netWinLoss.toLocaleString()} VNĐ`,
        });
      } else if (netWinLoss === 0 && playerWon) {
        // Hòa vốn (thắng x1)
        embed.addFields({
          name: "Hòa vốn",
          value: `Bạn nhận lại ${betAmount.toLocaleString()} VNĐ`,
        });
      } else {
        embed.addFields({
          name: "Tiền mất",
          value: `${Math.abs(netWinLoss).toLocaleString()} VNĐ`,
        });
      }
      embed.addFields({ name: "Kinh Nghiệm", value: `+${xpGain} XP` });
      embed.addFields({
        name: "Số Dư Mới",
        value: `${user.balance.toLocaleString()} VNĐ`,
      });

      if (levelUpResult && levelUpResult.leveledUp) {
        embed.addFields({
          name: "🎉 Lên Cấp!",
          value: `Bạn đã lên cấp **${levelUpResult.newLevel}** và nhận **${levelUpResult.reward.toLocaleString()} VNĐ**!`,
        });
      }

      await interaction.editReply({ embeds: [embed] });
      Logger.info(
        `[Game/Baicao] User ${userId} bet ${betAmount}. Player: ${playerScoreResult.readableScore} (${formatHand(playerHand)}), Bot: ${botScoreResult.readableScore} (${formatHand(botHand)}). Win: ${playerWon}. Net: ${netWinLoss}`,
      );
    } catch (error) {
      Logger.error(`Lỗi lệnh /baicao: ${error.message}`, {
        stack: error.stack,
      });
      const errorMessage = "❌ Đã xảy ra lỗi khi chơi Bài Cào.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for baicao:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for baicao:", e));
      }
    }
  },
};
