const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const User = require('../models/User');
const { checkLevelUp } = require('../utils/levelUtil');

const activeUsers = new Map(); // userId => timestamp

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const member = newState.member;
    if (!member || member.user.bot) return;

    // === Log voice join/leave ===
    const config = await GuildConfig.findOne({ guildId: newState.guild.id });
    if (config?.logChannelId) {
      const logChannel = newState.guild.channels.cache.get(config.logChannelId);
      if (logChannel) {
        if (!oldState.channelId && newState.channelId) {
          const embed = new EmbedBuilder()
            .setColor('#00FF99')
            .setTitle('🎤 Thành viên join voice channel!')
            .setDescription(`${member.user.tag} đã tham gia voice channel ${newState.channel.name}.`)
            .addFields(
              { name: 'Tên người dùng:', value: member.user.tag, inline: true },
              { name: 'ID người dùng:', value: member.user.id, inline: true },
              { name: 'Channel:', value: newState.channel.name, inline: true }
            )
            .setTimestamp()
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

          await logChannel.send({ embeds: [embed] });
        } else if (oldState.channelId && !newState.channelId) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🎤 Thành viên rời voice channel!')
            .setDescription(`${member.user.tag} đã rời khỏi voice channel ${oldState.channel.name}.`)
            .addFields(
              { name: 'Tên người dùng:', value: member.user.tag, inline: true },
              { name: 'ID người dùng:', value: member.user.id, inline: true },
              { name: 'Channel:', value: oldState.channel.name, inline: true }
            )
            .setTimestamp()
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

          await logChannel.send({ embeds: [embed] });
        }
      }
    }

    // === XP tracking ===
    const now = Date.now();
    const key = `${member.guild.id}-${member.id}`;

    if (!oldState.channel && newState.channel) {
      activeUsers.set(key, now);
    }

    if (oldState.channel && !newState.channel) {
      const joinedAt = activeUsers.get(key);
      if (!joinedAt) return;

      const minutes = Math.floor((now - joinedAt) / 1000 / 60);
      const xpGain = Math.floor(minutes / 2);

      if (xpGain > 0) {
        let user = await User.findOne({ userId: member.id, guildId: member.guild.id });
        if (!user) user = await User.create({ userId: member.id, guildId: member.guild.id });

        user.xp += xpGain;
        const levelUp = checkLevelUp(user);
        await user.save();

        const notifyChannel = member.guild.systemChannel || oldState.channel || newState.channel;
        if (levelUp.leveledUp && notifyChannel) {
          notifyChannel.send(`🎉 <@${user.userId}> đã lên cấp **${levelUp.newLevel}** và nhận **${levelUp.reward.toLocaleString()} VNĐ**!`);
        }
      }

      activeUsers.delete(key);
    }
  }
};
