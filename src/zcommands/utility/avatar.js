const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Xem avatar của bạn hoặc thành viên khác')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Thành viên cần xem avatar')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    const embed = new EmbedBuilder()
      .setColor('#00acee')
      .setTitle(`🖼️ Avatar của ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
      .setFooter({ text: `Requested by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  }
};
