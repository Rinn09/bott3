const GuildConfig = require('../models/GuildConfig');

module.exports = {
  name: 'messageReactionRemove',
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
      '1121035179234955354': '1366311768934187068',
      '1121035207668154460': '1154763283534983219'
    };

    const gameMap = {
      '1366804078285291530': '1029342568581972018',
      '1366804076385533983': '1209129047729377331',
      '1366804070601588879': '1118388130542796891',
      '1366804063513084075': '1118387847137857616',
      '1366804058937102396': '1034514711410118726',
      '1366803266444329051': '1029342342685130785'
    };

    const emojiId = reaction.emoji.id;

    let roleId = null;
    if (reaction.message.id === genderMsgId) roleId = genderMap[emojiId];
    if (reaction.message.id === gameMsgId) roleId = gameMap[emojiId];

    if (roleId) {
      const role = guild.roles.cache.get(roleId);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => {});
      }
    }
  }
};
