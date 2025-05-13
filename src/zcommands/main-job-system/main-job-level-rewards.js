const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('main_job_level_rewards')
    .setDescription('Xem phần thưởng khi thăng cấp nghề chính.'),

  async execute(interaction) {
    // Ví dụ về phần thưởng - bạn có thể tùy chỉnh
    const embed = new EmbedBuilder()
      .setTitle('🏆 Phần Thưởng Thăng Cấp Nghề Chính')
      .setColor('Gold')
      .setDescription('Khi lên cấp nghề, bạn có thể nhận được:')
      .addFields(
        { name: '💰 Lương cao hơn', value: 'Mức lương cơ bản hoặc thưởng nhiệm vụ tăng theo cấp độ.', inline: false },
        { name: '✨ Mở khóa Nhiệm vụ/Tính năng mới', value: '(Tùy theo thiết kế nghề) Ví dụ: Nông dân cấp cao có thể trồng cây hiếm.', inline: false },
        { name: '🎁 Phần thưởng một lần', value: 'Có thể nhận VNĐ hoặc vật phẩm đặc biệt khi đạt các mốc cấp độ quan trọng.', inline: false }
        // Thêm các phần thưởng khác nếu bạn muốn
      )
      .setFooter({ text: 'Chi tiết phần thưởng tùy thuộc vào từng nghề.' });

    await interaction.reply({ embeds: [embed] });
  }
};