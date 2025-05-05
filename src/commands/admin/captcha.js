const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js'); // Thêm PermissionFlagsBits
const captcha = require('../../functions/captcha'); // Đảm bảo đúng đường dẫn
const GuildConfig = require('../../models/GuildConfig'); // Model để lấy role xác thực (nếu có)
const Logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha')
    .setDescription('Yêu cầu xác thực captcha cho chính bạn.')
    // Thêm quyền nếu bạn muốn giới hạn người dùng có thể tự captcha
    // .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) // Ví dụ: Ai cũng có thể gửi tin nhắn thì có thể dùng
    ,
  async execute(interaction) {
    // Phản hồi tạm thời (ephemeral) để chỉ người dùng thấy
    await interaction.reply({ content: '⏳ Đang tạo mã captcha, vui lòng chờ...', ephemeral: true });

    try {
      // Gọi hàm captcha mới (không cần truyền text)
      const result = await captcha(interaction.channel, interaction.user);

      if (result === true) {
        // Tìm cấu hình role xác thực (Ví dụ: từ GuildConfig)
        // const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
        // const verifiedRoleId = config?.verifiedRoleId; // Bạn cần thêm trường này vào GuildConfig model nếu muốn
        const verifiedRoleId = '1368145216086736967'; // Hoặc dùng ID cứng nếu chỉ có 1 role

        if (verifiedRoleId) {
          const role = interaction.guild.roles.cache.get(verifiedRoleId);
          if (role) {
             await interaction.member.roles.add(role).catch(err => Logger.error(`[Captcha] Could not add role ${role.id} to ${interaction.user.tag}: ${err.message}`));
             await interaction.followUp({ content: `🎉 Bạn đã xác thực thành công và nhận được role **${role.name}**!`, ephemeral: true });
          } else {
             await interaction.followUp({ content: '🎉 Bạn đã xác thực thành công! (Không tìm thấy role xác thực để gán)', ephemeral: true });
          }
        } else {
            await interaction.followUp({ content: '🎉 Bạn đã xác thực thành công!', ephemeral: true });
        }
      } else if (result === false) {
        // Hàm captcha đã gửi phản hồi sai hoặc timeout collector đã xử lý
        // Chỉ cần followUp nếu cần thông báo thêm (thường là không cần)
         // await interaction.followUp({ content: 'Captcha không hợp lệ hoặc đã hết hạn.', ephemeral: true });
      }
    } catch (error) {
      Logger.error(`[Captcha Command Error] ${error.message}`, { stack: error.stack });
      await interaction.followUp({ content: '❌ Đã xảy ra lỗi khi xử lý captcha.', ephemeral: true }).catch(()=>{});
    }
  }
};
