// Function to calculate XP needed for the next level
function getLevelXp(currentLevel) {
  // Example formula: 150 XP per level, or more complex like 100 * (currentLevel ^ 1.2)
  // For simplicity, let's use 150 * currentLevel
  if (currentLevel <= 0) return 150; // Base case for level 0 or invalid
  return Math.floor(150 * currentLevel);
}

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
module.exports = {
  checkLevelUp,
  getLevelXp, // Export thêm getLevelXp
};
