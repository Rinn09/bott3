const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  inlineCode,
} = require("discord.js");
const User = require("../../models/User");
const PartDefinition = require("../../models/PartDefinition");

const ITEMS_PER_PAGE_WAREHOUSE = 10; // Số phụ tùng mỗi trang

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warehouse")
    .setDescription("Xem kho chứa phụ tùng của bạn.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Người dùng bạn muốn xem kho phụ tùng (chỉ admin).")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Số trang muốn xem.")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const targetUserOption = interaction.options.getUser("user");
    const targetUser = targetUserOption || interaction.user;
    let requestedPage = interaction.options.getInteger("page") || 1;

    if (
      targetUser.id !== interaction.user.id &&
      !interaction.member.permissions.has(
        require("discord.js").PermissionFlagsBits.Administrator,
      )
    ) {
      return interaction.reply({
        content: "❌ Bạn không có quyền xem kho của người khác.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({
      ephemeral: targetUser.id !== interaction.user.id && !targetUserOption,
    });

    const generateWarehouseEmbed = async (page, targetUserId) => {
      const user = await User.findOne({
        userId: targetUserId,
        guildId: interaction.guild.id,
      });

      if (
        !user ||
        !user.garage ||
        !user.garage.parts ||
        user.garage.parts.length === 0
      ) {
        return {
          embeds: [
            new EmbedBuilder()
              .setColor("Grey")
              .setTitle(`Kho Phụ Tùng của ${targetUser.username}`)
              .setDescription("🔧 Kho trống trơn, không có phụ tùng nào."),
          ],
          components: [],
          currentPage: 1,
          totalPages: 1,
        };
      }

      const userParts = user.garage.parts.filter(
        (p) => p.installedOnCar === null,
      );
      const totalParts = userParts.length;
      const totalPages = Math.ceil(totalParts / ITEMS_PER_PAGE_WAREHOUSE) || 1;

      if (page > totalPages) page = totalPages;
      if (page < 1) page = 1;

      const startIndex = (page - 1) * ITEMS_PER_PAGE_WAREHOUSE;
      const paginatedPartInstances = userParts.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE_WAREHOUSE,
      );

      // Lấy tất cả partDefinitionId cần thiết một lần
      const partDefinitionIds = [
        ...new Set(paginatedPartInstances.map((p) => p.partDefinitionId)),
      ];
      const partDefinitions = await PartDefinition.find({
        partId: { $in: partDefinitionIds },
      }).lean();
      const partDefMap = new Map(
        partDefinitions.map((def) => [def.partId, def]),
      );

      const embed = new EmbedBuilder()
        .setTitle(
          `🔩 Kho Phụ Tùng của ${targetUser.username} - Trang ${page}/${totalPages}`,
        )
        .setColor("#A9A9A9") // Màu xám cho kho
        .setFooter({ text: `Tổng cộng: ${totalParts} phụ tùng` });

      if (!paginatedPartInstances.length) {
        embed.setDescription("Không có phụ tùng nào ở trang này.");
      }

      for (const partInstance of paginatedPartInstances) {
        const definition = partDefMap.get(partInstance.partDefinitionId);
        let name = partInstance.partDefinitionId; // Fallback
        let details = `ID Instance: ${inlineCode(partInstance._id.toString())}\n`;

        if (definition) {
          name = definition.name;
          details += `Loại: ${definition.partType} | Hiếm: ${definition.rarity.toUpperCase()}\n`;
          const stats = Object.entries(definition.statModifiers)
            .filter(([, value]) => value !== 0)
            .map(
              ([key, value]) =>
                `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value > 0 ? "+" : ""}${value}`,
            )
            .join(" | ");
          if (stats) details += `Modifiers: ${stats}`;
        } else {
          details += `(Lỗi: Không tìm thấy định nghĩa phụ tùng)`;
        }
        embed.addFields({ name: `⚙️ ${name}`, value: details, inline: false });
      }
      // Components cho pagination
      const paginationButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`warehouse_prev_${targetUser.id}_${page}`)
          .setLabel("◀️ Trước")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId(`warehouse_next_${targetUser.id}_${page}`)
          .setLabel("Sau ▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= totalPages),
      );
      const components = totalPages > 1 ? [paginationButtons] : [];

      return { embeds: [embed], components, currentPage: page, totalPages };
    };

    const initialData = await generateWarehouseEmbed(
      requestedPage,
      targetUser.id,
    );
    const message = await interaction.editReply(initialData);

    if (initialData.totalPages <= 1) return; // Không cần collector nếu chỉ có 1 trang

    const filter = (i) =>
      (i.user.id === interaction.user.id ||
        (targetUser.id !== interaction.user.id &&
          i.user.id === targetUser.id)) &&
      (i.customId.startsWith(`warehouse_prev_${targetUser.id}_`) ||
        i.customId.startsWith(`warehouse_next_${targetUser.id}_`));
    const collector = message.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000,
    });

    let currentPage = initialData.currentPage;
    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const parts = i.customId.split("_");
      const action = parts[1];

      if (action === "prev") currentPage--;
      else if (action === "next") currentPage++;

      const newData = await generateWarehouseEmbed(currentPage, targetUser.id);
      currentPage = newData.currentPage; // Cập nhật lại trang hiện tại
      await i.editReply(newData);
    });

    collector.on("end", async () => {
      const finalData = await generateWarehouseEmbed(
        currentPage,
        targetUser.id,
      );
      if (finalData.components && finalData.components.length > 0) {
        const disabledComponents = finalData.components.map((row) => {
          row.components.forEach((comp) => comp.setDisabled(true));
          return row;
        });
        await message.edit({ components: disabledComponents }).catch(() => {});
      } else {
        await message.edit({ components: [] }).catch(() => {});
      }
    });
  },
};
