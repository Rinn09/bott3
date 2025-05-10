const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  inlineCode,
} = require("discord.js");
const PartDefinition = require("../../models/PartDefinition"); // Import model PartDefinition
const Logger = require("../../utils/logger");

// Lấy danh sách độ hiếm và loại phụ tùng từ Enum (hoặc định nghĩa lại)
const RarityEnum = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];
const PartTypeEnum = ["engine", "tires", "ecu", "nitro", "chassis", "bodykit"]; // Giữ các giá trị này là chữ thường, không dấu

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-part-definition")
    .setDescription(
      "[Admin] Thêm hoặc cập nhật một định nghĩa phụ tùng vào database Gacha.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // --- Các tùy chọn bắt buộc ---
    .addStringOption((option) =>
      option
        .setName("part_id")
        .setDescription(
          "ID duy nhất cho phụ tùng (vd: engine_v6, chữ thường, không dấu, không cách)",
        )
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
          ...RarityEnum.map((r) => ({ name: r.toUpperCase(), value: r })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName("part_type")
        .setDescription("Loại phụ tùng.")
        .setRequired(true)
        .addChoices(
          ...PartTypeEnum.map((pt) => ({ name: pt.toUpperCase(), value: pt })),
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("gacha_weight")
        .setDescription("Trọng số Gacha (số > 0, càng cao càng dễ roll ra).")
        .setRequired(true)
        .setMinValue(1),
    )
    // --- Các tùy chọn không bắt buộc ---
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Mô tả ngắn gọn về phụ tùng.")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("mod_speed")
        .setDescription("Chỉ số Tốc độ cộng thêm (hoặc trừ). Mặc định: 0.")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("mod_acceleration")
        .setDescription("Chỉ số Tăng tốc cộng thêm. Mặc định: 0.")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("mod_handling")
        .setDescription("Chỉ số Xử lý cộng thêm. Mặc định: 0.")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("mod_durability")
        .setDescription("Chỉ số Độ bền cộng thêm. Mặc định: 0.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("image_url")
        .setDescription("URL hình ảnh của phụ tùng (không bắt buộc).")
        .setRequired(false),
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    try {
      const partIdInput = interaction.options
        .getString("part_id")
        .toLowerCase()
        .trim();
      const name = interaction.options.getString("name");
      const description = interaction.options.getString("description");
      const rarity = interaction.options.getString("rarity");
      const partType = interaction.options.getString("part_type");
      const modSpeed = interaction.options.getInteger("mod_speed") ?? 0; // Mặc định là 0 nếu không nhập
      const modAcceleration =
        interaction.options.getInteger("mod_acceleration") ?? 0;
      const modHandling = interaction.options.getInteger("mod_handling") ?? 0;
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

      if (updatedOrCreatedPart.imageUrl) {
        embed.setThumbnail(updatedOrCreatedPart.imageUrl);
      }

      await interaction.editReply({ embeds: [embed] });
      Logger.info(
        `[Admin Command] User ${interaction.user.tag} added/updated part definition: ${partIdInput}`,
      );
    } catch (error) {
      Logger.error(`Lỗi lệnh /add-part-definition: ${error.message}`, {
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
          content: `❌ Lỗi: ${inlineCode("part_id")} đã tồn tại.`,
        });
      } else {
        await interaction.editReply({
          content: "❌ Đã xảy ra lỗi khi thêm/cập nhật định nghĩa phụ tùng.",
        });
      }
    }
  },
};
