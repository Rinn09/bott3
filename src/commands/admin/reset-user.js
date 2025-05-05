// src/commands/admin/reset-user.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../models/User'); // Đảm bảo đường dẫn đúng
const Logger = require('../../utils/logger'); // Import Logger để ghi log

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-user')
    .setDescription('⚠️[Admin] Reset TOÀN BỘ dữ liệu của người dùng về mặc định.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Người dùng cần reset dữ liệu')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Yêu cầu quyền Admin

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    // Xác nhận lại hành động nguy hiểm này
    const confirmButton = new ButtonBuilder()
        .setCustomId(`confirm_reset_${targetUser.id}`)
        .setLabel(`Reset ${targetUser.username}`)
        .setStyle(ButtonStyle.Danger); // Nút màu đỏ nguy hiểm

    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_reset')
        .setLabel('Hủy')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const confirmEmbed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('❓ Xác nhận Reset Dữ liệu')
        .setDescription(`Bạn có chắc chắn muốn reset **TOÀN BỘ** dữ liệu (tiền, level, XP, công việc, túi đồ, cooldowns...) của **${targetUser.tag}** (\`${targetUser.id}\`) không? Hành động này **KHÔNG THỂ** hoàn tác!`)
        .setFooter({ text: 'Hành động này sẽ xóa sạch tiến trình của người dùng.'});

    const reply = await interaction.reply({
        embeds: [confirmEmbed],
        components: [row],
        ephemeral: true, // Chỉ người dùng lệnh thấy
        withResponse: true
    });

    // Collector chờ xác nhận
    const filter = i => i.user.id === interaction.user.id && (i.customId === `confirm_reset_${targetUser.id}` || i.customId === 'cancel_reset');
    try {
        const confirmation = await reply.awaitMessageComponent({ filter, time: 30000 }); // Chờ 30 giây

        if (confirmation.customId === 'cancel_reset') {
            await confirmation.update({ content: '✅ Đã hủy thao tác reset.', embeds: [], components: [] });
            return;
        }

        if (confirmation.customId === `confirm_reset_${targetUser.id}`) {
            // --- Bắt đầu Reset ---
            await confirmation.deferUpdate(); // Xác nhận nút đã được bấm

            try {
              // Tìm và cập nhật hoặc tạo mới nếu chưa có (dù lệnh reset thường dùng cho user đã có data)
              // Sử dụng findOneAndUpdate với $set và $unset để reset hiệu quả
              const updateResult = await User.findOneAndUpdate(
                { userId: targetUser.id, guildId: guildId },
                {
                  $set: { // Đặt các giá trị về mặc định
                    balance: 0,
                    bank: 0,
                    xp: 0,
                    level: 1, // Level mặc định là 1
                    cooldowns: {}, // Xóa mọi cooldown
                    totalEarned: 0,
                    totalSpent: 0,
                    inventory: new Map() // Đặt inventory thành Map rỗng
                  },
                  $unset: { // Xóa các trường có thể không tồn tại hoặc cần xóa hoàn toàn
                    lastDaily: "", // Xóa ngày nhận daily cuối
                    job: "", // Xóa công việc phụ
                    mainJob: "" // Xóa công việc chính
                  }
                },
                { new: true, upsert: false } // Không tạo mới nếu user chưa tồn tại, trả về bản ghi sau update (không cần thiết lắm ở đây)
              );

              if (!updateResult) {
                  await confirmation.editReply({ content: `❌ Không tìm thấy dữ liệu của người dùng ${targetUser.tag} để reset.`, components: [], embeds: [] });
                  return;
              }

              Logger.info(`Admin ${interaction.user.tag} đã reset dữ liệu cho ${targetUser.tag} (ID: ${targetUser.id})`);
              await confirmation.editReply({ content: `✅ Đã reset thành công toàn bộ dữ liệu của **${targetUser.tag}**!`, components: [], embeds: [] });

              // Gửi thông báo vào kênh log (nếu có cấu hình)
              // (Thêm logic gửi log nếu bạn có kênh log)

            } catch (dbError) {
              Logger.error(`Lỗi DB khi reset user ${targetUser.tag}: ${dbError.message}`, { stack: dbError.stack });
              await confirmation.editReply({ content: '❌ Đã xảy ra lỗi khi reset dữ liệu người dùng trong database.', components: [], embeds: [] });
            }
            // --- Kết thúc Reset ---
        }

    } catch (error) {
         // Hết thời gian chờ xác nhận
        if (error.code === 'InteractionCollectorError') {
             await interaction.editReply({ content: '⌛ Hết thời gian xác nhận, đã hủy thao tác reset.', embeds: [], components: [] });
        } else {
            Logger.error(`Lỗi collector lệnh reset-user: ${error.message}`, { stack: error.stack });
            await interaction.editReply({ content: '❌ Có lỗi xảy ra với bộ thu tương tác.', embeds: [], components: [] });
        }
    }
  }
};