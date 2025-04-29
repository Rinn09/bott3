const { createGoodbyeEmbed } = require('../utils/embedBuilder');
const config = require("../config/botConfig");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  name: "guildMemberRemove",
  once: false,
  async execute(member) {
    const guildConfig = await GuildConfig.findOne({ guildId: member.guild.id });
    const channelId = guildConfig?.goodbyeChannelId || config.goodbyeChannelId;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const messageTemplate = config.goodbyeMessages[Math.floor(Math.random() * config.goodbyeMessages.length)];
    const image = config.goodbyeImages[Math.floor(Math.random() * config.goodbyeImages.length)];

    const message = messageTemplate
      .replace("{user}", `<@${member.id}>`)
      .replace("{server}", member.guild.name);

    const embed = createGoodbyeEmbed(member, message, image);
    channel.send({ embeds: [embed] });
  }
};
