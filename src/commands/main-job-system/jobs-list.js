const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MainJobs = require('../../data/mainJobs.json'); // Chứa danh sách nghề cố định

module.exports = {
  data: new SlashCommandBuilder()
    .setName('danh_sach_nghe_chinh')
    .setDescription('Hiển thị danh sách các nghề chính mà bạn có thể lựa chọn.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Danh sách các nghề chính')
      .setColor('#00C897');

    for (const job of MainJobs) {
      embed.addFields({
        name: `👷 ${job.name}`,
        value: `📈 Cấp tối đa: ${job.maxLevel}\n💰 Lương mỗi giờ: ${job.baseSalary} VNĐ/giờ\n📜 Mô tả: ${job.description}`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
