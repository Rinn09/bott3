const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const GuildConfig = require("../../models/GuildConfig"); // Model lưu cấu hình server

module.exports = {
  data: new SlashCommandBuilder()
    .setName("disable-command")
    .setDescription("[Admin] Vô hiệu hóa lệnh hoặc toàn bộ lệnh.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription(
          "Tên lệnh muốn vô hiệu hóa (để trống để vô hiệu hóa toàn bộ lệnh)",
        )
        .setRequired(false),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "Kênh muốn vô hiệu hóa lệnh (để trống để áp dụng cho toàn bộ kênh)",
        )
        .setRequired(false),
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const command = interaction.options.getString("command");
    const channel = interaction.options.getChannel("channel");

    await interaction.deferReply({ ephemeral: true });

    try {
      const config = await GuildConfig.findOneAndUpdate(
        { guildId },
        { $setOnInsert: { disabledCommands: {}, disabledChannels: {} } },
        { upsert: true, new: true },
      );

      if (command) {
        // Vô hiệu hóa một lệnh cụ thể
        if (channel) {
          // Vô hiệu hóa lệnh trong một kênh cụ thể
          config.disabledCommands[command] =
            config.disabledCommands[command] || [];
          if (!config.disabledCommands[command].includes(channel.id)) {
            config.disabledCommands[command].push(channel.id);
          }
        } else {
          // Vô hiệu hóa lệnh trên toàn bộ kênh
          config.disabledCommands[command] = ["all"];
        }
      } else {
        // Vô hiệu hóa toàn bộ lệnh
        if (channel) {
          // Vô hiệu hóa toàn bộ lệnh trong một kênh cụ thể
          config.disabledChannels[channel.id] = true;
        } else {
          // Vô hiệu hóa toàn bộ lệnh trên toàn bộ kênh
          config.disabledChannels["all"] = true;
        }
      }

      await config.save();
      await interaction.editReply(
        `✅ Đã vô hiệu hóa ${command || "toàn bộ lệnh"} ${channel ? `trong kênh <#${channel.id}>` : "trên toàn bộ kênh"}.`,
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Đã xảy ra lỗi khi vô hiệu hóa lệnh.");
    }
  },
};
