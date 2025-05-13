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
const PartDefinition = require("../../models/PartDefinition"); // Cần để hiển thị tên phụ tùng đã lắp
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("garage")
    .setDescription("Xem chi tiết từng chiếc xe trong garage của bạn.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Người dùng bạn muốn xem garage (mặc định là bạn).")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("index")
        .setDescription(
          "Xem xe ở vị trí cụ thể (ví dụ: 1, 2...). Bỏ trống để xem xe đầu tiên.",
        )
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const targetUserOption = interaction.options.getUser("user");
    const targetUser = targetUserOption || interaction.user;
    let carIndexToShow = (interaction.options.getInteger("index") || 1) - 1; // Chuyển sang 0-based index

    // Kiểm tra quyền nếu xem garage người khác
    if (
      targetUser.id !== interaction.user.id &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content: "❌ Bạn không có quyền xem garage của người khác.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({
      ephemeral: targetUser.id !== interaction.user.id && !targetUserOption,
    }); // Ephemeral nếu xem của chính mình và không có option user

    const generateCarEmbedAndButtons = async (
      userId,
      guildId,
      currentCarIndex,
    ) => {
      const user = await User.findOne({ userId, guildId });

      if (
        !user ||
        !user.garage ||
        !user.garage.cars ||
        user.garage.cars.length === 0
      ) {
        const emptyEmbed = new EmbedBuilder()
          .setColor("Grey")
          .setTitle(`Garage của ${targetUser.username}`)
          .setDescription(
            "🚗 Garage này trống trơn, không có chiếc xe nào cả!",
          );
        return {
          embeds: [emptyEmbed],
          components: [],
          currentCarInstance: null,
          carDefinition: null,
          totalCars: 0,
          currentIndex: -1,
        };
      }

      const userCars = user.garage.cars;
      const totalCars = userCars.length;

      if (currentCarIndex < 0) currentCarIndex = 0;
      if (currentCarIndex >= totalCars) currentCarIndex = totalCars - 1;

      const carInstance = userCars[currentCarIndex];
      if (!carInstance) {
        // Trường hợp hiếm
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription("Không tìm thấy xe ở vị trí này.");
        return {
          embeds: [errorEmbed],
          components: [],
          currentCarInstance: null,
          carDefinition: null,
          totalCars,
          currentIndex: currentCarIndex,
        };
      }

      const carDefinition = await CarModel.findOne({
        modelId: carInstance.carModelId,
      }).lean();
      if (!carDefinition) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription(
            `Lỗi: Không tìm thấy định nghĩa cho xe với model ID: ${carInstance.carModelId}`,
          );
        return {
          embeds: [errorEmbed],
          components: [],
          currentCarInstance: carInstance,
          carDefinition: null,
          totalCars,
          currentIndex: currentCarIndex,
        };
      }

      // --- Tính toán chỉ số hiện tại của xe (TẠM THỜI HIỂN THỊ BASE STATS) ---
      // Sẽ phức tạp hơn khi có phụ tùng. Hiện tại chỉ lấy baseStats.
      let currentStats = { ...(carDefinition.baseStats || {}) };
      let installedPartsInfo = "Chưa lắp phụ tùng nào.";

      if (
        user.garage.parts &&
        carInstance.installedParts &&
        carInstance.installedParts.size > 0
      ) {
        // Lấy danh sách các ID (dưới dạng String) của các PartInstance đang được lắp trên xe
        const installedPartInstanceIds_strings = Array.from(
          carInstance.installedParts.values(),
        ).map((id) => id.toString());

        // Lọc từ kho (user.garage.parts) những PartInstance có _id nằm trong danh sách trên
        const currentlyInstalledPartInstances = user.garage.parts.filter(
          (p_instance) =>
            installedPartInstanceIds_strings.includes(
              p_instance._id.toString(),
            ),
        );

        if (currentlyInstalledPartInstances.length > 0) {
          const partDefinitionIds = [
            ...new Set(
              currentlyInstalledPartInstances.map(
                (p_instance) => p_instance.partDefinitionId,
              ),
            ),
          ];

          const partDefs = await PartDefinition.find({
            partId: { $in: partDefinitionIds },
          }).lean();
          const partDefMap = new Map(partDefs.map((pd) => [pd.partId, pd]));

          let partsTextArray = [];
          // Duyệt qua các PartInstance thực sự đang được lắp
          for (const installedPartInst of currentlyInstalledPartInstances) {
            const partDef = partDefMap.get(installedPartInst.partDefinitionId);
            if (partDef) {
              // Tìm slot mà part này được lắp vào (dựa trên _id của PartInstance)
              let slotName = "Không rõ";
              for (const [
                slot,
                inst_id_from_car,
              ] of carInstance.installedParts.entries()) {
                if (
                  inst_id_from_car.toString() ===
                  installedPartInst._id.toString()
                ) {
                  slotName = slot;
                  break;
                }
              }
              partsTextArray.push(
                `**${slotName.toUpperCase()}**: ${partDef.name} (${partDef.rarity})`,
              );
              // Cộng dồn statModifiers
              if (partDef.statModifiers) {
                // Kiểm tra statModifiers có tồn tại không
                for (const [stat, value] of Object.entries(
                  partDef.statModifiers,
                )) {
                  currentStats[stat] = (currentStats[stat] || 0) + (value || 0);
                }
              }
            }
          }
          if (partsTextArray.length > 0) {
            installedPartsInfo = partsTextArray.join("\n");
          } else {
            // Trường hợp này có thể xảy ra nếu installedParts có ID nhưng không tìm thấy PartInstance tương ứng trong kho
            // (Điều này không nên xảy ra nếu logic car-upgrade đúng)
            installedPartsInfo =
              "Lỗi: Không tìm thấy chi tiết phụ tùng đã lắp.";
            Logger.warn(
              `[Garage] Car ${carInstance._id} has installed part IDs but instances not found in user's parts.`,
            );
          }
        }
      }
      // --- Kết thúc tính toán chỉ số ---

      const rarityColor = {
        common: "#95a5a6",
        uncommon: "#2ecc71",
        rare: "#3498db",
        epic: "#9b59b6",
        legendary: "#f1c40f",
        mythic: "#e67e22",
      };
      const embed = new EmbedBuilder()
        .setColor(rarityColor[carDefinition.rarity] || "#3498DB")
        .setTitle(
          `🚗 ${carDefinition.name} ${carInstance.isDisplayed ? "⭐" : ""}`,
        )
        .setDescription(carDefinition.description || "Một chiếc xe tuyệt vời.")
        .addFields(
          {
            name: "🆔 IDs",
            value: `Model: ${inlineCode(carDefinition.modelId)}\nInstance: ${inlineCode(carInstance._id.toString())}`,
          },
          {
            name: "📋 Thông Tin",
            value: `Hãng: ${carDefinition.brand || "N/A"}\nĐộ hiếm: ${carDefinition.rarity.toUpperCase()}`,
          },
          {
            name: "📊 Chỉ Số Hiện Tại",
            value: `Tốc độ: ${currentStats.speed !== undefined ? currentStats.speed : "N/A"}\nTăng tốc: ${currentStats.acceleration !== undefined ? currentStats.acceleration : "N/A"}\nXử lý: ${currentStats.handling !== undefined ? currentStats.handling : "N/A"}\nĐộ bền: ${currentStats.durability !== undefined ? currentStats.durability : "N/A"}`,
          }, // Thêm kiểm tra undefined
          {
            name: "🎨 Ngoại Hình",
            value: `Màu sơn: ${carInstance.cosmetics?.color || "#FFFFFF"}\nBiển số: ${carInstance.cosmetics?.licensePlate || "Chưa có"}`,
          },
          { name: "⚙️ Phụ Tùng Đã Lắp", value: installedPartsInfo }, // installedPartsInfo giờ sẽ đúng
        )
        .setFooter({
          text: `Xe ${currentCarIndex + 1}/${totalCars} | Garage của: ${targetUser.username}`,
        })
        .setTimestamp();

      if (carDefinition.imageUrl) {
        embed.setImage(carDefinition.imageUrl);
      }

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`garage_car_prev_${targetUser.id}_${currentCarIndex}`)
          .setLabel("◀️ Xe Trước")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentCarIndex === 0),
        new ButtonBuilder()
          .setCustomId(`garage_car_next_${targetUser.id}_${currentCarIndex}`)
          .setLabel("Xe Sau ▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentCarIndex >= totalCars - 1),
      );

      return {
        embeds: [embed],
        components: [buttons],
        currentCarInstance: carInstance,
        carDefinition,
        totalCars,
        currentIndex: currentCarIndex,
      };
    };

    // Hiển thị xe ban đầu
    const initialData = await generateCarEmbedAndButtons(
      targetUser.id,
      interaction.guild.id,
      carIndexToShow,
    );
    if (!initialData.currentCarInstance && initialData.totalCars === 0) {
      // Trường hợp garage trống
      return interaction.editReply({
        embeds: initialData.embeds,
        components: initialData.components,
      });
    }
    if (!initialData.currentCarInstance && initialData.totalCars > 0) {
      // Lỗi không tìm thấy xe cụ thể
      return interaction.editReply({
        embeds: initialData.embeds,
        components: [],
      });
    }

    const message = await interaction.editReply({
      embeds: initialData.embeds,
      components: initialData.components,
    });

    const filter = (i) => {
      // Người gọi lệnh hoặc người được xem garage (nếu khác người gọi) mới được tương tác
      const canInteract =
        i.user.id === interaction.user.id ||
        (targetUser.id !== interaction.user.id && i.user.id === targetUser.id);
      return (
        canInteract &&
        (i.customId.startsWith(`garage_car_prev_${targetUser.id}_`) ||
          i.customId.startsWith(`garage_car_next_${targetUser.id}_`))
      );
    };

    const collector = message.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000,
    });

    let currentCollectedIndex = initialData.currentIndex;

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const parts = i.customId.split("_"); // garage_car_action_targetUserId_pageIndexOfButton
      const action = parts[2];
      // currentCollectedIndex đã được lưu từ lần hiển thị trước

      if (action === "prev") {
        currentCollectedIndex--;
      } else if (action === "next") {
        currentCollectedIndex++;
      }

      try {
        const newData = await generateCarEmbedAndButtons(
          targetUser.id,
          interaction.guild.id,
          currentCollectedIndex,
        );
        currentCollectedIndex = newData.currentIndex; // Cập nhật lại index sau khi hàm đã clamp giá trị
        await i.editReply({
          embeds: newData.embeds,
          components: newData.components,
        });
      } catch (error) {
        Logger.error(
          `[Garage Collector] Error updating car view: ${error.message}`,
          { stack: error.stack },
        );
        // Không cố editReply nữa nếu có lỗi ở đây, interaction có thể đã hỏng
      }
    });

    collector.on("end", async () => {
      try {
        // Lấy lại trạng thái cuối cùng của embed và disable nút
        const finalData = await generateCarEmbedAndButtons(
          targetUser.id,
          interaction.guild.id,
          currentCollectedIndex,
        );
        if (finalData.components && finalData.components.length > 0) {
          const disabledComponents = finalData.components.map((row) => {
            row.components.forEach((comp) => comp.setDisabled(true));
            return row;
          });
          await message
            .edit({ components: disabledComponents })
            .catch(() => {});
        } else {
          await message.edit({ components: [] }).catch(() => {}); // Xóa component nếu không có
        }
      } catch (error) {
        /* Bỏ qua lỗi nếu tin nhắn đã bị xóa hoặc không thể edit */
      }
    });
  },
};
