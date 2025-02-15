const { Client, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server_count')
    .setDescription('Hiển thị số lượng thành viên và bot trong server'),

  async execute(interaction) {
    try {
      // Lấy danh sách các thành viên trong server
      const members = interaction.guild.members.cache;

      // Lọc ra các thành viên là bot
      const botMembers = members.filter(member => member.user.bot);

      // Đếm số lượng bot
      const botCount = botMembers.size;

      // Số lượng thành viên
      const memberCount = interaction.guild.memberCount - botCount;

      // Tạo tin nhắn embed
      const embed = {
        title: 'Thông tin về server',
        color: 0xFF0099,
        description: `Số thành viên: ${memberCount}\nBot: ${botCount}`
      };

      // Gửi tin nhắn embed
      interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error executing count command:', error);
      interaction.reply('Có lỗi xảy ra khi lấy thông tin số lượng thành viên và bot.');
    }
  },
};
