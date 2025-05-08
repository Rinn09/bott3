const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-money')
        .setDescription('[Admin] Thêm hoặc trừ tiền (VNĐ) từ ví của người dùng.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Người dùng để chỉnh sửa số dư.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số tiền muốn thêm (số âm để trừ).')
                .setRequired(true))
        .addStringOption(option => // Thêm lý do (tùy chọn)
            option.setName('reason')
                .setDescription('Lý do cho việc thay đổi số dư (không bắt buộc).')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Yêu cầu quyền Admin

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Không có lý do cụ thể.';
        const guildId = interaction.guild.id;
        const adminUser = interaction.user;

        // Không cho phép chỉnh sửa tiền của bot bằng lệnh này (trừ khi bạn cố ý muốn)
        if (targetUser.bot) {
            return interaction.reply({ content: '❌ Không thể chỉnh sửa số dư của bot bằng lệnh này.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: false });

        try {
            let userData = await User.findOne({ userId: targetUser.id, guildId: guildId });

            // Nếu người dùng chưa có dữ liệu, tạo mới
            if (!userData) {
                userData = new User({ userId: targetUser.id, guildId: guildId, balance: 0, bank: 0 });
                Logger.info(`[Add-Money] Created new user data for ${targetUser.tag} (${targetUser.id}) in guild ${guildId}.`);
            }

            const oldBalance = userData.balance;
            const newBalance = oldBalance + amount;

            // Cập nhật số dư
            userData.balance = newBalance;

            // Cập nhật totalEarned/totalSpent (tùy chọn, có thể làm số liệu thống kê bị sai lệch nếu lạm dụng add-money)
            if (amount > 0) {
                 userData.totalEarned = (userData.totalEarned || 0) + amount;
            } else {
                 userData.totalSpent = (userData.totalSpent || 0) + Math.abs(amount);
            }


            await userData.save();

            const embed = new EmbedBuilder()
                .setColor(amount >= 0 ? 'Green' : 'Red')
                .setTitle(amount >= 0 ? '✅ Thêm Tiền Thành Công' : '✅ Trừ Tiền Thành Công')
                .setDescription(`Đã ${amount >= 0 ? 'thêm' : 'trừ'} **${Math.abs(amount).toLocaleString()} VNĐ** ${amount >= 0 ? 'vào' : 'từ'} ví của ${targetUser.tag}.`)
                .addFields(
                    { name: '👤 Người thực hiện', value: `${adminUser.tag} (\`${adminUser.id}\`)`, inline: true },
                    { name: '👤 Người nhận/bị trừ', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
                    { name: '💰 Số tiền', value: `${amount.toLocaleString()} VNĐ`, inline: true },
                    { name: '📊 Số dư cũ', value: `${oldBalance.toLocaleString()} VNĐ`, inline: true },
                    { name: '📊 Số dư mới', value: `${newBalance.toLocaleString()} VNĐ`, inline: true },
                    { name: '📝 Lý do', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            Logger.info(`[Add-Money] Admin ${adminUser.tag} ${amount >= 0 ? 'added' : 'removed'} ${Math.abs(amount)} VND ${amount >= 0 ? 'to' : 'from'} ${targetUser.tag} in guild ${guildId}. Reason: ${reason}. New balance: ${newBalance}`);

        } catch (error) {
            Logger.error(`Lỗi lệnh /add-money (Target: ${targetUser.id}, Amount: ${amount}, Admin: ${adminUser.id}): ${error.message}`, { stack: error.stack });
            await interaction.editReply({ content: '❌ Đã xảy ra lỗi khi cố gắng cập nhật số dư người dùng.' });
        }
    }
};