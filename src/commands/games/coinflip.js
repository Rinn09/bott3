const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const { getRandomInt } = require("../../utils/gameUtils"); // Đảm bảo đường dẫn đúng
const { checkLevelUp } = require("../../utils/levelUtil"); // Nếu muốn game cho XP level chung
const { Emojis } = require("../../models/emojis");

const GAME_ID = "coinflip";
const COOLDOWN_SECONDS = 5; // 5 giây cooldown cho coinflip
const MIN_BET = 1;
const MAX_BET = 1000000;
const WIN_MULTIPLIER = 2; // Thắng nhận lại x2 tiền cược (tức là lời x1 tiền cược)
const EMOJI_SAP = Emojis.coinFaces.EMOJI_SAP;
const EMOJI_NGUA = Emojis.coinFaces.EMOJI_NGUA;

module.exports = {
  data: new SlashCommandBuilder()
    .setName(GAME_ID)
    .setDescription("Tung đồng xu may mắn, chọn Sấp hoặc Ngửa.")
    .addStringOption((option) =>
      option
        .setName("side")
        .setDescription("Mặt bạn muốn cược.")
        .setRequired(true)
        .addChoices(
          { name: "Sấp (Heads)", value: "sấp" },
          { name: "Ngửa (Tails)", value: "ngửa" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription(
          `Số tiền VNĐ bạn muốn cược (tối thiểu ${MIN_BET.toLocaleString()}, tối đa ${MAX_BET.toLocaleString()}).`,
        )
        .setRequired(true)
        .setMinValue(MIN_BET)
        .setMaxValue(MAX_BET),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    try {
      let user = await User.findOne({ userId, guildId });
      if (!user) {
        user = await User.create({ userId, guildId }); // Tạo user nếu chưa có
      }

      // Kiểm tra Cooldown
      const now = Date.now();
      const gameCooldowns = user.cooldowns?.games || new Map();
      const lastPlayed = gameCooldowns.get(GAME_ID) || 0;

      if (now - lastPlayed < COOLDOWN_SECONDS * 1000) {
        const timeLeft = Math.ceil(
          (COOLDOWN_SECONDS * 1000 - (now - lastPlayed)) / 1000,
        );
        return interaction.editReply(
          `⏳ Bạn cần chờ **${timeLeft} giây** nữa để chơi lại trò này.`,
        );
      }

      const betSide = interaction.options.getString("side");
      const betAmount = interaction.options.getInteger("amount");

      if (user.balance < betAmount) {
        return interaction.editReply(
          `😢 Ví bạn không đủ **${betAmount.toLocaleString()} VNĐ**. Số dư: ${user.balance.toLocaleString()} VNĐ.`,
        );
      }

      // Trừ tiền cược
      user.balance -= betAmount;
      user.totalSpent = (user.totalSpent || 0) + betAmount;

      const coinFaces = ["sấp", "ngửa"];
      const resultFaceValue = getRandomInt(0, 1); // 0 for sấp, 1 for ngửa
      const resultFace = coinFaces[resultFaceValue];
      const resultEmoji = resultFaceValue === 0 ? EMOJI_SAP : EMOJI_NGUA; // Emoji cho sấp và ngửa (ví dụ)

      const win = betSide === resultFace;
      let outcomeDescription = "";
      let earnings = 0; // Số tiền thực nhận (bao gồm cả tiền cược trả lại nếu thắng)
      let netWinLoss = 0; // Số tiền lời/lỗ thực tế
      const xpGain = win ? getRandomInt(5, 15) : getRandomInt(1, 3);

      if (win) {
        earnings = betAmount * WIN_MULTIPLIER;
        netWinLoss = earnings - betAmount; // Tiền lời
        user.balance += earnings; // Cộng cả tiền cược và tiền thắng
        user.totalEarned = (user.totalEarned || 0) + earnings;
        outcomeDescription = `🎉 Chúc mừng! Đồng xu lật ra **${resultFace.toUpperCase()}** ${resultEmoji}. Bạn thắng và nhận được **${earnings.toLocaleString()} VNĐ**! (Lời: +${netWinLoss.toLocaleString()} VNĐ)`;
      } else {
        netWinLoss = -betAmount; // Tiền lỗ
        // Tiền đã bị trừ ở trên
        outcomeDescription = `😭 Rất tiếc! Đồng xu lật ra **${resultFace.toUpperCase()}** ${resultEmoji}. Bạn đã mất cược.`;
      }

      user.xp = (user.xp || 0) + xpGain;
      // Cập nhật cooldown
      if (!user.cooldowns.games) {
        // Khởi tạo nếu chưa có
        user.cooldowns.games = new Map();
      }
      user.cooldowns.games.set(GAME_ID, now);
      user.markModified("cooldowns.games"); // Quan trọng khi dùng Map

      const levelUpResult = checkLevelUp(user);
      await user.save();

      const embed = new EmbedBuilder()
        .setTitle(
          `${EMOJI_NGUA} Coinflip - ${interaction.user.username} ${EMOJI_SAP}!`,
        )
        .setDescription(
          `Bạn cược **${betAmount.toLocaleString()} VNĐ** vào mặt **${betSide.toUpperCase()}**.`,
        )
        .addFields(
          { name: "Kết Quả Tung Đồng Xu", value: outcomeDescription },
          { name: "✨ Kinh Nghiệm", value: `+${xpGain} XP`, inline: true },
          {
            name: "💰 Số Dư Mới",
            value: `${user.balance.toLocaleString()} VNĐ`,
            inline: true,
          },
        )
        .setColor(win ? "Green" : "Red")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      if (levelUpResult && levelUpResult.leveledUp) {
        embed.addFields({
          name: "🎉 Lên Cấp!",
          value: `Bạn đã lên cấp **${levelUpResult.newLevel}** và nhận **${levelUpResult.reward.toLocaleString()} VNĐ**!`,
        });
      }

      await interaction.editReply({ embeds: [embed] });
      Logger.info(
        `[Game/Coinflip] User ${userId} bet ${betAmount} on ${betSide}. Result: ${resultFace}. Win: ${win}. Net: ${netWinLoss}`,
      );
    } catch (error) {
      Logger.error(`Lỗi lệnh /coinflip: ${error.message}`, {
        stack: error.stack,
      });
      const errorMessage = "❌ Đã xảy ra lỗi khi chơi Coinflip.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for coinflip:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for coinflip:", e));
      }
    }
  },
};
