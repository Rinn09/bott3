const { SlashCommandBuilder } = require('discord.js');
const Job = require('../../models/Job');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cac_cong_viec')
    .setDescription('Hiển thị danh sách việc làm có sẵn'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    let user = await User.findOne({ guildId, userId });
    if (!user) user = await User.create({ guildId, userId });

    const jobs = await Job.find({}).sort({ tier: 1 });

    if (!jobs.length) {
      return interaction.reply('❌ Hiện chưa có công việc nào.');
    }

    const embed = {
      title: '💼 Danh sách việc làm hiện có',
      color: 0x2ECC71,
      description: jobs.map(job => {
        const hours = job.cooldown / (60 * 60 * 1000);
        const canApply = user.xp >= job.minXP;
        return `**${job.name}** (Tier ${job.tier})\n💰 Lương: ${job.salary.toLocaleString()} VNĐ / ${hours}h\n📈 Yêu cầu: ${job.minXP} XP\n${canApply ? '✅ Có thể ứng tuyển' : '🔒 Chưa đủ XP'}\n`;
      }).join('\n'),
      timestamp: new Date(),
      footer: { text: `XP hiện tại của bạn: ${user.xp}` }
    };

    return interaction.reply({ embeds: [embed] });
  }
};