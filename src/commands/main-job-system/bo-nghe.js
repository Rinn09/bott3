const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bo_nghe')
    .setDescription('Nghỉ làm!.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const userData = await User.findOne({ userId, guildId });
    if (!userData || !userData.mainJob || !userData.mainJob.name) {
      return interaction.reply({ content: '❌ Thất nghiệp đòi nghỉ việc?.', ephemeral: false });
    }

    const oldJob = userData.mainJob.name;
    userData.mainJob = null;
    await userData.save();

    return interaction.reply(`✅ Bạn đã nghỉ việc **${oldJob}**. Chúc bạn sớm tìm được con đường mới!`);
  }
};
