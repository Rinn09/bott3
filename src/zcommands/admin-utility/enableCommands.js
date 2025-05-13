const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const GuildConfig = require("../../models/GuildConfig"); // Model lưu cấu hình server

module.exports = {
  data: new SlashCommandBuilder()
    .setName("enable-command")
    .setDescription("[Admin] Kích hoạt lệnh hoặc toàn bộ lệnh.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription(
          "Tên lệnh muốn kích hoạt (để trống để kích hoạt toàn bộ lệnh)",
        )
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "Kênh muốn kích hoạt lệnh (để trống để áp dụng cho toàn bộ kênh)",
        )
        .setRequired(false),
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const command = interaction.options.getString("command");
    const channel = interaction.options.getChannel("channel");

    await interaction.deferReply({ ephemeral: true });

    try {
      const config = await GuildConfig.findOne({ guildId });

      if (!config) {
        return interaction.editReply(
          "❌ Không có lệnh nào bị vô hiệu hóa để kích hoạt.",
        );
      }

      if (command) {
        // Kích hoạt một lệnh cụ thể
        if (channel) {
          // Kích hoạt lệnh trong một kênh cụ thể
          if (config.disabledCommands[command]) {
            config.disabledCommands[command] = config.disabledCommands[
              command
            ].filter((id) => id !== channel.id);
            if (config.disabledCommands[command].length === 0) {
              delete config.disabledCommands[command];
            }
          }
        } else {
          // Kích hoạt lệnh trên toàn bộ kênh
          delete config.disabledCommands[command];
        }
      } else {
        // Kích hoạt toàn bộ lệnh
        if (channel) {
          // Kích hoạt toàn bộ lệnh trong một kênh cụ thể
          delete config.disabledChannels[channel.id];
        } else {
          // Kích hoạt toàn bộ lệnh trên toàn bộ kênh
          delete config.disabledChannels["all"];
        }
      }

      await config.save();
      await interaction.editReply(
        `✅ Đã kích hoạt ${command || "toàn bộ lệnh"} ${channel ? `trong kênh <#${channel.id}>` : "trên toàn bộ kênh"}.`,
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Đã xảy ra lỗi khi kích hoạt lệnh.");
    }
  },
};
