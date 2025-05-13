// src/commands/games/slot.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const { getRandomInt } = require("../../utils/gameUtils");
const { slotSymbols, Emojis } = require("../../models/emojis");
const { checkLevelUp } = require("../../utils/levelUtil");

// --- CẤU HÌNH CHO SLOT MACHINE ---
const GAME_ID_SLOT = "slot";
const SLOT_COOLDOWN_SECONDS = 2; // Giảm cooldown một chút để test nhanh hơn, có thể tăng lại sau
const DEFAULT_BET_SLOT = 500;
const MIN_BET_SLOT = 1;
const MAX_BET_SLOT = 1000000;

// Định nghĩa các biểu tượng và cấu hình của chúng
// Thứ tự các emoji phải khớp với thứ tự trong Emojis.slotSymbols
const SYMBOLS_CONFIG = {
  // Hòa vốn (x1) - Tỷ lệ rất cao
  BELL: {
    emoji: slotSymbols.symbols[0] || "🔔",
    name: "Bell",
    weight: 40,
    payout: { three: 1 },
  },
  CHERRY: {
    emoji: slotSymbols.symbols[1] || "🍒",
    name: "Cherry",
    weight: 35,
    payout: { three: 1, two: 0.2 },
  }, // Thêm pay 2 cherry = 0.2 (lỗ ít)
  // "Trượt" hoặc thắng rất ít
  LEMON: {
    emoji: slotSymbols.symbols[3] || "🍋",
    name: "Lemon",
    weight: 30,
    payout: { three: 0.5 },
  }, // 3 Lemon = 0.5 (vẫn lỗ)
  // Thưởng khá (Star có weight cao hơn Diamond/Pcoin)
  STAR: {
    emoji: slotSymbols.symbols[2] || "⭐",
    name: "Star",
    weight: 25,
    payout: { three: 2 },
  },
  // Thưởng cao
  DIAMOND: {
    emoji: slotSymbols.symbols[4] || "💎",
    name: "Diamond",
    weight: 15,
    payout: { three: 5 },
  },
  // Jackpot
  PCOIN: {
    emoji: slotSymbols.symbols[5] || "🪙",
    name: "Pcoin",
    weight: 8,
    payout: { three: 10 },
  },
};

const SYMBOLS_WEIGHTED_ARRAY = Object.values(SYMBOLS_CONFIG);
const REELS_COUNT = 3;
const ROWS_DISPLAYED = 3;

function generateVirtualReel() {
  const virtualReel = [];
  for (const symbol of SYMBOLS_WEIGHTED_ARRAY) {
    for (let i = 0; i < symbol.weight; i++) {
      virtualReel.push(symbol);
    }
  }
  if (virtualReel.length === 0) {
    Logger.warn(
      "[Slot Game] Virtual reel is empty. Check SYMBOLS_CONFIG weights.",
    );
    return [{ emoji: "❓", name: "ErrorSymbol", payout: { three: 0, two: 0 } }];
  }
  return virtualReel;
}

const VIRTUAL_REEL = generateVirtualReel();

function spinSingleReelStrip() {
  const strip = [];
  for (let i = 0; i < ROWS_DISPLAYED; i++) {
    if (VIRTUAL_REEL.length === 0) {
      strip.push({
        emoji: "🚫",
        name: "EmptyReel",
        payout: { three: 0, two: 0 },
      });
      continue;
    }
    const randomIndex = getRandomInt(0, VIRTUAL_REEL.length - 1);
    strip.push(VIRTUAL_REEL[randomIndex]);
  }
  return strip;
}

// Hàm kiểm tra dòng thắng (ưu tiên 3 giống nhau, sau đó là 2 giống nhau ở đầu cho một số symbol)
function checkWin(middleRowSymbols) {
  const r1 = middleRowSymbols[0];
  const r2 = middleRowSymbols[1];
  const r3 = middleRowSymbols[2];

  let payoutMultiplier = 0;
  let winDescription = "Rất tiếc, bạn chưa may mắn!"; // Thông báo mặc định thân thiện hơn

  if (!r1 || !r2 || !r3) {
    Logger.warn(
      "[Slot Game] One or more middle row symbols are undefined in checkWin.",
    );
    return { multiplier: 0, description: "Lỗi quay, vui lòng thử lại." };
  }

  // 1. Ưu tiên kiểm tra 3 biểu tượng giống nhau
  if (r1.emoji === r2.emoji && r2.emoji === r3.emoji) {
    payoutMultiplier = r1.payout.three || 0;
    if (payoutMultiplier === 1) {
      winDescription = `👍 May quá, hòa vốn! 3 ${r1.emoji} trên dòng giữa!`;
    } else if (
      payoutMultiplier === 10 &&
      r1.name === SYMBOLS_CONFIG.PCOIN.name
    ) {
      winDescription = `👑 JACKPOT ${SYMBOLS_CONFIG.PCOIN.emoji}!!! NỔ HŨ TO KHỦNG KHIẾP!`;
    } else if (payoutMultiplier > 0) {
      winDescription = `🎊 Chúc mừng! 3 ${r1.emoji} mang lại chiến thắng x${payoutMultiplier}!`;
    }
  }
  // 2. Nếu không có 3 giống nhau, kiểm tra 2 biểu tượng giống nhau ở đầu (chỉ cho CHERRY)
  else if (
    r1.emoji === r2.emoji &&
    r1.name === SYMBOLS_CONFIG.CHERRY.name &&
    r1.payout.two
  ) {
    payoutMultiplier = r1.payout.two; // Ví dụ: 0.2
    winDescription = `🤏 Trúng nhỏ! 2 ${r1.emoji} ở đầu dòng, nhận lại một phần cược!`;
  }
  // Thêm các payline khác ở đây nếu muốn, ví dụ:
  // else if (condition for top row win) { ... }
  // else if (condition for bottom row win) { ... }
  // else if (condition for diagonal win) { ... }

  return { multiplier: payoutMultiplier, description: winDescription };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName(GAME_ID_SLOT)
    .setDescription("Thử vận may với máy slot! Quay để thắng lớn!")
    .addIntegerOption((option) =>
      option
        .setName("bet_amount")
        .setDescription(
          `Số tiền cược (mặc định: ${DEFAULT_BET_SLOT.toLocaleString()}, min: ${MIN_BET_SLOT.toLocaleString()}, max: ${MAX_BET_SLOT.toLocaleString()}).`,
        )
        .setRequired(false)
        .setMinValue(MIN_BET_SLOT)
        .setMaxValue(MAX_BET_SLOT),
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
          bank: 0,
          xp: 0,
          level: 1,
          cooldowns: { games: new Map() },
        });
      } else {
        if (!user.cooldowns) user.cooldowns = { games: new Map() };
        else if (!user.cooldowns.games) user.cooldowns.games = new Map();
      }

      const now = Date.now();
      const gameCooldowns = user.cooldowns.games;
      const lastPlayed = gameCooldowns.get(GAME_ID_SLOT) || 0;

      if (now - lastPlayed < SLOT_COOLDOWN_SECONDS * 1000) {
        const timeLeft = Math.ceil(
          (SLOT_COOLDOWN_SECONDS * 1000 - (now - lastPlayed)) / 1000,
        );
        return interaction.editReply(
          `⏳ Bạn cần chờ **${timeLeft} giây** nữa để quay slot tiếp.`,
        );
      }

      const betAmount =
        interaction.options.getInteger("bet_amount") || DEFAULT_BET_SLOT;

      if (user.balance < betAmount) {
        return interaction.editReply(
          `😢 Ví bạn không đủ **${betAmount.toLocaleString()} VNĐ** để quay slot. Số dư hiện tại: ${user.balance.toLocaleString()} VNĐ.`,
        );
      }

      user.balance -= betAmount;
      user.totalSpent = (user.totalSpent || 0) + betAmount;

      const reel1Strip = spinSingleReelStrip();
      const reel2Strip = spinSingleReelStrip();
      const reel3Strip = spinSingleReelStrip();

      const displayGrid = [
        [reel1Strip[0].emoji, reel2Strip[0].emoji, reel3Strip[0].emoji],
        [reel1Strip[1].emoji, reel2Strip[1].emoji, reel3Strip[1].emoji],
        [reel1Strip[2].emoji, reel2Strip[2].emoji, reel3Strip[2].emoji],
      ];

      const middleRowSymbols = [reel1Strip[1], reel2Strip[1], reel3Strip[1]];
      const winCheckResult = checkWin(middleRowSymbols);

      let winnings = 0;
      let netGain = -betAmount;

      if (winCheckResult.multiplier > 0) {
        winnings = Math.floor(betAmount * winCheckResult.multiplier); // Làm tròn xuống tiền thắng
        netGain = winnings - betAmount;
        user.balance += winnings;
        user.totalEarned = (user.totalEarned || 0) + winnings;
      }

      const xpGain = winnings > 0 ? getRandomInt(8, 20) : getRandomInt(1, 4); // Điều chỉnh XP
      user.xp = (user.xp || 0) + xpGain;

      gameCooldowns.set(GAME_ID_SLOT, now);
      user.markModified("cooldowns.games");
      const levelUpResult = checkLevelUp(user);
      await user.save();

      const slotDisplayString = displayGrid
        .map((row) => row.join("  |  "))
        .join("\n");

      const embedColor =
        netGain > 0 ? "#FFD700" : netGain === 0 ? "#3498DB" : "#95a5a6";
      const embed = new EmbedBuilder()
        .setTitle(`🎰 ${interaction.user.username} quay Slot! 🎰`)
        .setDescription(`Bạn đã cược **${betAmount.toLocaleString()} VNĐ**.`)
        .addFields(
          { name: "Vòng Quay", value: slotDisplayString },
          { name: "Thông Báo Từ Nhà Cái", value: winCheckResult.description },
        )
        .setColor(embedColor)
        .setTimestamp()
        .setFooter({
          text: `Số dư mới: ${user.balance.toLocaleString()} VNĐ | +${xpGain} XP`,
        });

      if (netGain > 0) {
        embed.addFields({
          name: "🤑 Tiền Lời",
          value: `**+${netGain.toLocaleString()} VNĐ**`,
        });
      } else if (netGain === 0 && winCheckResult.multiplier === 1) {
        embed.addFields({
          name: "💸 Hoà Vốn!",
          value: `Bạn nhận lại ${betAmount.toLocaleString()} VNĐ.`,
        });
      }

      if (
        winCheckResult.multiplier === SYMBOLS_CONFIG.PCOIN.payout.three &&
        middleRowSymbols[0].name === SYMBOLS_CONFIG.PCOIN.name
      ) {
        embed.setTitle(
          `💰 JACKPOT ${SYMBOLS_CONFIG.PCOIN.emoji}!!! ${interaction.user.username} NỔ HŨ TO! 💰`,
        );
        embed.setColor("#F1C40F"); // Màu vàng gold cho jackpot
      }

      if (levelUpResult && levelUpResult.leveledUp) {
        embed.addFields({
          name: "🎉 Lên Cấp!",
          value: `Bạn đã lên cấp **${levelUpResult.newLevel}** và nhận **${levelUpResult.reward.toLocaleString()} VNĐ**!`,
        });
      }

      await interaction.editReply({ embeds: [embed] });
      Logger.info(
        `[Game/Slot] User ${userId} bet ${betAmount}. MiddleRow: [${middleRowSymbols.map((s) => s.emoji).join(",")}] Win Multiplier: ${winCheckResult.multiplier}. NetGain: ${netGain}. XP: ${xpGain}`,
      );
    } catch (error) {
      Logger.error(`Lỗi lệnh /slot: ${error.message}`, { stack: error.stack });
      const errorMessage = "❌ Đã xảy ra lỗi khi chơi Slot Machine.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for slot:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for slot:", e));
      }
    }
  },
};
