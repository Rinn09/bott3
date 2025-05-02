
const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

const WORK_REWARD = 1500;
const COOLDOWN_MINUTES = 30;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Làm việc để kiếm tiền (30 phút cooldown)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let userData = await User.findOne({ userId, guildId });
    if (!userData) userData = await User.create({ userId, guildId });

    const now = new Date();
    const lastWork = userData.cooldowns?.work || new Date(0);
    const minutesPassed = (now - lastWork) / 1000 / 60;

    if (minutesPassed < COOLDOWN_MINUTES) {
      const remaining = COOLDOWN_MINUTES - minutesPassed;
      const mins = Math.floor(remaining);
      const secs = Math.floor((remaining - mins) * 60);
      return interaction.reply({
        content: `🕒 Bạn cần chờ **${mins} phút ${secs} giây** để làm việc lại.`,
      });
    }

    userData.balance += WORK_REWARD;
    userData.totalEarned += WORK_REWARD;
    userData.cooldowns.work = now;
    await userData.save();

    return interaction.reply({
      content: `💼 Bạn đã làm việc và nhận được **${WORK_REWARD.toLocaleString()} VNĐ**!`
    });
  }
};
