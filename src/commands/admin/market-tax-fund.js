const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-tax-fund')
        .setDescription('[Admin] Xem tổng số tiền thuế chợ đã thu được vào quỹ bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const botUserId = interaction.client.user.id;
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: false });

        try {
            // Tìm dữ liệu của bot trong server này
            const botData = await User.findOne({ userId: botUserId, guildId: guildId });

            const currentTaxFund = botData ? botData.balance : 0;

            const embed = new EmbedBuilder()
                .setColor('#EEE8AA')
                .setTitle('🏦 Quỹ Thuế Chợ Hiện Tại')
                .setDescription(`Tổng số tiền thuế thu được từ các giao dịch chợ và đang được giữ trong tài khoản của bot tại server này.`)
                .addFields(
                    { name: '💰 Số dư quỹ thuế', value: `${currentTaxFund.toLocaleString()} VNĐ` }
                    // Có thể thêm các thống kê khác sau này nếu cần
                )
                .setTimestamp()
                .setFooter({ text: `Bot: ${interaction.client.user.tag}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            Logger.error(`Lỗi lệnh /market-tax-fund (Guild: ${guildId}): ${error.message}`, { stack: error.stack });
            await interaction.editReply({ content: '❌ Đã xảy ra lỗi khi truy vấn quỹ thuế.' });
        }
    }
};