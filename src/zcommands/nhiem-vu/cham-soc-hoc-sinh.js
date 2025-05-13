const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const MainJob = require('../../models/MainJob');
const { handleJobLevelUp, getRequiredXPForLevel } = require('../../utils/jobUtil');
const Logger = require('../../utils/logger');

const TASK_ID = 'chamSocHocSinh'; // Giữ nguyên
const JOB_NAME = 'giáo viên'; // **Sửa thành chữ thường**

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cham-soc-hoc-sinh') // **Sửa tên lệnh cho đúng với TASK_ID**
    .setDescription('Trông lũ súc vật, nhiệm vụ dành cho giáo viên!'), // **Sửa mô tả cho đúng với JOB_NAME**

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    await interaction.deferReply({ ephemeral: false }); // Defer reply

    try {
      const user = await User.findOne({ userId, guildId });
      const jobData = await MainJob.findOne({ name: JOB_NAME }); // Query bằng chữ thường

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

      const task = jobData.tasks?.find(t => t.taskId === TASK_ID);
      if (!task) {
        return interaction.editReply(`❌ Không tìm thấy nhiệm vụ ${TASK_ID} cho nghề ${jobData.name}.`);
      }

      const cooldownTime = task.cooldown || (5 * 60 * 1000);
      const xpGain = task.xp || 20;
      // **SỬA LOGIC REWARD:** Lấy từ task.reward
      const rewardAmount = task.reward || 0;

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
      // **SỬA CỘNG TIỀN:** Dùng rewardAmount
      user.balance = (user.balance || 0) + rewardAmount;
      user.totalEarned = (user.totalEarned || 0) + rewardAmount;

      const leveledUp = await handleJobLevelUp(user);
      await user.save();

      const requiredXP = getRequiredXPForLevel(user.mainJob.level);
      const embed = new EmbedBuilder()
        .setTitle(`🎒 ${task.name} thành công!`)
        .setColor('#32CD32')
        .setDescription(
          `+💧 **${xpGain} XP**\n` +
          // Chỉ hiển thị tiền nếu rewardAmount > 0
          (rewardAmount > 0 ? `+💰 **${rewardAmount.toLocaleString()} VNĐ**\n` : '') +
          `📊 XP hiện tại: **${user.mainJob.xp}/${requiredXP}**`
        );

      if (leveledUp) {
        embed.addFields({ name: '📈 Thăng cấp!', value: `Bạn đã đạt cấp **${user.mainJob.level}**!` });
      }

      // Thay đổi thành editReply vì đã defer
      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Lỗi lệnh ${TASK_ID}: ${error.message}`, { stack: error.stack });
      // Đảm bảo editReply nếu đã defer
      if (interaction.deferred || interaction.replied) {
         await interaction.editReply({ content: `❌ Có lỗi xảy ra khi thực hiện nhiệm vụ ${task?.name || TASK_ID}.` });
      } else {
         // Trường hợp này ít xảy ra vì đã defer ở đầu
         await interaction.reply({ content: `❌ Có lỗi xảy ra khi thực hiện nhiệm vụ ${task?.name || TASK_ID}.`, ephemeral: true});
      }
    }
  }
};