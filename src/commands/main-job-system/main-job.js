const { SlashCommandBuilder, 
        ActionRowBuilder, 
        StringSelectMenuBuilder, 
        EmbedBuilder 
      } = require('discord.js');
const User = require('../../models/User');
const MainJob = require('../../models/MainJob');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chon_nghe')
    .setDescription('Chọn một nghề chính từ danh sách có sẵn.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    // Lấy danh sách nghề có sẵn từ DB
    const jobs = await MainJob.find({});
    if (!jobs.length) {
      return interaction.reply({ content: '❌ Hiện chưa có nghề nào trong hệ thống.', ephemeral: true });
    }

    // Tạo embed hiển thị danh sách nghề
    const jobList = jobs.map(job => `• **${job.name}**`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('Chọn Nghề Chính')
      .setDescription(`Danh sách nghề hiện có:\n\n${jobList}\n\nHãy chọn một nghề từ menu bên dưới:`)
      .setColor(0x00AE86);

    // Tạo select menu với các option là tên nghề
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-main-job')
      .setPlaceholder('Chọn nghề của bạn')
      .addOptions(
        jobs.map(job => ({
          label: job.name,
          value: job.name,
          description: job.description || '',  // Nếu job có mô tả
        }))
      );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [embed], components: [actionRow] });

    // Tạo collector cho select menu, chỉ bắt tương tác từ người dùng đã dùng lệnh
    const filter = i => i.customId === 'select-main-job' && i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async (selectInteraction) => {
      const selectedJobName = selectInteraction.values[0];
      const jobData = await MainJob.findOne({ name: new RegExp(`^${selectedJobName}$`, 'i') });
      if (!jobData) {
        return selectInteraction.update({ content: `❌ Nghề **${selectedJobName}** không tồn tại.`, embeds: [], components: [] });
      }

      let userData = await User.findOne({ userId, guildId });
      if (!userData) {
        // Tạo user nếu chưa có
        userData = await User.create({ userId, guildId, balance: 0, bank: 0, xp: 0, level: 1 });
      }

      if (userData.mainJob && userData.mainJob.name) {
        return selectInteraction.update({ content: '❌ Con người không làm 1 lần 2 việc được! Hãy `/bo_nghe` trước.', embeds: [], components: [] });
      }

      // Cập nhật mainJob cho user
      userData.mainJob = {
        name: jobData.name,
        level: 1,
        xp: 0,
        lastSalary: null,
        hiredAt: new Date()
      };
      await userData.save();

      return selectInteraction.update({ content: `✅ Bạn đã chọn làm **${jobData.name}**! Hãy bắt đầu sự nghiệp nào!`, embeds: [], components: [] });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({ content: '⌛ Bạn đã không lựa chọn nghề trong thời gian cho phép.', ephemeral: true });
      }
    });
  }
};
