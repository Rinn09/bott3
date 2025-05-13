const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");
const CarModel = require("../../models/CarModel");
const PartDefinition = require("../../models/PartDefinition");
const Logger = require("../../utils/logger");

const ITEMS_PER_PAGE = 5; // Hiển thị 5 định nghĩa mỗi trang

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list-gacha-items") // Hoặc gacha-definitions, view-gacha-pool
    .setDescription(
      "Xem danh sách các xe và phụ tùng đang có trong hệ thống Gacha.",
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription(
          "Chọn loại muốn xem (xe hoặc phụ tùng). Mặc định xem cả hai.",
        )
        .setRequired(false)
        .addChoices(
          { name: "Chỉ Xe (Cars)", value: "cars" },
          { name: "Chỉ Phụ Tùng (Parts)", value: "parts" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Số trang muốn xem.")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const typeFilter = interaction.options.getString("type");
    let requestedPage = interaction.options.getInteger("page") || 1;
    const itemsPerPage = ITEMS_PER_PAGE;

    await interaction.deferReply();

    const generateEmbedAndComponents = async (page, currentTypeFilter) => {
      let items = [];
      let totalItems = 0;
      let itemTypeLabel = "Xe và Phụ tùng";

      const carQuery = CarModel.find().sort({ rarity: 1, name: 1 });
      const partQuery = PartDefinition.find().sort({ rarity: 1, name: 1 });

      if (currentTypeFilter === "cars") {
        items = await carQuery
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean();
        totalItems = await CarModel.countDocuments();
        itemTypeLabel = "Xe (Cars)";
      } else if (currentTypeFilter === "parts") {
        items = await partQuery
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean();
        totalItems = await PartDefinition.countDocuments();
        itemTypeLabel = "Phụ tùng (Parts)";
      } else {
        // Xem cả hai - phức tạp hơn nếu gộp chung và phân trang
        // Để đơn giản, nếu không filter, ta sẽ hiển thị xe trước, rồi phụ tùng
        // Hoặc, tốt hơn là yêu cầu người dùng chọn 1 trong 2 qua select menu nếu không có filter ban đầu
        // Hiện tại, nếu không filter, sẽ không hiển thị gì hoặc báo lỗi (cần cải thiện)
        // === TẠM THỜI: Nếu không filter, mặc định xem XE ===
        if (!currentTypeFilter) currentTypeFilter = "cars"; // Mặc định

        if (currentTypeFilter === "cars") {
          items = await carQuery
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .lean();
          totalItems = await CarModel.countDocuments();
          itemTypeLabel = "Xe (Cars)";
        } else {
          // currentTypeFilter === 'parts'
          items = await partQuery
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .lean();
          totalItems = await PartDefinition.countDocuments();
          itemTypeLabel = "Phụ tùng (Parts)";
        }
      }

      const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
      if (page > totalPages) page = totalPages;
      if (page < 1 && totalPages > 0) page = 1;

      const embed = new EmbedBuilder()
        .setTitle(
          `🔧 Kho Gacha: ${itemTypeLabel} - Trang ${page}/${totalPages}`,
        )
        .setColor("#2ECC71")
        .setFooter({
          text: `Tổng cộng ${totalItems} ${itemTypeLabel.toLowerCase()}`,
        });

      if (!items.length) {
        embed.setDescription("Không tìm thấy định nghĩa nào phù hợp.");
      } else {
        items.forEach((item) => {
          if (item.modelId) {
            // Là CarModel
            embed.addFields({
              name: `🚗 ${item.name} (${item.modelId})`,
              value: `Hãng: ${item.brand || "N/A"} | Hiếm: ${item.rarity} | Stats: S${item.baseStats.speed}/A${item.baseStats.acceleration}/H${item.baseStats.handling}/D${item.baseStats.durability} | Weight: ${item.gachaWeight}`,
              inline: false,
            });
          } else if (item.partId) {
            // Là PartDefinition
            const stats = Object.entries(item.statModifiers)
              .filter(([, value]) => value !== 0)
              .map(
                ([key, value]) =>
                  `${key.slice(0, 1).toUpperCase()}${value > 0 ? "+" : ""}${value}`,
              )
              .join(", ");
            embed.addFields({
              name: `⚙️ ${item.name} (${item.partId})`,
              value: `Loại: ${item.partType} | Hiếm: ${item.rarity} | Modifiers: ${stats || "Không có"} | Weight: ${item.gachaWeight}`,
              inline: false,
            });
          }
        });
      }

      // --- Components: Select Menu để đổi type, Buttons để đổi page ---
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("gacha_def_type_select")
        .setPlaceholder("Chọn loại để xem...")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Xem Tất Cả Xe")
            .setValue("cars")
            .setEmoji("🚗"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Xem Tất Cả Phụ Tùng")
            .setValue("parts")
            .setEmoji("⚙️"),
        );
      if (currentTypeFilter) {
        // Đặt giá trị hiện tại cho select menu nếu đã filter
        const currentOption = selectMenu.options.find(
          (opt) => opt.data.value === currentTypeFilter,
        );
        if (currentOption) currentOption.setDefault(true);
      }

      const paginationButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`gacha_def_prev_${currentTypeFilter || "all"}_${page}`)
          .setLabel("◀️ Trước")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId(`gacha_def_next_${currentTypeFilter || "all"}_${page}`)
          .setLabel("Sau ▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= totalPages),
      );

      return {
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(selectMenu),
          paginationButtons,
        ],
        currentPage: page,
        totalPages,
        currentTypeFilter,
      };
    };

    // Hiển thị lần đầu
    const initialData = await generateEmbedAndComponents(
      requestedPage,
      typeFilter || "cars",
    ); // Mặc định là 'cars' nếu không có filter
    const message = await interaction.editReply(initialData);

    // Collector
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect | ComponentType.Button, // Lắng nghe cả select và button
      time: 5 * 60 * 1000, // 5 phút
    });

    let collectorPage = initialData.currentPage;
    let collectorTypeFilter = initialData.currentTypeFilter;

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      let newPage = collectorPage;
      let newTypeFilter = collectorTypeFilter;

      if (i.isStringSelectMenu()) {
        // Xử lý chọn từ select menu
        newTypeFilter = i.values[0];
        newPage = 1; // Reset về trang 1 khi đổi filter
      } else if (i.isButton()) {
        // Xử lý nút pagination
        const [action, type, pageStr] = i.customId.split("_").slice(2); // Bỏ qua 'gacha_def'
        newPage = parseInt(pageStr);
        // type đã được lưu trong collectorTypeFilter rồi, nhưng có thể lấy lại từ button ID nếu cần
        if (action === "prev") newPage--;
        else if (action === "next") newPage++;
      }

      const newData = await generateEmbedAndComponents(newPage, newTypeFilter);
      collectorPage = newData.currentPage;
      collectorTypeFilter = newData.currentTypeFilter; // Quan trọng: Cập nhật lại filter type
      await i.editReply(newData);
    });

    collector.on("end", async (collected, reason) => {
      if (reason !== "messageDelete") {
        const finalData = await generateEmbedAndComponents(
          collectorPage,
          collectorTypeFilter,
        );
        const disabledComponents = finalData.components.map((row) => {
          row.components.forEach((comp) => comp.setDisabled(true));
          return row;
        });
        try {
          await message.edit({ components: disabledComponents });
        } catch (error) {
          /* Bỏ qua lỗi nếu tin nhắn đã bị xóa */
        }
      }
    });
  },
};
