const GuildConfig = require('../models/GuildConfig');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config || !config.roleMessageIds) return;

    const { gender: genderMsgId, game: gameMsgId } = config.roleMessageIds;

    // Emoji ID → Role ID
    const genderMap = {
      '1121035179234955354': '1366311768934187068', // Nam
      '1121035207668154460': '1154763283534983219'  // Nữ
    };

    const gameMap = {
      '1366804078285291530': '1029342568581972018', // Valorant
      '1366804076385533983': '1209129047729377331', // Minecraft
      '1366804070601588879': '1118388130542796891', // PUBG
      '1366804063513084075': '1118387847137857616', // CS2
      '1366804058937102396': '1034514711410118726', // DST
      '1366803266444329051': '1029342342685130785'  // Genshin
    };

    const emojiId = reaction.emoji.id;

    let roleId = null;
    if (reaction.message.id === genderMsgId) roleId = genderMap[emojiId];
    if (reaction.message.id === gameMsgId) roleId = gameMap[emojiId];

    if (roleId) {
      const role = guild.roles.cache.get(roleId);
      console.log('[REACTION] Detected emoji:', emojiId);
      console.log('[REACTION] Matched roleId:', roleId);
      console.log('[REACTION] Target member:', member.user.tag);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(err => console.error('[ERROR ADDING ROLE]', err));
      }
    }
  }
};
