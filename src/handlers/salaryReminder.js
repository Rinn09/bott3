const User = require('../models/User');
const Job = require('../models/Job');
const GuildConfig = require('../models/GuildConfig');  // thêm dòng này để lấy cấu hình server

module.exports = (client) => {
  // Chạy vòng lặp định kỳ: mỗi 60 giây kiểm tra
  setInterval(async () => {
    try {
      // Tìm tất cả người dùng có công việc (job.name không null)
      const usersWithJob = await User.find({ "job.name": { $exists: true, $ne: null } });
      const now = Date.now();
      for (const userData of usersWithJob) {
        const job = await Job.findOne({ name: userData.job.name });
        if (!job) continue;
        // job.cooldown được lưu tính bằng giờ
        const cooldownMs = job.cooldown * 3600000;
        // Nếu chưa có lastSalary thì sử dụng hiredAt
        const lastSalaryTime = userData.job.lastSalary ? new Date(userData.job.lastSalary).getTime() : new Date(userData.job.hiredAt).getTime();
        // Kiểm tra nếu đã hợp lệ để nhận lương
        if (now - lastSalaryTime >= cooldownMs) {
          try {
            const guildConfig = await GuildConfig.findOne({ guildId: userData.guildId });
            if (guildConfig && guildConfig.salaryNotificationChannelId) {
              const notifChannel = await client.channels.fetch(guildConfig.salaryNotificationChannelId);
              if (notifChannel) {
                await notifChannel.send(`🔔 Hey <@${userData.userId}>, bạn đã đến lúc nhận lương từ công việc **${job.name}**. Hãy sử dụng lệnh \`/nhan_luong\` để nhận lương.`);
              }
            }
          } catch (err) {
            console.error(`Không thể gửi thông báo cho user ${userData.userId}:`, err.message);
          }
        }
      }
    } catch (error) {
      console.error('[SalaryReminder Error]', error);
    }
  }, 60000); // kiểm tra mỗi 60 giây
};