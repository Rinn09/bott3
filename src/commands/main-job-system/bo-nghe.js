const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../models/User');

const COOLDOWN_TIME = 48 * 60 * 60 * 1000; // 48 giờ

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bo_nghe')
    .setDescription('Nghỉ làm!'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const userData = await User.findOne({ userId, guildId });
    if (!userData || !userData.mainJob || !userData.mainJob.name) {
      return interaction.reply({ content: '❌ Thất nghiệp đòi nghỉ việc?.', ephemeral: false });
    }

    const now = Date.now();
    const lastQuitTime = userData.mainJob.lastQuit || 0;

    // Kiểm tra cooldown
    if (now - lastQuitTime < COOLDOWN_TIME) {
      const remaining = COOLDOWN_TIME - (now - lastQuitTime);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return interaction.reply({
        content: `⏳ Bạn cần chờ thêm **${hours} giờ ${minutes} phút** trước khi có thể nghỉ việc tiếp.`,
        ephemeral: false
      });
    }

    // Tạo embed xác nhận
    const embed = new EmbedBuilder()
      .setTitle('❓ Xác nhận nghỉ việc')
      .setDescription(`Bạn có chắc chắn muốn nghỉ việc **${userData.mainJob.name}** không?`)
      .setColor('Yellow');

    // Tạo nút xác nhận
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_quit_job')
        .setLabel('Xác nhận')
        .setStyle(ButtonStyle.Danger)
    );

    // Gửi tin nhắn embed kèm nút
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });

    // Tạo collector để xử lý khi người dùng nhấn nút
    const filter = (i) => i.customId === 'confirm_quit_job' && i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 }); // 15 giây

    collector.on('collect', async (buttonInteraction) => {
      try {
        // Xóa nghề chính và cập nhật thời gian nghỉ việc
        const oldJob = userData.mainJob.name;
        userData.mainJob = null;
        userData.mainJob = { lastQuit: now }; // Lưu thời gian nghỉ việc
        await userData.save();

        await buttonInteraction.update({
          content: `✅ Bạn đã nghỉ việc **${oldJob}**. Chúc bạn sớm tìm được con đường mới!`,
          embeds: [],
          components: []
        });
      } catch (error) {
        console.error('Error while quitting job:', error);
        await buttonInteraction.update({
          content: '❌ Có lỗi xảy ra khi nghỉ việc. Vui lòng thử lại sau.',
          embeds: [],
          components: []
        });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: '❌ Bạn đã không xác nhận nghỉ việc. Lệnh đã bị hủy.',
          embeds: [],
          components: []
        });
      }
    });
  }
};
