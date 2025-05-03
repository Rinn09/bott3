const User = require('../models/User');
const Job = require('../models/Job');

module.exports = (client) => {
  // Chạy vòng lặp định kỳ: mỗi 60 giây kiểm tra
  setInterval(async () => {
    try {
      // Tìm tất cả người dùng có công việc (giá trị job.name khác null)
      const usersWithJob = await User.find({ "job.name": { $exists: true, $ne: null } });
      const now = Date.now();
      for (const userData of usersWithJob) {
        // Tìm thông tin công việc từ Job model dựa trên tên
        const job = await Job.findOne({ name: userData.job.name });
        if (!job) continue;
        // Giả sử job.cooldown được lưu là số giờ giữa các lần nhận lương
        const cooldownMs = job.cooldown * 3600000; // chuyển giờ → mili giây
        // Nếu chưa có lastSalary thì sử dụng thời gian nhận việc
        const lastSalaryTime = userData.job.lastSalary ? new Date(userData.job.lastSalary).getTime() : new Date(userData.job.hiredAt).getTime();
        // Nếu thời gian đã trôi qua vượt quá cooldown, gửi DM nhắc nhở
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
            console.error(`Không thể gửi DM cho user ${userData.userId}:`, err.message);
          }
        }
      }
    } catch (error) {
      console.error('[SalaryReminder Error]', error);
    }
  }, 60000); // kiểm tra mỗi 60 giây
};