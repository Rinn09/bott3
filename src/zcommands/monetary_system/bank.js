
const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Gửi hoặc rút tiền từ ngân hàng')
    .addSubcommand(sub =>
      sub.setName('gui_tien')
        .setDescription('Gửi tiền vào ngân hàng')
        .addIntegerOption(opt =>
          opt.setName('amount').setDescription('Số tiền muốn gửi').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('rut_tien')
        .setDescription('Rút tiền từ ngân hàng')
        .addIntegerOption(opt =>
          opt.setName('amount').setDescription('Số tiền muốn rút').setRequired(true))),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger('amount');

    let user = await User.findOne({ userId, guildId });
    if (!user) user = await User.create({ userId, guildId });

    if (amount <= 0) return interaction.reply({ content: '❌ Số tiền phải lớn hơn 0.', ephemeral: true });

    if (sub === 'gui_tien') {
      if (user.balance < amount) {
        return interaction.reply({ content: '❌ Bạn không có đủ tiền trong ví.', ephemeral: true });
      }
      user.balance -= amount;
      user.bank += amount;
    } else if (sub === 'rut_tien') {
      if (user.bank < amount) {
        return interaction.reply({ content: '❌ Bạn không có đủ tiền trong ngân hàng.', ephemeral: true });
      }
      user.bank -= amount;
      user.balance += amount;
    }

    await user.save();
    return interaction.reply({
      content: `✅ Bạn đã ${sub === 'gui_tien' ? 'gửi' : 'rút'} **${amount.toLocaleString()} VNĐ** ${sub === 'gui_tien' ? 'vào' : 'từ'} ngân hàng.`
    });
  }
};
