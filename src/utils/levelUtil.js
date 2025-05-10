function checkLevelUp(userData) {
  let leveledUp = false;
  let totalReward = 0;
  let levelUpCount = 0;

  while (true) {
    const xpNeeded = getLevelXp(userData.level);
    if (userData.xp >= xpNeeded) {
      userData.xp -= xpNeeded;
      userData.level += 1;
      leveledUp = true;
      levelUpCount++;
      const reward = 1000 * userData.level;
      userData.balance += reward;
      totalReward += reward;
    } else {
      break;
    }
  }

  return leveledUp
    ? {
        leveledUp: true,
        newLevel: userData.level,
        reward: totalReward,
        levelUpCount,
      }
    : { leveledUp: false };
}
