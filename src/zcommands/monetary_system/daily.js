const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

const COOLDOWN_HOURS = 24;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Nhận tiền mỗi ngày'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let userData = await User.findOne({ userId, guildId });
    if (!userData) userData = await User.create({ userId, guildId, balance: 0, bank: 0, xp: 0, level: 1 });

    const now = new Date();
    const lastClaimed = userData.lastDaily || new Date(0);
    const hoursPassed = (now - lastClaimed) / 1000 / 60 / 60;

    if (hoursPassed < COOLDOWN_HOURS) {
      const remaining = COOLDOWN_HOURS - hoursPassed;
      const hours = Math.floor(remaining);
      const minutes = Math.floor((remaining - hours) * 60);
      return interaction.reply({
        content: `🕒 Bạn cần chờ thêm **${hours}h ${minutes}m** để nhận daily tiếp theo.`,
        ephemeral: true
      });
    }

    // Tính thưởng ngẫu nhiên dựa trên level người dùng
    // Mức thưởng tối thiểu luôn là 10.000 VNĐ
    // Mức thưởng tối đa sẽ tăng theo level nhưng không vượt quá 250.000 VNĐ
    const minReward = 10000;
    const maxRewardBase = 10000 + userData.level * 15000;
    const maxReward = maxRewardBase > 250000 ? 250000 : maxRewardBase;
    const reward = getRandomInt(minReward, maxReward);

    userData.balance += reward;
    userData.lastDaily = now;
    userData.totalEarned = (userData.totalEarned || 0) + reward;
    await userData.save();

    return interaction.reply({
      content: `✅ Bạn đã nhận được **${reward.toLocaleString()} VNĐ** hôm nay!`
    });
  }
};
