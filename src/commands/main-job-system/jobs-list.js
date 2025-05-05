const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MainJob = require('../../models/MainJob'); // Đảm bảo đường dẫn đúng

module.exports = {
  data: new SlashCommandBuilder()
    .setName('danh_sach_nghe_chinh')
    .setDescription('Hiển thị danh sách các nghề chính mà bạn có thể lựa chọn.'),

  async execute(interaction) {
    try {
      const jobs = await MainJob.find({}); // Lấy tất cả nghề từ DB

      if (!jobs.length) {
        return interaction.reply({ content: '❌ Hiện chưa có nghề chính nào trong hệ thống.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Danh sách các nghề chính')
        .setColor('#00C897');

      for (const job of jobs) {
        // Lấy lương cơ bản (ví dụ: lương cấp 1)
        const baseSalary = job.salaryByLevel?.get('1') || 'Không xác định';
        // Lấy danh sách nhiệm vụ
        const taskList = job.tasks?.map(task => `• ${task.name}`).join('\n') || 'Chưa có nhiệm vụ.';

        embed.addFields({
          name: `👷 ${job.name}`,
          value: `📜 *${job.description || 'Không có mô tả.'}*\n` +
                 `💰 Lương khởi điểm: ${baseSalary.toLocaleString ? baseSalary.toLocaleString() : baseSalary} VNĐ\n` +
                 `🔧 Nhiệm vụ chính:\n${taskList}`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error("Lỗi khi lấy danh sách nghề chính:", error);
      await interaction.reply({ content: '❌ Có lỗi xảy ra khi lấy danh sách nghề.', ephemeral: true });
    }
  }
};