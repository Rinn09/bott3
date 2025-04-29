const GuildConfig = require("../models/GuildConfig");
const { createWelcomeEmbed } = require("../utils/embedBuilder");
const botConfig = require("../config/botConfig");

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildConfig = await GuildConfig.findOne({ guildId: member.guild.id });

    if (!guildConfig?.welcomeChannelId || !guildConfig?.rulesChannelId) return;

    const channel = member.guild.channels.cache.get(guildConfig.welcomeChannelId);
    if (!channel) return;

    // 🌟 Random câu chào & ảnh từ botConfig
    const messageTemplate = botConfig.welcomeMessages[Math.floor(Math.random() * botConfig.welcomeMessages.length)];
    const image = botConfig.welcomeImages[Math.floor(Math.random() * botConfig.welcomeImages.length)];

    const message = messageTemplate
      .replace("{user}", `<@${member.id}>`)
      .replace("{server}", member.guild.name);

    const { embed, row } = createWelcomeEmbed(member, guildConfig.rulesChannelId, message, image);
    await channel.send({ embeds: [embed], components: [row] });
  }
};
