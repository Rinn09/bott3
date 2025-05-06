const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../models/User');
const tradeManager = require('../../utils/tradeManager');
const Logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Mời người khác giao dịch vật phẩm và tiền.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Người bạn muốn giao dịch cùng')
        .setRequired(true)),

  async execute(interaction) {
    const initiator = interaction.user;
    const targetUser = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ Bạn không thể giao dịch với bot!', ephemeral: true });
    }
    if (targetUser.id === initiator.id) {
      return interaction.reply({ content: '❌ Bạn không thể tự giao dịch với chính mình!', ephemeral: true });
    }

    // --- Kiểm tra trạng thái giao dịch (dùng tradeManager - sẽ tạo sau) ---
    if (tradeManager.isUserInTrade(initiator.id)) {
        return interaction.reply({ content: '❌ Bạn đang trong một giao dịch khác!', ephemeral: true });
    }
    if (tradeManager.isUserInTrade(targetUser.id)) {
        return interaction.reply({ content: `❌ ${targetUser.username} đang trong một giao dịch khác!`, ephemeral: true });
    }

    // --- Gửi lời mời giao dịch ---
    const tradeId = tradeManager.createPendingTrade(initiator.id, targetUser.id, guildId, interaction.channel.id); // Tạo trade ID và lưu trạng thái chờ

    if (!tradeId) {
         return interaction.reply({ content: '❌ Không thể tạo yêu cầu giao dịch lúc này. Thử lại sau.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle(' Lời Mời Giao Dịch')
      .setDescription(`${initiator.username} muốn giao dịch với bạn, ${targetUser.toString()}!`)
      .addFields({ name: 'Hành động', value: ` ${targetUser.username}, bạn có muốn chấp nhận giao dịch này không? Lời mời sẽ hết hạn sau 60 giây.` })
      .setFooter({ text: `Trade ID: ${tradeId}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`trade_accept_${tradeId}`) 
        .setLabel('Chấp nhận')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`trade_decline_${tradeId}`) 
        .setLabel('Từ chối')
        .setStyle(ButtonStyle.Danger)
    );

    try {
      await interaction.reply({
        content: `${targetUser.toString()}, bạn có lời mời giao dịch!`,
        embeds: [embed],
        components: [row]
      });

      setTimeout(() => {
          const pendingTrade = tradeManager.getPendingTrade(tradeId);
          if (pendingTrade) {
              interaction.editReply({ content: ' Lời mời giao dịch đã hết hạn.', embeds: [], components: [] }).catch(()=>{});
              tradeManager.removePendingTrade(tradeId);
          }
      }, 60000);

    } catch (error) {
        Logger.error(`Error sending trade request for trade ${tradeId}:`, error);
        tradeManager.removePendingTrade(tradeId);
        await interaction.followUp({ content: '❌ Có lỗi xảy ra khi gửi lời mời giao dịch.', ephemeral: true });
    }
  }
};