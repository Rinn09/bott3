// src/commands/games/slot.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Default cấu hình an toàn
const DEFAULT_SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "7️⃣", "🍀"];
const DEFAULT_REELS = [
  ["🍒", "🍋", "🔔", "⭐", "7️⃣", "🍀"],
  ["🍒", "🍋", "🔔", "⭐", "7️⃣", "🍀"],
  ["🍒", "🍋", "🔔", "⭐", "7️⃣", "🍀"],
];
const PAYOUTS = {
  "🍒🍒🍒": 4, // x4
  "🍋🍋🍋": 4,
  "🔔🔔🔔": 6,
  "⭐⭐⭐": 8,
  "7️⃣7️⃣7️⃣": 15,
  "🍀🍀🍀": 20,
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function validReels(reels) {
  return (
    Array.isArray(reels) &&
    reels.length === 3 &&
    reels.every((r) => Array.isArray(r) && r.length >= 3)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slot")
    .setDescription("Máy kéo slot mini (demo an toàn, không dùng tiền)"),
  async execute(interaction) {
    const reels = validReels(DEFAULT_REELS) ? DEFAULT_REELS : null;
    if (!reels) {
      return interaction.reply({
        content: "🎰 Slot đang bảo trì (cấu hình không hợp lệ).",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const r1 = pick(reels[0]);
    const r2 = pick(reels[1]);
    const r3 = pick(reels[2]);
    const result = `${r1}${r2}${r3}`;

    let multiplier = PAYOUTS[result] || 0;
    // Bonus: nếu có 2 ký hiệu giống nhau kề nhau => x1 (an ủi)
    if (!multiplier && (r1 === r2 || r2 === r3)) multiplier = 1;

    const embed = new EmbedBuilder()
      .setTitle("🎰 Slot Machine")
      .setDescription(`**[ ${r1} | ${r2} | ${r3} ]**`)
      .addFields({
        name: "Kết quả",
        value:
          multiplier > 0
            ? `Bạn trúng **x${multiplier}** (demo).`
            : "Hụt rồi! (demo)",
      })
      .setTimestamp(Date.now());

    return interaction.editReply({ embeds: [embed] });
  },
};
