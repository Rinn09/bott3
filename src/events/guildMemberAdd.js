const { createWelcomeEmbed } = require("../utils/embedBuilder");
const config = require("../config/botConfig");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
      const config = await GuildConfig.findOne({ guildId: member.guild.id });
      if (!config || !config.welcomeChannelId) return;
  
      const channel = member.guild.channels.cache.get(config.welcomeChannelId);
      if (!channel) return;
  
      // Embed Chào Mừng
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#00FF99')
        .setTitle(`Chào mừng ${member.user.username} đã đến với ${member.guild.name}! 🎉`)
        .setDescription(`Chúng mình rất vui khi bạn gia nhập!\n\n> 👉 Hãy đọc nội quy và chọn giới tính/game yêu thích nhé!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
  
      // 3 Button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('📖 Xem Nội Quy')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${member.guild.id}/${config.rulesChannelId}`), // ⭐ Link nội quy
          new ButtonBuilder()
            .setCustomId('select-gender')
            .setLabel('🧑 Chọn Giới Tính')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('select-game')
            .setLabel('🎮 Chọn Game')
            .setStyle(ButtonStyle.Success)
        );
  
      await channel.send({ 
        content: `🎊 Xin chào <@${member.id}>!`,
        embeds: [welcomeEmbed],
        components: [row]
      });
    }
  };