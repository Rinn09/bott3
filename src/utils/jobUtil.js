const MainJob = require('../models/MainJob'); // Import model

function getRequiredXPForLevel(level) {
  // Giữ lại công thức tính XP level bạn muốn (ví dụ: level * 100)
  return level * 100;
}

async function handleJobLevelUp(user) {
  if (!user.mainJob || !user.mainJob.name) return false; // Kiểm tra user có mainJob không

  const currentLevel = user.mainJob.level || 1;
  const requiredXP = getRequiredXPForLevel(currentLevel);

  if (user.mainJob.xp >= requiredXP) {
    user.mainJob.level += 1;
    user.mainJob.xp -= requiredXP; // Trừ XP đã dùng
    // Có thể thêm logic thưởng khi lên cấp nghề ở đây
    return true; // Đã lên cấp
  }
  return false; // Chưa đủ XP
}

async function calculateSalaryForJobLevel(jobName, level) {
    const jobData = await MainJob.findOne({ name: jobName });
    if (!jobData || !jobData.salaryByLevel) return 0;

    // Lấy lương từ Map salaryByLevel, nếu không có level cụ thể, lấy level cao nhất có thể
    let salary = jobData.salaryByLevel.get(String(level));
    if (salary === undefined) {
        // Tìm level cao nhất trong Map nhỏ hơn hoặc bằng level hiện tại
        const availableLevels = Array.from(jobData.salaryByLevel.keys()).map(Number).sort((a, b) => b - a);
        const applicableLevel = availableLevels.find(l => l <= level);
        salary = applicableLevel ? jobData.salaryByLevel.get(String(applicableLevel)) : 0;
    }
    return salary || 0; // Trả về 0 nếu không tìm thấy mức lương phù hợp
}

module.exports = {
  handleJobLevelUp,
  getRequiredXPForLevel, // Đổi tên hàm để rõ ràng hơn
  calculateSalaryForJobLevel // Đổi tên hàm
};