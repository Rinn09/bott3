const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  inlineCode,
} = require("discord.js");
const CarModel = require("../../models/CarModel");
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete-car-model")
    .setDescription("[Admin] Xóa một mẫu xe khỏi database Gacha.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("model_id")
        .setDescription("ID của mẫu xe cần xóa (vd: sedan_basic).")
        .setRequired(true),
    ),

  async execute(interaction) {
    const modelIdToDelete = interaction.options
      .getString("model_id")
      .toLowerCase()
      .trim();

    // (Tùy chọn) Kiểm tra quyền OWNER_ID nếu cần
    // if (interaction.user.id !== process.env.OWNER_ID) {
    //     return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này.', ephemeral: true });
    // }

    const carExists = await CarModel.findOne({ modelId: modelIdToDelete });
    if (!carExists) {
      return interaction.reply({
        content: `❌ Không tìm thấy mẫu xe nào với ID: ${inlineCode(modelIdToDelete)} để xóa.`,
        ephemeral: true,
      });
    }

    // Tạo nút xác nhận
    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_delete_car_${modelIdToDelete}_${interaction.id}`)
      .setLabel(`Xóa ${carExists.name}`)
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId(`cancel_delete_car_${interaction.id}`)
      .setLabel("Hủy")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(
      confirmButton,
      cancelButton,
    );

    const confirmEmbed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("❓ Xác Nhận Xóa Mẫu Xe")
      .setDescription(
        `Bạn có chắc chắn muốn xóa hoàn toàn mẫu xe **${carExists.name}** (ID: ${inlineCode(modelIdToDelete)}) khỏi database không?\n\n⚠️ **Lưu ý:**\n- Hành động này **KHÔNG THỂ** hoàn tác.\n- Những chiếc xe cụ thể (instances) mà người dùng đang sở hữu dựa trên model này **SẼ KHÔNG BỊ XÓA** khỏi garage của họ, nhưng có thể không hiển thị đúng thông tin chi tiết nữa.\n- Mẫu xe này sẽ không thể roll ra được nữa.`,
      )
      .setFooter({ text: "Cân nhắc kỹ trước khi xác nhận!" });

    const messageWithButtons = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true, // Để true vì đây là hành động admin và cần xác nhận nhanh
      withResponse: true,
    });

    const filter = (i) =>
      i.user.id === interaction.user.id &&
      i.message.id === messageWithButtons.id;

    try {
      const confirmation = await messageWithButtons.awaitMessageComponent({
        filter,
        time: 30000,
      });

      if (confirmation.customId.startsWith("cancel_delete_car_")) {
        await confirmation.update({
          content: "✅ Thao tác xóa mẫu xe đã được hủy.",
          embeds: [],
          components: [],
        });
        return;
      }

      if (
        confirmation.customId.startsWith(
          `confirm_delete_car_${modelIdToDelete}_`,
        )
      ) {
        await confirmation.deferUpdate();

        const deleteResult = await CarModel.deleteOne({
          modelId: modelIdToDelete,
        });

        if (deleteResult.deletedCount > 0) {
          await confirmation.editReply({
            content: `✅ Đã xóa thành công mẫu xe **${carExists.name}** (ID: ${inlineCode(modelIdToDelete)}) khỏi database.`,
            embeds: [],
            components: [],
          });
          Logger.info(
            `[Admin Command] User ${interaction.user.tag} deleted car model: ${modelIdToDelete}`,
          );
        } else {
          await confirmation.editReply({
            content: `❌ Không thể xóa mẫu xe ${inlineCode(modelIdToDelete)}. Có thể nó đã bị xóa trước đó.`,
            embeds: [],
            components: [],
          });
          Logger.warn(
            `[Admin Command] User ${interaction.user.tag} tried to delete non-existent car model: ${modelIdToDelete}`,
          );
        }
      }
    } catch (error) {
      // Lỗi từ awaitMessageComponent (thường là hết thời gian)
      await messageWithButtons
        .edit({
          content: "⌛ Hết thời gian xác nhận, thao tác xóa mẫu xe đã bị hủy.",
          embeds: [],
          components: [],
        })
        .catch(() => {});
    }
  },
};
