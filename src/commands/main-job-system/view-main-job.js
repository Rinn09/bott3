const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const MainJob = require('../../models/MainJob');
const { calculateSalaryForJobLevel, getRequiredXPForLevel } = require('../../utils/jobUtil');
const Logger = require('../../utils/logger'); // Đảm bảo import Logger

function formatDuration(ms) {
    if (ms <= 0) return 'Sẵn sàng';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    let durationString = '';
    if (minutes > 0) durationString += `${minutes} phút `;
    if (seconds > 0 || minutes === 0) durationString += `${seconds} giây`;
    return durationString.trim();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view-main-job')
    .setDescription('Xem thông tin và trạng thái nghề chính của bạn.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    await interaction.deferReply(); // Không sử dụng fetchReply

    try {
      const user = await User.findOne({ userId, guildId });

      if (!user) {
        return interaction.editReply('Không tìm thấy dữ liệu của bạn.');
      }
      if (!user.mainJob || !user.mainJob.name) {
        return interaction.editReply('❌ Bạn chưa có nghề chính.');
      }

      const jobName = user.mainJob.name;
      Logger.info(`[View Job Debug] user.mainJob.name is: "${jobName}" (Type: ${typeof jobName})`);
      const jobLevel = user.mainJob.level || 1;
      const jobXP = user.mainJob.xp || 0;

      const jobData = await MainJob.findOne({ name: jobName.toLowerCase() });
      if (!jobData) {
        return interaction.editReply(`❌ Không tìm thấy thông tin cho nghề ${jobName}.`);
      }

      const xpRequired = getRequiredXPForLevel(jobLevel);
      const currentSalary = await calculateSalaryForJobLevel(jobName, jobLevel);

      const embed = new EmbedBuilder()
        .setTitle(`📘 Thông tin nghề: ${jobName}`)
        .setColor('Blue')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '📈 Cấp độ', value: `${jobLevel}`, inline: true },
          { name: '💼 Lương Hiện Tại', value: `${currentSalary.toLocaleString()} VNĐ`, inline: true },
          { name: '🔋 XP', value: `${jobXP}/${xpRequired}`, inline: true },
          { name: '🗓️ Ngày nhận việc', value: user.mainJob.hiredAt ? `<t:${Math.floor(user.mainJob.hiredAt.getTime() / 1000)}:R>` : 'Không rõ', inline: false }
        );

      let taskStatusDescription = '';
      const now = Date.now();
      if (jobData.tasks && jobData.tasks.length > 0) {
        taskStatusDescription += '**🕒 Trạng thái nhiệm vụ:**\n';
        for (const task of jobData.tasks) {
          const lastUsedTimestamp = user.mainJob.taskCooldowns?.get(task.taskId) || 0;
          const taskCooldownDuration = task.cooldown || 0;
          const remainingCooldownMs = Math.max(0, taskCooldownDuration - (now - lastUsedTimestamp));
          const status = remainingCooldownMs === 0 ? '✅ Sẵn sàng' : `⏳ ${formatDuration(remainingCooldownMs)}`;
          taskStatusDescription += `• ${task.name}: ${status}\n`;
        }
      } else {
        taskStatusDescription = '*Nghề này hiện chưa có nhiệm vụ nào.*';
      }
      embed.addFields({ name: 'Trạng thái nhiệm vụ', value: taskStatusDescription, inline: false });

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Lỗi lệnh view-main-job: ${error.message}`, { stack: error.stack });
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ Có lỗi xảy ra khi xem thông tin nghề.', embeds: [], components: [] });
      } else {
        await interaction.reply({ content: '❌ Có lỗi xảy ra khi xem thông tin nghề.', ephemeral: false });
      }
    }
  }
};