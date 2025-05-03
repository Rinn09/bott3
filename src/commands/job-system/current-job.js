const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cong_viec_hien_tai')
    .setDescription('Hiển thị công việc hiện tại của bạn.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const userData = await User.findOne({ userId, guildId });
    if (!userData || !userData.job || !userData.job.name) {
      return interaction.reply({ content: 'Bạn chưa nhận công việc nào!', ephemeral: true });
    }

    const { name, tier, lastSalary, hiredAt } = userData.job;
    const embed = new EmbedBuilder()
      .setTitle('Công việc hiện tại của bạn')
      .setColor('#00AFF0')
      .addFields(
        { name: 'Tên công việc', value: name, inline: true },
        { name: 'Tier', value: tier ? tier.toString() : 'N/A', inline: true },
        { name: 'Lần nhận lương cuối', value: lastSalary ? new Date(lastSalary).toLocaleString() : 'Chưa nhận lương', inline: false },
        { name: 'Thời gian nhận việc', value: hiredAt ? new Date(hiredAt).toLocaleString() : 'Chưa có', inline: false }
      );

    return interaction.reply({ embeds: [embed] });
  }
};