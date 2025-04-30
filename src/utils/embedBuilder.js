const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createWelcomeEmbed(member, ruleChannelId, roleChannelId, message, image) {
  const embed = new EmbedBuilder()
    .setColor('#00ff99')
    .setTitle('👋 Chào mừng bạn đến với server!')
    .setDescription(message)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage(image)
    .setFooter({ text: `${member.guild.name}`, iconURL: member.guild.iconURL() });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('📖 Nội quy')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${member.guild.id}/${ruleChannelId}`),

    new ButtonBuilder()
      .setLabel('🧑‍💼 Pick Your Role')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${member.guild.id}/${roleChannelId}`)
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
