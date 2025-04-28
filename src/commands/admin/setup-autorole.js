const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-autorole')
    .setDescription('Cài đặt role tự động tặng khi thành viên mới tham gia.')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Chọn role muốn tặng.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const role = interaction.options.getRole('role');

    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
      config = new GuildConfig({ guildId: interaction.guild.id });
    }

    config.autoRoleId = role.id;
    await config.save();

    await interaction.reply({
      content: `✅ Đã đặt role tự động tặng là **${role.name}**`,
      ephemeral: true
    });
  }
};
