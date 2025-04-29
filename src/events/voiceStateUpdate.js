const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const config = await GuildConfig.findOne({ guildId: newState.guild.id });
    if (!config || !config.logChannelId) return;

    const logChannel = newState.guild.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    // Kiểm tra join hoặc leave voice channel
    if (!oldState.channelId && newState.channelId) {
      // Người dùng join voice channel
      const logEmbed = new EmbedBuilder()
        .setColor('#00FF99')
        .setTitle('🎤 Thành viên join voice channel!')
        .setDescription(`${newState.member.user.tag} đã tham gia voice channel ${newState.channel.name}.`)
        .addFields(
          { name: 'Tên người dùng:', value: newState.member.user.tag, inline: true },
          { name: 'ID người dùng:', value: newState.member.user.id, inline: true },
          { name: 'Channel:', value: newState.channel.name, inline: true }
        )
        .setTimestamp()
        .setThumbnail(newState.member.user.displayAvatarURL({ dynamic: true }));

      await logChannel.send({ embeds: [logEmbed] });
    } else if (oldState.channelId && !newState.channelId) {
      // Người dùng leave voice channel
      const logEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎤 Thành viên rời voice channel!')
        .setDescription(`${oldState.member.user.tag} đã rời khỏi voice channel ${oldState.channel.name}.`)
        .addFields(
          { name: 'Tên người dùng:', value: oldState.member.user.tag, inline: true },
          { name: 'ID người dùng:', value: oldState.member.user.id, inline: true },
          { name: 'Channel:', value: oldState.channel.name, inline: true }
        )
        .setTimestamp()
        .setThumbnail(oldState.member.user.displayAvatarURL({ dynamic: true }));

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
};
