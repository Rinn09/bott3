
const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chuyen_tien')
    .setDescription('Chuyển tiền cho người dùng khác')
    .addUserOption(option =>
      option.setName('nguoi_nhan')
        .setDescription('Tag người nhận')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('so_tien')
        .setDescription('Số tiền muốn chuyển')
        .setRequired(true)),

  async execute(interaction) {
    const senderId = interaction.user.id;
    const guildId = interaction.guild.id;
    const receiver = interaction.options.getUser('nguoi_nhan');
    const amount = interaction.options.getInteger('so_tien');

    if (receiver.bot || receiver.id === senderId) {
      return interaction.reply({ content: '❌ Không thể chuyển tiền cho bot hoặc chính mình.', ephemeral: true });
    }

    if (amount <= 0) {
      return interaction.reply({ content: '❌ Số tiền phải lớn hơn 0.', ephemeral: true });
    }

    let sender = await User.findOne({ userId: senderId, guildId });
    if (!sender) sender = await User.create({ userId: senderId, guildId });

    if (sender.balance < amount) {
      return interaction.reply({ content: '❌ Bạn không đủ tiền trong ví.', ephemeral: true });
    }

    let receiverData = await User.findOne({ userId: receiver.id, guildId });
    if (!receiverData) receiverData = await User.create({ userId: receiver.id, guildId });

    sender.balance -= amount;
    receiverData.balance += amount;
    sender.totalSpent += amount;
    receiverData.totalEarned += amount;

    await sender.save();
    await receiverData.save();

    return interaction.reply({
      content: `💸 Bạn đã chuyển **${amount.toLocaleString()} VNĐ** cho ${receiver.username}!`
    });
  }
};
