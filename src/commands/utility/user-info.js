const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user-info')
    .setDescription('Hiển thị thông tin của một thành viên')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Người cần xem thông tin')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    const embed = new EmbedBuilder()
      .setColor('#00ffcc')
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '👤 Username', value: user.username, inline: true },
        { name: '📆 Tạo tài khoản', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
        { name: '🔑 Vào server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: false },
        { name: '📛 Role cao nhất', value: member.roles.highest.name, inline: true },
        { name: '🎭 Bot?', value: user.bot ? '✅ Có' : '❌ Không', inline: true }
      )
      .setFooter({ text: `Thông tin của ${user.username}`, iconURL: interaction.guild.iconURL() });

    await interaction.reply({ embeds: [embed] });
  }
};
