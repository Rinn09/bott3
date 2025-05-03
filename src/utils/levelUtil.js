function getLevelXp(level) {
  return level * level * 20;
}

function checkLevelUp(userData) {
  const xpNeeded = getLevelXp(userData.level);
  if (userData.xp >= xpNeeded) {
    userData.level += 1;
    userData.xp -= xpNeeded;
    const reward = 1000 * userData.level;
    userData.balance += reward;
    return {
      leveledUp: true,
      newLevel: userData.level,
      reward
    };
  }
  return { leveledUp: false };
}

module.exports = { getLevelXp, checkLevelUp };
