const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  inlineCode,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const CarModel = require("../../models/CarModel");
const PartDefinition = require("../../models/PartDefinition");
const Logger = require("../../utils/logger");

// Enum cho độ hiếm (Lấy từ add-car-model.js và add-part-definition.js)
const RarityEnum = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];
const PartTypeEnum = [
  "engine",
  "tires",
  "ecu",
  "nitro",
  "chassis",
  "bodykit",
  "brakes",
  "suspension",
  "exhaust",
  "transmission",
  "cooling",
  "forced_induction",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-gacha")
    .setDescription(
      "[Admin/Owner] Quản lý các định nghĩa xe và phụ tùng cho Gacha.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Vẫn giữ cho lệnh cha, nhưng check OWNER_ID trong execute
    .addSubcommandGroup((group) =>
      group
        .setName("car")
        .setDescription("Quản lý mẫu xe (car models).")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Thêm hoặc cập nhật một mẫu xe.")
            .addStringOption((option) =>
              option
                .setName("model_id")
                .setDescription("ID duy nhất cho mẫu xe (vd: sedan_basic)")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("name")
                .setDescription("Tên hiển thị của mẫu xe.")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("rarity")
                .setDescription("Độ hiếm của mẫu xe.")
                .setRequired(true)
                .addChoices(
                  ...RarityEnum.map((r) => ({
                    name: r.toUpperCase(),
                    value: r,
                  })),
                ),
            )
            .addIntegerOption((option) =>
              option
                .setName("base_speed")
                .setDescription("Chỉ số Tốc độ gốc.")
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName("base_acceleration")
                .setDescription("Chỉ số Tăng tốc gốc.")
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName("base_handling")
                .setDescription("Chỉ số Xử lý gốc.")
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName("base_durability")
                .setDescription("Chỉ số Độ bền gốc.")
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName("gacha_weight")
                .setDescription("Trọng số Gacha (>0).")
                .setRequired(true)
                .setMinValue(1),
            )
            .addIntegerOption((option) =>
              option
                .setName("castrol_value")
                .setDescription("Số Castrol nhận được khi roll trùng (>=1).")
                .setRequired(true)
                .setMinValue(1),
            )
            .addStringOption((option) =>
              option
                .setName("description")
                .setDescription("Mô tả ngắn gọn về mẫu xe."),
            )
            .addStringOption((option) =>
              option.setName("brand").setDescription("Hãng xe (vd: VinFast)."),
            )
            .addStringOption((option) =>
              option
                .setName("image_url")
                .setDescription("URL hình ảnh của mẫu xe."),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delete")
            .setDescription("Xóa một mẫu xe khỏi database Gacha.")
            .addStringOption((option) =>
              option
                .setName("model_id")
                .setDescription("ID của mẫu xe cần xóa.")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup(
      (group) =>
        group
          .setName("part")
          .setDescription("Quản lý định nghĩa phụ tùng (part definitions).")
          .addSubcommand((subcommand) =>
            subcommand
              .setName("add")
              .setDescription("Thêm hoặc cập nhật một định nghĩa phụ tùng.")
              .addStringOption((option) =>
                option
                  .setName("part_id")
                  .setDescription("ID duy nhất cho phụ tùng (vd: engine_v6)")
                  .setRequired(true),
              )
              .addStringOption((option) =>
                option
                  .setName("name")
                  .setDescription("Tên hiển thị của phụ tùng.")
                  .setRequired(true),
              )
              .addStringOption((option) =>
                option
                  .setName("rarity")
                  .setDescription("Độ hiếm của phụ tùng.")
                  .setRequired(true)
                  .addChoices(
                    ...RarityEnum.map((r) => ({
                      name: r.toUpperCase(),
                      value: r,
                    })),
                  ),
              )
              .addStringOption((option) =>
                option
                  .setName("part_type")
                  .setDescription("Loại phụ tùng.")
                  .setRequired(true)
                  .addChoices(
                    ...PartTypeEnum.map((pt) => ({
                      name: pt.toUpperCase(),
                      value: pt,
                    })),
                  ),
              )
              .addIntegerOption((option) =>
                option
                  .setName("gacha_weight")
                  .setDescription("Trọng số Gacha (>0).")
                  .setRequired(true)
                  .setMinValue(1),
              )
              .addStringOption((option) =>
                option.setName("description").setDescription("Mô tả ngắn gọn."),
              )
              .addIntegerOption((option) =>
                option
                  .setName("mod_speed")
                  .setDescription("Chỉ số Tốc độ cộng thêm (mặc định 0)."),
              )
              .addIntegerOption((option) =>
                option
                  .setName("mod_acceleration")
                  .setDescription("Chỉ số Tăng tốc cộng thêm (mặc định 0)."),
              )
              .addIntegerOption((option) =>
                option
                  .setName("mod_handling")
                  .setDescription("Chỉ số Xử lý cộng thêm (mặc định 0)."),
              )
              .addIntegerOption((option) =>
                option
                  .setName("mod_durability")
                  .setDescription("Chỉ số Độ bền cộng thêm (mặc định 0)."),
              )
              .addStringOption((option) =>
                option
                  .setName("image_url")
                  .setDescription("URL hình ảnh phụ tùng."),
              ),
          ),
      // Bạn có thể thêm subcommand 'delete' cho part ở đây nếu muốn
      // .addSubcommand(subcommand =>
      //     subcommand
      //         .setName('delete')
      //         .setDescription('Xóa một định nghĩa phụ tùng.')
      //         .addStringOption(option => option.setName('part_id').setDescription('ID của phụ tùng cần xóa.').setRequired(true))
      // )
    ),

  async execute(interaction) {
    // --- QUAN TRỌNG: Kiểm tra OWNER_ID ---
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content:
          "❌ Bạn không có quyền sử dụng lệnh này. Chỉ chủ sở hữu bot mới có thể thực hiện.",
        ephemeral: true,
      });
    }

    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply({ ephemeral: false });

    try {
      if (subcommandGroup === "car") {
        if (subcommand === "add") {
          // Logic từ add-car-model.js
          const modelIdInput = interaction.options
            .getString("model_id")
            .toLowerCase()
            .trim();
          const name = interaction.options.getString("name");
          const description = interaction.options.getString("description");
          const brand = interaction.options.getString("brand");
          const rarity = interaction.options.getString("rarity");
          const baseSpeed = interaction.options.getInteger("base_speed");
          const baseAcceleration =
            interaction.options.getInteger("base_acceleration");
          const baseHandling = interaction.options.getInteger("base_handling");
          const baseDurability =
            interaction.options.getInteger("base_durability");
          const gachaWeight = interaction.options.getInteger("gacha_weight");
          const castrolValue = interaction.options.getInteger("castrol_value");
          const imageUrl = interaction.options.getString("image_url");

          if (/\s/.test(modelIdInput)) {
            return interaction.editReply({
              content: `❌ ${inlineCode("model_id")} không được chứa khoảng trắng.`,
            });
          }

          const carData = {
            modelId: modelIdInput,
            name: name,
            description: description || undefined,
            brand: brand || undefined,
            rarity: rarity,
            baseStats: {
              speed: baseSpeed,
              acceleration: baseAcceleration,
              handling: baseHandling,
              durability: baseDurability,
            },
            gachaWeight: gachaWeight,
            castrolValue: castrolValue,
            imageUrl: imageUrl || undefined,
          };

          const updatedOrCreatedCar = await CarModel.findOneAndUpdate(
            { modelId: modelIdInput },
            { $set: carData },
            { upsert: true, new: true, runValidators: true },
          );

          const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle(
              `✅ ${updatedOrCreatedCar.createdAt.getTime() === updatedOrCreatedCar.updatedAt.getTime() ? "Đã thêm mẫu xe mới" : "Đã cập nhật mẫu xe"}`,
            )
            .addFields(
              {
                name: "Model ID",
                value: inlineCode(updatedOrCreatedCar.modelId),
                inline: true,
              },
              { name: "Tên Xe", value: updatedOrCreatedCar.name, inline: true },
              {
                name: "Độ hiếm",
                value: updatedOrCreatedCar.rarity.toUpperCase(),
                inline: true,
              },
              {
                name: "Hãng",
                value: updatedOrCreatedCar.brand || "N/A",
                inline: true,
              },
              {
                name: "Trọng số Gacha",
                value: updatedOrCreatedCar.gachaWeight.toString(),
                inline: true,
              },
              {
                name: "Giá trị Castrol",
                value: updatedOrCreatedCar.castrolValue.toString(),
                inline: true,
              },
              {
                name: "Mô tả",
                value: updatedOrCreatedCar.description || "Không có",
              },
              {
                name: "Chỉ số gốc",
                value: `Tốc độ: ${updatedOrCreatedCar.baseStats.speed}, Tăng tốc: ${updatedOrCreatedCar.baseStats.acceleration}, Xử lý: ${updatedOrCreatedCar.baseStats.handling}, Độ bền: ${updatedOrCreatedCar.baseStats.durability}`,
              },
              {
                name: "Image URL",
                value: updatedOrCreatedCar.imageUrl || "Chưa có",
              },
            )
            .setTimestamp(updatedOrCreatedCar.updatedAt);
          if (updatedOrCreatedCar.imageUrl)
            embed.setThumbnail(updatedOrCreatedCar.imageUrl);

          await interaction.editReply({ embeds: [embed] });
          Logger.info(
            `[Admin-Gacha/Car-Add] User ${interaction.user.tag} added/updated car model: ${modelIdInput}`,
          );
        } else if (subcommand === "delete") {
          // Logic từ delete-car-model.js
          const modelIdToDelete = interaction.options
            .getString("model_id")
            .toLowerCase()
            .trim();
          const carExists = await CarModel.findOne({
            modelId: modelIdToDelete,
          });

          if (!carExists) {
            return interaction.editReply({
              content: `❌ Không tìm thấy mẫu xe nào với ID: ${inlineCode(modelIdToDelete)} để xóa.`,
            });
          }

          const confirmButtonId = `confirm_delete_car_${modelIdToDelete}_${interaction.id}`;
          const cancelButtonId = `cancel_delete_car_${interaction.id}`;

          const confirmButton = new ButtonBuilder()
            .setCustomId(confirmButtonId)
            .setLabel(`Xóa ${carExists.name}`)
            .setStyle(ButtonStyle.Danger);
          const cancelButton = new ButtonBuilder()
            .setCustomId(cancelButtonId)
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
              `Bạn có chắc chắn muốn xóa hoàn toàn mẫu xe **${carExists.name}** (ID: ${inlineCode(modelIdToDelete)}) không?\n\n⚠️ **Lưu ý:** Hành động này **KHÔNG THỂ** hoàn tác.`,
            )
            .setFooter({ text: "Cân nhắc kỹ trước khi xác nhận!" });

          const messageWithButtons = await interaction.editReply({
            embeds: [confirmEmbed],
            components: [row],
          });

          const filter = (i) =>
            i.user.id === interaction.user.id &&
            i.message.id === messageWithButtons.id;
          try {
            const confirmation = await messageWithButtons.awaitMessageComponent(
              { filter, componentType: ComponentType.Button, time: 30000 },
            );

            if (confirmation.customId === cancelButtonId) {
              return confirmation.update({
                content: "✅ Thao tác xóa mẫu xe đã được hủy.",
                embeds: [],
                components: [],
              });
            }

            if (confirmation.customId === confirmButtonId) {
              await confirmation.deferUpdate();
              const deleteResult = await CarModel.deleteOne({
                modelId: modelIdToDelete,
              });
              if (deleteResult.deletedCount > 0) {
                await confirmation.editReply({
                  content: `✅ Đã xóa thành công mẫu xe **${carExists.name}** (ID: ${inlineCode(modelIdToDelete)}).`,
                  embeds: [],
                  components: [],
                });
                Logger.info(
                  `[Admin-Gacha/Car-Delete] User ${interaction.user.tag} deleted car model: ${modelIdToDelete}`,
                );
              } else {
                await confirmation.editReply({
                  content: `❌ Không thể xóa mẫu xe ${inlineCode(modelIdToDelete)}.`,
                  embeds: [],
                  components: [],
                });
              }
            }
          } catch (error) {
            await messageWithButtons
              .edit({
                content:
                  "⌛ Hết thời gian xác nhận, thao tác xóa mẫu xe đã bị hủy.",
                embeds: [],
                components: [],
              })
              .catch(() => {});
          }
        }
      } else if (subcommandGroup === "part") {
        if (subcommand === "add") {
          // Logic từ add-part-definition.js
          const partIdInput = interaction.options
            .getString("part_id")
            .toLowerCase()
            .trim();
          const name = interaction.options.getString("name");
          const description = interaction.options.getString("description");
          const rarity = interaction.options.getString("rarity");
          const partType = interaction.options.getString("part_type");
          const modSpeed = interaction.options.getInteger("mod_speed") ?? 0;
          const modAcceleration =
            interaction.options.getInteger("mod_acceleration") ?? 0;
          const modHandling =
            interaction.options.getInteger("mod_handling") ?? 0;
          const modDurability =
            interaction.options.getInteger("mod_durability") ?? 0;
          const gachaWeight = interaction.options.getInteger("gacha_weight");
          const imageUrl = interaction.options.getString("image_url");

          if (/\s/.test(partIdInput)) {
            return interaction.editReply({
              content: `❌ ${inlineCode("part_id")} không được chứa khoảng trắng.`,
            });
          }

          const partData = {
            partId: partIdInput,
            name: name,
            description: description || undefined,
            rarity: rarity,
            partType: partType,
            statModifiers: {
              speed: modSpeed,
              acceleration: modAcceleration,
              handling: modHandling,
              durability: modDurability,
            },
            gachaWeight: gachaWeight,
            imageUrl: imageUrl || undefined,
          };

          const updatedOrCreatedPart = await PartDefinition.findOneAndUpdate(
            { partId: partIdInput },
            { $set: partData },
            { upsert: true, new: true, runValidators: true },
          );

          const embed = new EmbedBuilder()
            .setColor("Aqua")
            .setTitle(
              `✅ ${updatedOrCreatedPart.createdAt.getTime() === updatedOrCreatedPart.updatedAt.getTime() ? "Đã thêm phụ tùng mới" : "Đã cập nhật phụ tùng"}`,
            )
            .addFields(
              {
                name: "Part ID",
                value: inlineCode(updatedOrCreatedPart.partId),
                inline: true,
              },
              {
                name: "Tên Phụ Tùng",
                value: updatedOrCreatedPart.name,
                inline: true,
              },
              {
                name: "Loại",
                value: updatedOrCreatedPart.partType.toUpperCase(),
                inline: true,
              },
              {
                name: "Độ hiếm",
                value: updatedOrCreatedPart.rarity.toUpperCase(),
                inline: true,
              },
              {
                name: "Trọng số Gacha",
                value: updatedOrCreatedPart.gachaWeight.toString(),
                inline: true,
              },
              {
                name: "Mô tả",
                value: updatedOrCreatedPart.description || "Không có",
              },
              {
                name: "Chỉ số Modifiers",
                value: `Tốc độ: ${updatedOrCreatedPart.statModifiers.speed}, Tăng tốc: ${updatedOrCreatedPart.statModifiers.acceleration}, Xử lý: ${updatedOrCreatedPart.statModifiers.handling}, Độ bền: ${updatedOrCreatedPart.statModifiers.durability}`,
              },
              {
                name: "Image URL",
                value: updatedOrCreatedPart.imageUrl || "Chưa có",
              },
            )
            .setTimestamp(updatedOrCreatedPart.updatedAt);
          if (updatedOrCreatedPart.imageUrl)
            embed.setThumbnail(updatedOrCreatedPart.imageUrl);

          await interaction.editReply({ embeds: [embed] });
          Logger.info(
            `[Admin-Gacha/Part-Add] User ${interaction.user.tag} added/updated part definition: ${partIdInput}`,
          );
        }
        // else if (subcommand === 'delete') {
        //     // Logic xóa part definition (nếu bạn muốn thêm)
        // }
      }
    } catch (error) {
      Logger.error(
        `Lỗi lệnh /admin-gacha ${subcommandGroup} ${subcommand}: ${error.message}`,
        { stack: error.stack },
      );
      if (error.name === "ValidationError") {
        let errorMsg = "❌ Lỗi Validation:";
        for (const field in error.errors) {
          errorMsg += `\n- ${error.errors[field].message}`;
        }
        await interaction.editReply({ content: errorMsg });
      } else if (error.code === 11000) {
        // Lỗi duplicate key
        const field = Object.keys(error.keyValue)[0];
        await interaction.editReply({
          content: `❌ Lỗi: ${inlineCode(field)} với giá trị '${error.keyValue[field]}' đã tồn tại.`,
        });
      } else {
        await interaction.editReply({
          content: `❌ Đã xảy ra lỗi khi thực hiện thao tác với Gacha data.`,
        });
      }
    }
  },
};
