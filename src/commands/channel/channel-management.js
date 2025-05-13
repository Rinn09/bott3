const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("channel")
    .setDescription("[Admin] Quản lý kênh.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lock")
        .setDescription("Khóa kênh hiện tại (ngăn @everyone gửi tin nhắn).")
        .addChannelOption(
          (
            option, // Cho phép chọn kênh hoặc mặc định kênh hiện tại
          ) =>
            option
              .setName("target_channel")
              .setDescription("Kênh muốn khóa (mặc định là kênh hiện tại).")
              .addChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
              ) // Chỉ kênh text và announcement
              .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unlock")
        .setDescription(
          "Mở khóa kênh hiện tại (cho phép @everyone gửi tin nhắn).",
        )
        .addChannelOption((option) =>
          option
            .setName("target_channel")
            .setDescription("Kênh muốn mở khóa (mặc định là kênh hiện tại).")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildAnnouncement,
            )
            .setRequired(false),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetChannelOption =
      interaction.options.getChannel("target_channel");
    const channelToModify = targetChannelOption || interaction.channel; // Kênh hiện tại nếu không chọn
    const adminUser = interaction.user;

    if (
      !channelToModify ||
      (!channelToModify.isTextBased() && !channelToModify.isThread())
    ) {
      return interaction.reply({
        content: "❌ Lệnh này chỉ áp dụng cho kênh text hoặc thread.",
        ephemeral: true,
      });
    }
    if (
      channelToModify.type === ChannelType.DM ||
      channelToModify.type === ChannelType.GroupDM
    ) {
      return interaction.reply({
        content: "❌ Không thể khóa/mở khóa kênh DM.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false }); // Cho phép public thấy

    try {
      const everyoneRole = interaction.guild.roles.everyone;

      if (subcommand === "lock") {
        await channelToModify.permissionOverwrites.edit(everyoneRole, {
          SendMessages: false,
          // AddThreadMessagesInStaffOnlyChannel: false, // Nếu là forum/media channel và muốn khóa thread
          CreatePublicThreads: false, // Ngăn tạo thread trong kênh bị khóa
          CreatePrivateThreads: false,
        });
        await interaction.editReply({
          content: `🔒 Đã khóa kênh ${channelToModify}. Mọi người (trừ admin/mod) không thể gửi tin nhắn.`,
        });
        Logger.info(
          `[Channel/Lock] Admin ${adminUser.tag} locked channel ${channelToModify.name} (${channelToModify.id})`,
        );
      } else if (subcommand === "unlock") {
        await channelToModify.permissionOverwrites.edit(everyoneRole, {
          SendMessages: null, // null để reset về default của server/category
          // AddThreadMessagesInStaffOnlyChannel: null,
          CreatePublicThreads: null,
          CreatePrivateThreads: null,
        });
        // Hoặc nếu muốn cho phép tường minh: SendMessages: true
        await interaction.editReply({
          content: `🔓 Đã mở khóa kênh ${channelToModify}. Mọi người có thể gửi tin nhắn trở lại.`,
        });
        Logger.info(
          `[Channel/Unlock] Admin ${adminUser.tag} unlocked channel ${channelToModify.name} (${channelToModify.id})`,
        );
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /channel ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      await interaction.editReply({
        content: "❌ Đã xảy ra lỗi khi thay đổi quyền của kênh.",
      });
    }
  },
};
