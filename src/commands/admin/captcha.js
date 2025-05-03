const { SlashCommandBuilder } = require('discord.js');
const captcha = require('../../functions/captcha');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha')
    .setDescription('Quản lý captcha cho server'),
  async execute(interaction) {
    // Gửi thông báo ban đầu (không cần ephemeral để hiển thị captcha công khai)
    await interaction.reply({ content: 'Khởi tạo captcha...', ephemeral: false });
    // Sử dụng kênh của lệnh để gửi captcha
    const channel = interaction.channel;
    // Gọi hàm captcha, sử dụng "random" để tạo chuỗi captcha ngẫu nhiên
    const result = await captcha("random", channel, interaction.user);
    // Sau khi captcha hoàn thành
    if (result) {
      const roleId = '1368145216086736967';
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(roleId).catch(() => {});
      await interaction.followUp({ content: 'Bạn đã được xác thực thành công!', ephemeral: false });
    } else {
      await interaction.followUp({ content: 'Captcha không hợp lệ hoặc hết hạn.', ephemeral: false });
      }
  }
};