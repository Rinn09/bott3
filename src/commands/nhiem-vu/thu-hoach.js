const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const MainJob = require('../../models/MainJob');
// **IMPORT THÊM HÀM TÍNH LƯƠNG**
const { handleJobLevelUp, getRequiredXPForLevel, calculateSalaryForJobLevel } = require('../../utils/jobUtil');
const Logger = require('../../utils/logger');

// **SỬA TASK_ID VÀ JOB_NAME**
const TASK_ID = 'thuHoach'; // Sửa thành camelCase để khớp với seed
const JOB_NAME = 'nông dân'; // Sửa thành chữ thường

module.exports = {
  data: new SlashCommandBuilder()
    .setName('thu-hoach')
    .setDescription('Thu hoạch cây trồng để nhận lương, nhiệm vụ dành cho nông dân!'), // Cập nhật mô tả

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    await interaction.deferReply({ ephemeral: false }); // Defer reply

    try {
      const user = await User.findOne({ userId, guildId });
      const jobData = await MainJob.findOne({ name: JOB_NAME }); // Query chữ thường

      // --- Logging và kiểm tra user/jobData (giữ nguyên) ---
      if (!user) {
         return interaction.editReply('Không tìm thấy dữ liệu của bạn.');
      }
      if (!jobData) {
         return interaction.editReply(`❌ Hệ thống chưa định nghĩa nghề ${JOB_NAME}.`);
      }
       // --- Điều kiện kiểm tra nghề (giờ sẽ đúng vì JOB_NAME là chữ thường) ---
      if (!user.mainJob || !user.mainJob.name || user.mainJob.name.trim().toLowerCase() !== JOB_NAME) {
        Logger.warn(`[Job Check Failed - ${interaction.commandName}] User: ${userId}, Stored Job: '${user?.mainJob?.name}', Expected: '${JOB_NAME}'`);
        return interaction.editReply({ 
          content: `❌ Lệnh này chỉ dành cho nghề **${jobData.name}**. (Nghề của bạn hiện tại: **${user?.mainJob?.name || 'Không có'}**)` 
        });
      }


      const task = jobData.tasks?.find(t => t.taskId === TASK_ID); // Tìm task bằng TASK_ID đã sửa
      if (!task) {
        return interaction.editReply(`❌ Không tìm thấy nhiệm vụ ${TASK_ID} cho nghề ${jobData.name}.`);
      }

      const cooldownTime = task.cooldown || (120 * 60 * 1000); // Lấy cooldown từ task thu hoạch
      const xpGain = task.xp || 50; // Lấy XP từ task thu hoạch

      // **SỬA LOGIC REWARD:** Tính lương theo cấp độ nghề
      const salaryEarned = await calculateSalaryForJobLevel(JOB_NAME, user.mainJob.level);

      const now = Date.now();
      const lastUsed = user.mainJob.taskCooldowns?.get(TASK_ID) || 0;

      if (now - lastUsed < cooldownTime) {
        const remaining = cooldownTime - (now - lastUsed);
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        return interaction.editReply({ content: `⏳ Hãy đợi **${m} phút ${s} giây** nữa để ${task.name.toLowerCase()} lần tiếp theo.` });
      }

      if (!user.mainJob.taskCooldowns) user.mainJob.taskCooldowns = new Map();
      user.mainJob.taskCooldowns.set(TASK_ID, now);

      user.mainJob.xp = (user.mainJob.xp || 0) + xpGain;
      // **SỬA CỘNG TIỀN:** Dùng salaryEarned
      user.balance = (user.balance || 0) + salaryEarned;
      user.totalEarned = (user.totalEarned || 0) + salaryEarned;

      const leveledUp = await handleJobLevelUp(user);
      await user.save();

      const requiredXP = getRequiredXPForLevel(user.mainJob.level);
      const embed = new EmbedBuilder()
        .setTitle(`🌾 ${task.name} thành công!`) // Cập nhật tiêu đề
        .setColor('#4EEE94')
        .setDescription(
          `+💧 **${xpGain} XP**\n` +
          // **SỬA HIỂN THỊ TIỀN:** Hiển thị salaryEarned
          (salaryEarned > 0 ? `+💰 **${salaryEarned.toLocaleString()} VNĐ** (Lương theo cấp độ)\n` : '') +
          `📊 XP hiện tại: **${user.mainJob.xp}/${requiredXP}**`
        );

      if (leveledUp) {
        // Tính lại lương mới sau khi lên cấp để hiển thị (tùy chọn)
        const newSalary = await calculateSalaryForJobLevel(JOB_NAME, user.mainJob.level);
        embed.addFields({ name: '📈 Thăng cấp!', value: `Bạn đã đạt cấp **${user.mainJob.level}**!` });
      }

      // Thay đổi thành editReply
      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Lỗi lệnh ${TASK_ID}: ${error.message}`, { stack: error.stack });
       // Đảm bảo editReply nếu đã defer
      if (interaction.deferred || interaction.replied) {
         await interaction.editReply({ content: `❌ Có lỗi xảy ra khi thực hiện nhiệm vụ ${task?.name || TASK_ID}.` });
      } else {
         await interaction.reply({ content: `❌ Có lỗi xảy ra khi thực hiện nhiệm vụ ${task?.name || TASK_ID}.`, ephemeral: true});
      }
    }
  }
};