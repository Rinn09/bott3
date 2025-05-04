const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('thu_hoach')
    .setDescription('Thu hoạch nông sản để kiếm tiền và XP nghề.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let userData = await User.findOne({ userId, guildId });
    if (!userData) {
      userData = await User.create({ userId, guildId });
    }

    const now = Date.now();

    // Kiểm tra nghề chính: so sánh không phân biệt chữ hoa thường
    if (
      !userData.mainJob ||
      !userData.mainJob.name ||
      userData.mainJob.name.toLowerCase() !== 'nông dân'
    ) {
      return interaction.reply({ content: 'Bạn chưa chọn nghề chính là **nông dân**!', ephemeral: true });
    }

    // Cooldown mỗi 2 phút
    if (userData.mainJob.cooldowns?.harvest && now - userData.mainJob.cooldowns.harvest < 2 * 60 * 1000) {
      const remaining = Math.ceil((2 * 60 * 1000 - (now - userData.mainJob.cooldowns.harvest)) / 1000);
      return interaction.reply({ content: `⏳ Bạn cần chờ thêm ${remaining} giây để thu hoạch lần nữa.`, ephemeral: true });
    }

    // Tính tiền và XP
    const xpEarned = Math.floor(Math.random() * 10) + 5; // từ 5 đến 15 XP nghề
    const salaryEarned = 5000 + userData.mainJob.level * 1000 + Math.floor(Math.random() * 2000); // VNĐ

    // Cập nhật dữ liệu
    userData.balance += salaryEarned;
    userData.mainJob.xp = (userData.mainJob.xp || 0) + xpEarned;
    userData.totalEarned += salaryEarned;
    if (!userData.mainJob.cooldowns) userData.mainJob.cooldowns = {};
    userData.mainJob.cooldowns.harvest = now;
    await userData.save();

    return interaction.reply({
      content: `🌾 Bạn đã thu hoạch nông sản và nhận được **${salaryEarned.toLocaleString()} VNĐ** cùng **${xpEarned} XP nghề**!`
    });
  }
};
