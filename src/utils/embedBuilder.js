const { EmbedBuilder } = require('discord.js');

function createWelcomeEmbed(member, message, image) {
  return new EmbedBuilder()
    .setColor("#00FF00")
    .setTitle("🎉 Thành viên mới!")
    .setDescription(message)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage(image)
    .setFooter({ text: `Thành viên số ${member.guild.memberCount}` })
    .setTimestamp();
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
