require('dotenv').config();
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('Xóa và đăng ký lại tất cả lệnh của bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Đảm bảo chỉ owner của bot mới có thể sử dụng lệnh này
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.editReply('Bạn không có quyền sử dụng lệnh này.');
      }
      
      Logger.info(`${interaction.user.tag} đã yêu cầu làm mới lệnh.`);
      
      // Gọi phương thức refreshCommands từ commandHandler
      await client.commandHandler.refreshCommands();
      
      await interaction.editReply('Đã xóa và đăng ký lại tất cả lệnh thành công!');
    } catch (error) {
      Logger.error(`Lỗi khi làm mới lệnh: ${error}`);
      await interaction.editReply('Có lỗi xảy ra khi làm mới lệnh.');
    }
  },
};