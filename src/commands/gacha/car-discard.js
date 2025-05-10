const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  inlineCode,
} = require("discord.js");
const User = require("../../models/User");
const CarModel = require("../../models/CarModel"); // Cần để lấy castrolValue
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("car-discard")
    .setDescription(
      "Bỏ một chiếc xe không dùng đến khỏi garage và nhận lại một ít Castrol.",
    )
    .addStringOption((option) =>
      option
        .setName("car_instance_id")
        .setDescription(
          "ID instance của chiếc xe bạn muốn bỏ (Xem ID trong /garage).",
        )
        .setRequired(true),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const carInstanceIdToDiscard =
      interaction.options.getString("car_instance_id");

    if (!mongoose.Types.ObjectId.isValid(carInstanceIdToDiscard)) {
      return interaction.reply({
        content: "❌ ID instance của xe không hợp lệ.",
        ephemeral: true,
      });
    }

    const user = await User.findOne({ userId, guildId });
    if (!user || !user.garage || !user.garage.cars) {
      return interaction.reply({
        content: "❌ Không tìm thấy dữ liệu garage của bạn.",
        ephemeral: true,
      });
    }

    const carIndex = user.garage.cars.findIndex(
      (car) => car._id.toString() === carInstanceIdToDiscard,
    );
    if (carIndex === -1) {
      return interaction.reply({
        content: `❌ Không tìm thấy xe với ID instance ${inlineCode(carInstanceIdToDiscard)} trong garage của bạn.`,
        ephemeral: true,
      });
    }
    const carInstanceToDiscard = user.garage.cars[carIndex];
    const carDef = await CarModel.findOne({
      modelId: carInstanceToDiscard.carModelId,
    }).lean();

    if (!carDef) {
      return interaction.reply({
        content: `❌ Lỗi: Không tìm thấy định nghĩa cho xe ${inlineCode(carInstanceToDiscard.carModelId)}. Không thể tiến hành bỏ xe.`,
        ephemeral: true,
      });
    }

    // Tính Castrol nhận lại (ví dụ: 50% giá trị gốc, làm tròn xuống)
    const castrolRefundPercentage = 0.5;
    const castrolToRefund = Math.floor(
      (carDef.castrolValue || 0) * castrolRefundPercentage,
    );

    // Tạo nút xác nhận
    const confirmId = `confirm_discard_car_${carInstanceIdToDiscard}_${interaction.id}`;
    const cancelId = `cancel_discard_car_${interaction.id}`;

    const confirmButton = new ButtonBuilder()
      .setCustomId(confirmId)
      .setLabel(`Bỏ ${carDef.name}`)
      .setStyle(ButtonStyle.Danger);
    const cancelButton = new ButtonBuilder()
      .setCustomId(cancelId)
      .setLabel("Hủy")
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(
      confirmButton,
      cancelButton,
    );

    const confirmEmbed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle(`🗑️ Xác Nhận Bỏ Xe: ${carDef.name}`)
      .setDescription(
        `Bạn có chắc chắn muốn bỏ chiếc **${carDef.name}** (ID: ${inlineCode(carInstanceIdToDiscard)}) không?\n\nBạn sẽ nhận lại: **${castrolToRefund.toLocaleString()} Castrol**.\n\n⚠️ **Lưu ý:** Hành động này KHÔNG THỂ hoàn tác. Các phụ tùng đã lắp trên xe này sẽ được trả về kho của bạn.`,
      )
      .setThumbnail(carDef.imageUrl || null);

    const messageWithButtons = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      fetchReply: true,
    });

    const filter = (i) =>
      i.user.id === interaction.user.id &&
      i.message.id === messageWithButtons.id;
    try {
      const confirmation = await messageWithButtons.awaitMessageComponent({
        filter,
        time: 30000,
      });

      if (confirmation.customId === cancelId) {
        return confirmation.update({
          content: "✅ Thao tác bỏ xe đã được hủy.",
          embeds: [],
          components: [],
        });
      }

      if (confirmation.customId === confirmId) {
        await confirmation.deferUpdate();
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          // Tìm lại user và carIndex trong session để đảm bảo tính nhất quán
          const currentUser = await User.findOne({ userId, guildId }).session(
            session,
          );
          if (!currentUser || !currentUser.garage || !currentUser.garage.cars)
            throw new Error("Lỗi dữ liệu người dùng.");

          const currentCarIdx = currentUser.garage.cars.findIndex(
            (car) => car._id.toString() === carInstanceIdToDiscard,
          );
          if (currentCarIdx === -1)
            throw new Error("Xe không còn tồn tại trong garage.");

          const carToActuallyDiscard = currentUser.garage.cars[currentCarIdx];

          // Phụ tùng đã lắp sẽ tự nhiên còn lại trong user.garage.parts khi xe bị xóa khỏi mảng
          // Vì chúng ta không xóa part instance khi lắp, mà là xóa part instance gốc khỏi kho
          // Và khi bỏ xe, carInstance.installedParts chỉ là tham chiếu _id, nó không tự xóa partInstance

          // Xóa xe khỏi garage
          currentUser.garage.cars.splice(currentCarIdx, 1);

          // Hoàn trả Castrol
          if (castrolToRefund > 0) {
            currentUser.castrolBalance =
              (currentUser.castrolBalance || 0) + castrolToRefund;
            currentUser.markModified("castrolBalance");
          }
          currentUser.markModified("garage.cars");

          await currentUser.save({ session });
          await session.commitTransaction();

          await confirmation.editReply({
            content: `✅ Đã bỏ thành công xe **${carDef.name}**. Bạn nhận được ${castrolToRefund.toLocaleString()} Castrol. Các phụ tùng (nếu có) đã được giữ lại trong kho.`,
            embeds: [],
            components: [],
          });
          Logger.info(
            `[Car Discard] User ${userId} discarded car ${carInstanceIdToDiscard} (${carDef.name}). Received ${castrolToRefund} Castrol.`,
          );
        } catch (dbError) {
          if (session.inTransaction()) await session.abortTransaction();
          Logger.error(
            `Lỗi DB khi bỏ xe ${carInstanceIdToDiscard}: ${dbError.message}`,
            { stack: dbError.stack },
          );
          await confirmation.editReply({
            content: "❌ Đã xảy ra lỗi khi xử lý việc bỏ xe trong database.",
            embeds: [],
            components: [],
          });
        } finally {
          await session.endSession();
        }
      }
    } catch (error) {
      // Lỗi từ awaitMessageComponent
      await messageWithButtons
        .edit({
          content: "⌛ Hết thời gian xác nhận, thao tác bỏ xe đã bị hủy.",
          embeds: [],
          components: [],
        })
        .catch(() => {});
    }
  },
};
