const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const MainJob = require('../../models/MainJob'); // Đảm bảo đường dẫn đúng

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chon_nghe')
    .setDescription('Chọn một nghề chính từ danh sách có sẵn.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    try {
      // Lấy danh sách nghề có sẵn từ DB
      const jobs = await MainJob.find({});
      if (!jobs.length) {
        return interaction.reply({ content: '❌ Hiện chưa có nghề nào trong hệ thống.', ephemeral: true });
      }

      // Kiểm tra xem người dùng đã có nghề chưa
      let userData = await User.findOne({ userId, guildId });
      if (!userData) {
          userData = await User.create({ userId, guildId }); // Tạo user nếu chưa có
      }

      if (userData.mainJob && userData.mainJob.name) {
        return interaction.reply({ content: `❌ Bạn đang làm nghề **${userData.mainJob.name}** rồi. Hãy dùng \`/bo_nghe\` trước khi chọn nghề mới.`, embeds: [], components: [], ephemeral: true });
      }

      // Tạo embed hiển thị danh sách nghề
      const jobList = jobs.map(job => `• **${job.name}**: ${job.description || ''}`).join('\n');
      const embed = new EmbedBuilder()
        .setTitle('Chọn Nghề Chính')
        .setDescription(`Danh sách nghề hiện có:\n\n${jobList}\n\nHãy chọn một nghề từ menu bên dưới:`)
        .setColor(0x00AE86);

      // Tạo select menu với các option là tên nghề
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-main-job') // ID này cần được xử lý trong interactionHandler hoặc trực tiếp ở đây
        .setPlaceholder('Chọn nghề của bạn')
        .addOptions(
          jobs.map(job => ({
            label: job.name,
            value: job.name, // Value là tên nghề để query lại
            description: job.description?.substring(0, 100) || '',
          }))
        );

      const actionRow = new ActionRowBuilder().addComponents(selectMenu);

      // Gửi tin nhắn kèm select menu
      const reply = await interaction.reply({ embeds: [embed], components: [actionRow] });

      // Tạo collector cho select menu
      const filter = i => i.customId === 'select-main-job' && i.user.id === userId;
      // Tăng thời gian chờ lên 2 phút
      const collector = reply.createMessageComponentCollector({ filter, time: 120000 });

      collector.on('collect', async (selectInteraction) => {
        try {
            const selectedJobName = selectInteraction.values[0];
            const jobData = await MainJob.findOne({ name: selectedJobName }); // Query bằng tên đã chọn

            if (!jobData) {
              await selectInteraction.update({ content: `❌ Nghề **${selectedJobName}** không tồn tại hoặc có lỗi xảy ra.`, embeds: [], components: [] });
              return collector.stop(); // Dừng collector nếu có lỗi
            }

            // Lấy lại dữ liệu user mới nhất phòng trường hợp có thay đổi
            userData = await User.findOne({ userId, guildId });
             if (!userData) { // Nếu user bị xóa trong lúc chờ? (hiếm)
                await selectInteraction.update({ content: `❌ Không tìm thấy dữ liệu người dùng.`, embeds: [], components: [] });
                return collector.stop();
            }

            // Kiểm tra lại lần nữa trước khi cập nhật
            if (userData.mainJob && userData.mainJob.name) {
                await selectInteraction.update({ content: '❌ Bạn đã có nghề rồi! Hãy `/bo_nghe` trước.', embeds: [], components: [] });
                return collector.stop();
            }

            // Cập nhật mainJob cho user
            userData.mainJob = {
              name: jobData.name,
              level: 1,
              xp: 0,
              lastSalary: null, // Reset lastSalary
              hiredAt: new Date(),
              taskCooldowns: new Map() // Khởi tạo Map cooldowns rỗng
            };
            await userData.save();

            await selectInteraction.update({ content: `✅ Bạn đã chọn làm **${jobData.name}**! Hãy bắt đầu sự nghiệp nào!`, embeds: [], components: [] });
             collector.stop(); // Dừng collector sau khi xử lý thành công
        } catch (collectError) {
             console.error("Lỗi khi xử lý chọn nghề:", collectError);
             await selectInteraction.followUp({ content: '❌ Có lỗi xảy ra khi chọn nghề.', ephemeral: true }).catch(() => {});
             collector.stop(); // Dừng collector khi có lỗi
        }
      });

      collector.on('end', (collected, reason) => {
        // Chỉ cập nhật nếu lý do kết thúc là 'time' và chưa có ai chọn
        if (reason === 'time' && collected.size === 0) {
          interaction.editReply({ content: '⌛ Bạn đã không lựa chọn nghề trong thời gian cho phép.', embeds: [], components: [] }).catch(() => {}); // Bỏ nút đi
        }
        // Nếu đã collect thì không cần làm gì thêm ở đây
      });

    } catch (error) {
      console.error("Lỗi khi thực thi lệnh chon_nghe:", error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Có lỗi xảy ra khi thực thi lệnh.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Có lỗi xảy ra khi thực thi lệnh.', ephemeral: true });
      }
    }
  }
};