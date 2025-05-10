// src/commands/admin/add-car-model.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  inlineCode,
} = require("discord.js");
const CarModel = require("../../models/CarModel");
const Logger = require("../../utils/logger");

const RarityEnum = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-car-model")
    .setDescription("[Admin] Thêm hoặc cập nhật một mẫu xe vào database Gacha.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // --- Options ---
    .addStringOption((option) =>
      option
        .setName("model_id")
        .setDescription(
          "ID duy nhất cho mẫu xe (vd: sedan_basic, chữ thường, không dấu, không cách)",
        )
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
          ...RarityEnum.map((rarity) => ({
            name: rarity.toUpperCase(),
            value: rarity,
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
        .setDescription("Trọng số Gacha (số > 0, càng cao càng dễ roll ra).")
        .setRequired(true)
        .setMinValue(1),
    )
    // --- THÊM OPTION CHO CASTROLVALUE ---
    .addIntegerOption(
      (option) =>
        option
          .setName("castrol_value")
          .setDescription(
            "Số Castrol nhận được khi roll trùng xe này (tối thiểu 1).",
          )
          .setRequired(true) // Đặt là bắt buộc để đảm bảo mọi xe đều có giá trị này
          .setMinValue(1), // Giá trị Castrol tối thiểu là 1
    )
    // --- Các tùy chọn không bắt buộc ---
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Mô tả ngắn gọn về mẫu xe.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("brand")
        .setDescription("Hãng xe (vd: VinFast, Toyota).")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("image_url")
        .setDescription("URL hình ảnh của mẫu xe (không bắt buộc).")
        .setRequired(false),
    ),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ Bạn không có quyền sử dụng lệnh này.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false }); // ephemeral: true cho lệnh admin là tốt

    try {
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
      const baseDurability = interaction.options.getInteger("base_durability");
      const gachaWeight = interaction.options.getInteger("gacha_weight");
      const castrolValue = interaction.options.getInteger("castrol_value"); // << LẤY GIÁ TRỊ CASTROL
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
        castrolValue: castrolValue, // << THÊM VÀO carData
        imageUrl: imageUrl || undefined,
      };

      const updatedOrCreatedCar = await CarModel.findOneAndUpdate(
        { modelId: modelIdInput },
        { $set: carData },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
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
            // << THÊM HIỂN THỊ CASTROL VALUE >>
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

      if (updatedOrCreatedCar.imageUrl) {
        embed.setThumbnail(updatedOrCreatedCar.imageUrl);
      }

      await interaction.editReply({ embeds: [embed] });
      Logger.info(
        `[Admin Command] User ${interaction.user.tag} added/updated car model: ${modelIdInput}`,
      );
    } catch (error) {
      // ... (phần xử lý lỗi giữ nguyên) ...
      Logger.error(`Lỗi lệnh /add-car-model: ${error.message}`, {
        stack: error.stack,
      });
      if (error.name === "ValidationError") {
        let errorMsg = "❌ Lỗi Validation:";
        for (const field in error.errors) {
          errorMsg += `\n- ${error.errors[field].message}`;
        }
        await interaction.editReply({ content: errorMsg });
      } else if (error.code === 11000) {
        await interaction.editReply({
          content: `❌ Lỗi: ${inlineCode("model_id")} đã tồn tại (Duplicate Key).`,
        });
      } else {
        await interaction.editReply({
          content: "❌ Đã xảy ra lỗi khi thêm/cập nhật mẫu xe vào database.",
        });
      }
    }
  },
};
