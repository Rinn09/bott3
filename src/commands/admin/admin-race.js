// src/commands/admin/adminRace.js (Hoặc trong bot-administration.js)
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-race") // Hoặc tên lệnh admin chung của bro
    .setDescription("[Admin] Các lệnh quản lý liên quan đến hệ thống đua xe.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup-repair-channel")
        .setDescription("Cài đặt kênh để nhận thông báo về các đơn sửa xe mới.")
        .addChannelOption(
          (option) =>
            option
              .setName("channel")
              .setDescription("Chọn kênh text để gửi thông báo.")
              .setRequired(true)
              .addChannelTypes(ChannelType.GuildText), // Chỉ cho phép kênh text
        ),
    ),
  // ... (các subcommand admin khác cho đua xe sẽ thêm sau)
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === "setup-repair-channel") {
      await interaction.deferReply({ ephemeral: true });
      const channel = interaction.options.getChannel("channel");

      try {
        const [config, created] = await GuildConfig.findOrCreate(
          { guildId: guildId }, // query
          { guildId: guildId, repairOrdersChannelId: channel.id }, // data to insert if not found
        );

        if (!created) {
          // Nếu config đã tồn tại
          config.repairOrdersChannelId = channel.id;
          await config.save();
        }
        // Nếu created là true, config đã được tạo với channelId rồi

        await interaction.editReply(
          `✅ Đã cài đặt kênh thông báo đơn sửa xe là ${channel}. Các yêu cầu sửa xe mới sẽ được gửi vào đây.`,
        );
        Logger.info(
          `[AdminRace/SetupRepairChannel] Repair order channel set to ${channel.name} (${channel.id}) in guild ${guildId} by ${interaction.user.tag}.`,
        );
      } catch (error) {
        Logger.error(
          `Lỗi lệnh /admin-race setup-repair-channel: ${error.message}`,
          { stack: error.stack },
        );
        await interaction.editReply(
          "❌ Đã xảy ra lỗi khi cài đặt kênh thông báo.",
        );
      }
    }
    // ... (xử lý các subcommand admin khác)
  },
};
