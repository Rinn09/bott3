
const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

const DAILY_REWARD = 5000;
const COOLDOWN_HOURS = 24;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Nhận tiền mỗi ngày'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let userData = await User.findOne({ userId, guildId });
    if (!userData) userData = await User.create({ userId, guildId });

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

    userData.balance += DAILY_REWARD;
    userData.lastDaily = now;
    userData.totalEarned += DAILY_REWARD;
    await userData.save();

    return interaction.reply({
      content: `✅ Bạn đã nhận được **${DAILY_REWARD.toLocaleString()} VNĐ** hôm nay!`
    });
  }
};
