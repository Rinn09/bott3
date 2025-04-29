const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createWelcomeEmbed(member, rulesChannelId, description, image) {
  const embed = new EmbedBuilder()
    .setColor('#00FF99')
    .setTitle(`Chào mừng ${member.user.username} đã đến với ${member.guild.name}! 🎉`)
    .setDescription(description) // ✅ custom message
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  if (image) embed.setImage(image);

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('📖 Đọc luật')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${member.guild.id}/${rulesChannelId}`),
      new ButtonBuilder()
        .setCustomId('select-gender')
        .setLabel('Có cu không?')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('select-game')
        .setLabel('Có chơi game gì không?')
        .setStyle(ButtonStyle.Success)
    );

  return { embed, row };
}

function createGoodbyeEmbed(member, message, image) {
  return new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("👋 Tạm biệt!")
    .setDescription(message)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage(image)
    .setFooter({ text: `Còn lại ${member.guild.memberCount} thành viên` })
    .setTimestamp();
}

module.exports = { createWelcomeEmbed, createGoodbyeEmbed };
