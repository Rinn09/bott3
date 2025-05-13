const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  inlineCode,
  PermissionFlagsBits,
} = require("discord.js");
const User = require("../../models/User");
const CarModel = require("../../models/CarModel");
const PartDefinition = require("../../models/PartDefinition");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

const PartTypeEnum = PartDefinition.schema.path("partType").enumValues;

// Hàm tính chi phí nâng cấp động
function calculateUpgradeCost(carRarity, partRarity) {
  const rarityCostMultiplier = {
    common: 1,
    uncommon: 1.5,
    rare: 2.5,
    epic: 4,
    legendary: 7,
    mythic: 12,
  };
  const baseCost = 500; // Chi phí cơ bản cho việc lắp đặt

  const carMultiplier = rarityCostMultiplier[carRarity] || 1;
  const partMultiplier = rarityCostMultiplier[partRarity] || 1;

  // Công thức ví dụ: baseCost * (carMultiplier + partMultiplier) / 2
  // Hoặc có thể phức tạp hơn: baseCost + (carValue * 0.01) + (partValue * 0.05)
  return Math.floor(baseCost * ((carMultiplier + partMultiplier) / 1.5));
}

// Hàm tạo chuỗi hiển thị chỉ số
function formatStatModifiers(modifiers) {
  if (!modifiers) return "Không có";
  return Object.entries(modifiers)
    .filter(([, value]) => value !== 0)
    .map(
      ([key, value]) =>
        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value > 0 ? "+" : ""}${value}`,
    )
    .join(" | ");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("car-upgrade")
    .setDescription("Lắp hoặc thay thế phụ tùng cho xe của bạn.")
    .addStringOption((option) =>
      option
        .setName("car_instance_id")
        .setDescription(
          "ID instance của xe bạn muốn nâng cấp (Xem ID trong /garage).",
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("part_slot")
        .setDescription("Vị trí (loại phụ tùng) bạn muốn lắp/thay thế.")
        .setRequired(true)
        .addChoices(
          ...PartTypeEnum.map((type) => ({
            name: type.toUpperCase(),
            value: type,
          })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName("part_instance_id")
        .setDescription(
          "ID instance của phụ tùng bạn muốn lắp (Xem ID trong /warehouse).",
        )
        .setRequired(true),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const carInstanceIdToUpgrade =
      interaction.options.getString("car_instance_id");
    const partSlotToUpgrade = interaction.options.getString("part_slot");
    const partInstanceIdToInstall =
      interaction.options.getString("part_instance_id");

    if (
      !mongoose.Types.ObjectId.isValid(carInstanceIdToUpgrade) ||
      !mongoose.Types.ObjectId.isValid(partInstanceIdToInstall)
    ) {
      return interaction.reply({
        content: "❌ ID xe hoặc ID phụ tùng không hợp lệ.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });

    try {
      const user = await User.findOne({ userId, guildId });
      if (!user || !user.garage)
        throw new Error("Không tìm thấy dữ liệu garage của bạn.");

      const carIndex = user.garage.cars.findIndex(
        (car) => car._id.toString() === carInstanceIdToUpgrade,
      );
      if (carIndex === -1)
        throw new Error(
          `Không tìm thấy xe với ID instance ${inlineCode(carInstanceIdToUpgrade)}.`,
        );
      const carInstance = user.garage.cars[carIndex];

      const partToInstallIndex = user.garage.parts.findIndex(
        (part) => part._id.toString() === partInstanceIdToInstall,
      );
      if (partToInstallIndex === -1)
        throw new Error(
          `Không tìm thấy phụ tùng với ID instance ${inlineCode(partInstanceIdToInstall)}.`,
        );
      const partInstanceToInstall = user.garage.parts[partToInstallIndex];

      const carDef = await CarModel.findOne({
        modelId: carInstance.carModelId,
      }).lean();
      const partDefToInstall = await PartDefinition.findOne({
        partId: partInstanceToInstall.partDefinitionId,
      }).lean();

      if (!carDef)
        throw new Error(
          `Lỗi: Không tìm thấy định nghĩa cho xe ${inlineCode(carInstance.carModelId)}.`,
        );
      if (!partDefToInstall)
        throw new Error(
          `Lỗi: Không tìm thấy định nghĩa cho phụ tùng ${inlineCode(partInstanceToInstall.partDefinitionId)}.`,
        );

      if (partDefToInstall.partType !== partSlotToUpgrade) {
        throw new Error(
          `Phụ tùng **${partDefToInstall.name}** (loại ${partDefToInstall.partType}) không thể lắp vào slot **${partSlotToUpgrade.toUpperCase()}**.`,
        );
      }

      const upgradeCost = calculateUpgradeCost(
        carDef.rarity,
        partDefToInstall.rarity,
      );
      let oldPartReplacedInfo = "Chưa có phụ tùng nào ở slot này.";
      let oldPartStatsInfo = "";

      const oldPartInstanceIdInSlot =
        carInstance.installedParts.get(partSlotToUpgrade);
      if (oldPartInstanceIdInSlot) {
        const oldPartInstance = user.garage.parts.find((p) =>
          p._id.equals(oldPartInstanceIdInSlot),
        ); // Phụ tùng cũ vẫn ở trong kho
        if (oldPartInstance) {
          const oldPartDef = await PartDefinition.findOne({
            partId: oldPartInstance.partDefinitionId,
          }).lean();
          if (oldPartDef) {
            oldPartReplacedInfo = `**${oldPartDef.name}** (Loại: ${oldPartDef.partType}, Hiếm: ${oldPartDef.rarity})`;
            oldPartStatsInfo = formatStatModifiers(oldPartDef.statModifiers);
          }
        }
      }

      // Embed xác nhận
      const confirmEmbed = new EmbedBuilder()
        .setColor("Yellow")
        .setTitle(`🔧 Xác Nhận Nâng Cấp Xe: ${carDef.name}`)
        .setDescription(
          `Bạn có muốn lắp phụ tùng **${partDefToInstall.name}** vào slot **${partSlotToUpgrade.toUpperCase()}** không?`,
        )
        .addFields(
          {
            name: "Xe Hiện Tại",
            value: `${carDef.name} (ID: ${inlineCode(carInstanceIdToUpgrade)})`,
          },
          {
            name: `⚙️ Phụ Tùng Mới (Lắp vào ${partSlotToUpgrade.toUpperCase()})`,
            value: `**${partDefToInstall.name}** (Loại: ${partDefToInstall.partType}, Hiếm: ${partDefToInstall.rarity})\nChỉ số: ${formatStatModifiers(partDefToInstall.statModifiers)}`,
          },
          {
            name: `🔩 Phụ Tùng Hiện Tại Ở Slot ${partSlotToUpgrade.toUpperCase()}`,
            value: `${oldPartReplacedInfo}${oldPartStatsInfo ? `\nChỉ số: ${oldPartStatsInfo}` : ""}`,
          },
          {
            name: "💸 Chi Phí Lắp Đặt",
            value: `${upgradeCost.toLocaleString()} VNĐ`,
          },
        )
        .setThumbnail(partDefToInstall.imageUrl || carDef.imageUrl || null);

      const confirmId = `confirm_upgrade_${interaction.id}`;
      const cancelId = `cancel_upgrade_${interaction.id}`;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(confirmId)
          .setLabel("Xác Nhận Lắp")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(cancelId)
          .setLabel("Hủy Bỏ")
          .setStyle(ButtonStyle.Danger),
      );

      const confirmationMessage = await interaction.editReply({
        embeds: [confirmEmbed],
        components: [row],
      });

      const filter = (i) =>
        i.user.id === interaction.user.id &&
        i.message.id === confirmationMessage.id;
      const buttonInteraction = await confirmationMessage
        .awaitMessageComponent({
          filter,
          componentType: ComponentType.Button,
          time: 60000,
        })
        .catch(() => null);

      if (!buttonInteraction || buttonInteraction.customId === cancelId) {
        await confirmationMessage.edit({
          content: "❌ Thao tác nâng cấp đã được hủy bỏ.",
          embeds: [],
          components: [],
        });
        return;
      }

      await buttonInteraction.deferUpdate(); // Xác nhận nút đã được bấm

      // Bắt đầu transaction sau khi người dùng xác nhận
      const session = await mongoose.startSession(); // Khởi tạo session ở đây
      try {
        session.startTransaction();
        let userInSession = await User.findOne({ userId, guildId }).session(
          session,
        );
        if (!userInSession)
          throw new Error(
            "Lỗi không tìm thấy dữ liệu người dùng trong transaction.",
          );

        const carIdx = userInSession.garage.cars.findIndex(
          (car) => car._id.toString() === carInstanceIdToUpgrade,
        );
        if (carIdx === -1)
          throw new Error("Xe không còn tồn tại trong garage.");
        let carInst = userInSession.garage.cars[carIdx];

        // Tìm PartInstance sẽ được lắp
        const partToInstallIdx = userInSession.garage.parts.findIndex(
          // Quan trọng: Tìm trong user.garage.parts
          (part) => part._id.toString() === partInstanceIdToInstall,
        );
        if (partToInstallIdx === -1)
          // Nếu không tìm thấy trong kho
          throw new Error(
            `Phụ tùng ${inlineCode(partInstanceIdToInstall)} không có trong kho của bạn hoặc đã được lắp vào xe khác.`,
          );

        const partInstToInstall = userInSession.garage.parts[partToInstallIdx];

        // Kiểm tra xem phụ tùng này có đang được lắp ở xe khác không
        // (Nếu partInstToInstall.installedOnCar !== null VÀ KHÔNG PHẢI LÀ XE HIỆN TẠI thì mới lỗi)
        // Logic này có thể cần xem xét kỹ hơn nếu 1 phụ tùng có thể được "tháo" từ xe A để lắp sang xe B.
        // Hiện tại, nếu partInstToInstall.installedOnCar đã có giá trị, nghĩa là nó đang ở trên một xe nào đó.
        if (
          partInstToInstall.installedOnCar &&
          !partInstToInstall.installedOnCar.equals(carInst._id)
        ) {
          throw new Error(
            `Phụ tùng **${partDefToInstall.name}** (\`${partInstanceIdToInstall}\`) đang được lắp trên một chiếc xe khác.`,
          );
        }

        if (upgradeCost > 0) {
          if (userInSession.balance < upgradeCost)
            throw new Error(
              `Bạn không đủ ${upgradeCost.toLocaleString()} VNĐ.`,
            );
          userInSession.balance -= upgradeCost;
        }

        // Xử lý phụ tùng cũ (nếu có)
        const oldPartInstanceIdInSlot =
          carInst.installedParts.get(partSlotToUpgrade);
        if (oldPartInstanceIdInSlot) {
          const oldPartInstIndex = userInSession.garage.parts.findIndex(
            (
              p, // Tìm phụ tùng cũ trong kho
            ) => p._id.equals(oldPartInstanceIdInSlot),
          );
          if (oldPartInstIndex !== -1) {
            userInSession.garage.parts[oldPartInstIndex].installedOnCar = null; // Đánh dấu là đã tháo
            Logger.info(
              `[Car Upgrade] Part ${userInSession.garage.parts[oldPartInstIndex]._id} uninstalled from car ${carInst._id} slot ${partSlotToUpgrade}`,
            );
          }
        }

        // Lắp phụ tùng mới
        carInst.installedParts.set(partSlotToUpgrade, partInstToInstall._id); // Lưu ObjectId của PartInstance
        // Cập nhật trạng thái của PartInstance trong kho là đã được lắp vào xe này
        userInSession.garage.parts[partToInstallIdx].installedOnCar =
          carInst._id;
        Logger.info(
          `[Car Upgrade] Part ${partInstToInstall._id} installed on car ${carInst._id} slot ${partSlotToUpgrade}`,
        );

        userInSession.markModified("garage.cars");
        userInSession.markModified("garage.parts"); // Quan trọng: Vì ta đã thay đổi thuộc tính của một phần tử trong mảng parts
        if (upgradeCost > 0) userInSession.markModified("balance");

        await userInSession.save({ session });
        await session.commitTransaction();

        const finalEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle(`✅ Nâng Cấp Thành Công!`)
          .setDescription(
            `Đã lắp **${partDefToInstall.name}** vào slot **${partSlotToUpgrade.toUpperCase()}** cho xe **${carDef.name}**.`,
          )
          .addFields(
            {
              name: "Thông Tin Xe",
              value: `ID Instance: ${inlineCode(carInstanceIdToUpgrade)}`,
            },
            {
              name: `⚙️ Phụ Tùng Mới`,
              value: `${partDefToInstall.name} (Hiếm: ${partDefToInstall.rarity}, Chỉ số: ${formatStatModifiers(partDefToInstall.statModifiers)})`,
            },
            { name: `🔩 Slot Cũ`, value: oldPartReplacedInfo },
            {
              name: "💸 Chi Phí",
              value: `${upgradeCost.toLocaleString()} VNĐ`,
            },
          )
          .setTimestamp();
        if (partDefToInstall.imageUrl)
          finalEmbed.setThumbnail(partDefToInstall.imageUrl);

        await buttonInteraction.editReply({
          embeds: [finalEmbed],
          components: [],
        });
        Logger.info(
          `[Car Upgrade SUCCESS] User ${userId} upgraded car ${carInstanceIdToUpgrade} slot ${partSlotToUpgrade} with part ${partInstanceIdToInstall}.`,
        );
      } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        Logger.error(
          `[Car Upgrade TRANSACTION_ERROR] User ${userId}: ${error.message}`,
          { stack: error.stack },
        );
        await buttonInteraction.editReply({
          content: `❌ Lỗi khi thực hiện nâng cấp: ${error.message}`,
          embeds: [],
          components: [],
        });
      } finally {
        await session.endSession();
      }
    } catch (error) {
      // Lỗi trước khi có button confirm hoặc trước transaction
      Logger.error(`Lỗi lệnh /car-upgrade (User ${userId}): ${error.message}`, {
        stack: error.stack,
      });
      await interaction.editReply({
        content: `❌ Lỗi: ${error.message}`,
        components: [],
      });
    }
  },
};
