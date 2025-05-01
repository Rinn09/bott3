const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-info')
    .setDescription('Hiển thị thông tin của server hiện tại'),

  async execute(interaction) {
    const { guild } = interaction;

    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setColor('#00ccff')
      .setTitle(`📊 Thông tin server: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '🆔 Server ID', value: guild.id, inline: true },
        { name: '👑 Owner', value: `<@${owner.id}>`, inline: true },
        { name: '🗓️ Tạo ngày', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false },
        { name: '👥 Tổng thành viên', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Tổng kênh', value: `${guild.channels.cache.size}`, inline: true },
        { name: '🌍 Khu vực', value: guild.preferredLocale || 'Không xác định', inline: true }
      )
      .setFooter({ text: `ID máy chủ: ${guild.id}` });

    await interaction.reply({ embeds: [embed] });
  }
};
