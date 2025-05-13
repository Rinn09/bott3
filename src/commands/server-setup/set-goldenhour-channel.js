const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-goldenhour-channel")
    .setDescription("Cài đặt kênh nhận thông báo Giờ Vàng Gacha.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Chọn kênh để gửi thông báo Giờ Vàng.")
        .addChannelTypes(ChannelType.GuildText) // Chỉ cho phép chọn kênh text
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    await interaction.deferReply({ ephemeral: true });

    try {
      let config = await GuildConfig.findOne({ guildId: guildId });
      if (!config) {
        config = new GuildConfig({ guildId: guildId });
      }

      config.goldenHourChannelId = channel.id;
      await config.save();

      const successEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("✅ Cài đặt thành công!")
        .setDescription(
          `Kênh thông báo Giờ Vàng Gacha đã được đặt thành ${channel}.`,
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
      Logger.info(
        `Golden Hour announcement channel set to ${channel.name} (${channel.id}) in guild ${interaction.guild.name} (${guildId}) by ${interaction.user.tag}`,
      );
    } catch (error) {
      Logger.error(
        `Error setting Golden Hour channel for guild ${guildId}: ${error.message}`,
        { stack: error.stack },
      );
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("❌ Lỗi!")
        .setDescription(
          "Đã xảy ra lỗi khi cố gắng cài đặt kênh thông báo Giờ Vàng.",
        )
        .setTimestamp();
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
