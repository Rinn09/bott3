const Logger = require("../utils/logger");
const {
  handleJobLevelUp,
  calculateSalaryForJobLevel,
} = require("../utils/jobUtil");

module.exports = {
  taskId: "completerepairorder",
  jobName: "thợ sửa xe",
  // Hàm này sẽ được gọi từ lệnh /race repair complete sau khi đơn hàng đã được xử lý thành công
  // Nó chỉ chịu trách nhiệm cộng XP, danh tiếng và có thể là bonus lương nghề cho thợ
  async executeTask(
    interaction,
    mechanicUser,
    jobDefinition,
    taskDefinition,
    repairOrderData,
  ) {
    // mechanicUser: User document của người thợ
    // jobDefinition: Định nghĩa của nghề "Thợ Sửa Xe"
    // taskDefinition: Định nghĩa của task "completeRepairOrder"
    // repairOrderData: Dữ liệu của RepairOrder vừa hoàn thành (bao gồm offeredReward, carModelName, etc.)

    const jobXpReward = taskDefinition.reward?.jobXp || 0;
    let jobReputationReward = taskDefinition.reward?.jobReputation || 0;
    let moneyBonusFromJobLevel = 0;

    // Tăng danh tiếng dựa trên độ hiếm của xe đã sửa (ví dụ)
    // Cần truyền carRarity vào repairOrderData hoặc query lại CarModel
    if (repairOrderData.carRarity === "rare") jobReputationReward += 5;
    if (repairOrderData.carRarity === "epic") jobReputationReward += 10;

    mechanicUser.mainJob.xp = (mechanicUser.mainJob.xp || 0) + jobXpReward;
    mechanicUser.mainJob.reputation =
      (mechanicUser.mainJob.reputation || 0) + jobReputationReward;

    // Tính bonus lương theo level nghề (nếu task này có salaryByLevel trong MainJobModel)
    // Giả sử MainJobModel.salaryByLevel áp dụng cho task chính là "Hoàn thành đơn sửa"
    // Hoặc taskDefinition.reward.money = 0 để kích hoạt salaryByLevel
    if (taskDefinition.reward?.money === 0 && jobDefinition.salaryByLevel) {
      moneyBonusFromJobLevel = await calculateSalaryForJobLevel(
        jobDefinition.name,
        mechanicUser.mainJob.level,
      );
      if (moneyBonusFromJobLevel > 0) {
        mechanicUser.balance += moneyBonusFromJobLevel;
        mechanicUser.totalEarned += moneyBonusFromJobLevel;
      }
    }

    const leveledUp = await handleJobLevelUp(mechanicUser);
    // mechanicUser.save() sẽ được gọi ở lệnh /race repair complete sau khi gọi hàm này

    // Hàm này có thể không cần trả về embed, mà chỉ cập nhật user data.
    // Lệnh /race repair complete sẽ tự tạo embed thông báo.
    // Tuy nhiên, nếu muốn, có thể tạo một log nhỏ ở đây.
    Logger.info(
      `[Task/${this.taskId}] Mechanic ${mechanicUser.userId} received job rewards for completing order ${repairOrderData._id}. XP: +${jobXpReward}, Rep: +${jobReputationReward}, BonusSalary: +${moneyBonusFromJobLevel}`,
    );

    return {
      jobXpGained: jobXpReward,
      reputationGained: jobReputationReward,
      bonusSalary: moneyBonusFromJobLevel,
      leveledUpData: leveledUp && leveledUp.leveledUp ? leveledUp : null,
    };
  },
};
