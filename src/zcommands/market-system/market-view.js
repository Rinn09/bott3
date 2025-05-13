const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  inlineCode,
} = require("discord.js");
const MarketListing = require("../../models/MarketListing");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

const ITEMS_PER_PAGE = 5; // Số vật phẩm mỗi trang

const rarityColors = {
  common: "#95a5a6", // Xám nhạt
  uncommon: "#2ecc71", // Xanh lá
  rare: "#3498db", // Xanh dương
  epic: "#9b59b6", // Tím
  legendary: "#f1c40f", // Vàng
  mythic: "#e67e22", // Cam đậm
  default: "#99aab5", // Màu mặc định (Discord grey)
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market-view")
    .setDescription("Xem các vật phẩm, xe, và phụ tùng đang được bán trên chợ.") // Cập nhật mô tả
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Số trang muốn xem (mặc định là 1)")
        .setMinValue(1)
        .setRequired(false),
    )
    .addStringOption(
      (
        option, // Thêm filter theo loại
      ) =>
        option
          .setName("type_filter")
          .setDescription("Lọc theo loại vật phẩm, xe hoặc phụ tùng")
          .setRequired(false)
          .addChoices(
            { name: "Tất cả", value: "all" },
            { name: "Vật phẩm (Shop Item)", value: "shop_item" },
            { name: "Xe (Car)", value: "car_instance" },
            { name: "Phụ tùng (Part)", value: "part_instance" },
          ),
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    let requestedPage = interaction.options.getInteger("page") || 1;
    const typeFilter = interaction.options.getString("type_filter");

    await interaction.deferReply({ ephemeral: false });

    const generateMarketEmbedAndButtons = async (page, currentTypeFilter) => {
      const mongoQuery = { guildId, status: "active" };
      if (currentTypeFilter && currentTypeFilter !== "all") {
        mongoQuery.itemType = currentTypeFilter;
      }

      const listingsCount = await MarketListing.countDocuments(mongoQuery);
      const totalPages = Math.ceil(listingsCount / ITEMS_PER_PAGE) || 1;

      if (page > totalPages) page = totalPages;
      if (page < 1) page = 1;

      const skip = (page - 1) * ITEMS_PER_PAGE;

      const listings = await MarketListing.find(mongoQuery)
        .sort({ listedAt: -1 })
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .lean(); // Sử dụng lean() để tăng hiệu suất

      let embedTitleType = "Tất Cả Tin Đăng";
      if (currentTypeFilter === "shop_item") embedTitleType = "Vật Phẩm";
      else if (currentTypeFilter === "car_instance") embedTitleType = "Xe";
      else if (currentTypeFilter === "part_instance")
        embedTitleType = "Phụ Tùng";

      const embed = new EmbedBuilder()
        .setTitle(
          `🛒 Chợ VNGarage - ${embedTitleType} (Trang ${page}/${totalPages})`,
        )
        .setColor(rarityColors.default) // Màu mặc định, sẽ thay đổi theo item nếu có
        .setTimestamp()
        .setFooter({ text: `Sử dụng /market-buy <ID> để mua.` });

      if (!listings.length && listingsCount === 0) {
        embed.setDescription(
          "😕 Hiện tại không có gì được đăng bán trên chợ" +
            (currentTypeFilter && currentTypeFilter !== "all"
              ? ` theo bộ lọc "${embedTitleType}".`
              : "."),
        );
        return {
          embeds: [embed],
          components: [],
          currentPage: page,
          totalPages,
        };
      } else if (!listings.length && listingsCount > 0) {
        // Có item nhưng không ở trang này
        embed.setDescription(
          `Không tìm thấy mục nào ở trang ${page}. Tổng số trang: ${totalPages}.`,
        );
        return {
          embeds: [embed],
          components: [
            generatePaginationButtons(
              page,
              totalPages,
              `market_view_${currentTypeFilter || "all"}_`,
            ),
          ],
          currentPage: page,
          totalPages,
        };
      }

      for (const listing of listings) {
        const snapshot = listing.itemSnapshot;
        let nameDisplay = listing.itemName; // Tên mặc định
        let valueDisplay = `Người bán: ${listing.sellerUsername}\n`;
        let itemRarity = "common"; // Mặc định độ hiếm

        if (listing.itemType === "shop_item" && snapshot) {
          nameDisplay = `📦 ${snapshot.name || listing.itemName} (x${listing.quantity})`;
          valueDisplay += `Giá: **${(listing.price || 0).toLocaleString()} VNĐ / cái**\n`;
          if (snapshot.description)
            valueDisplay += `*${snapshot.description.substring(0, 100)}${snapshot.description.length > 100 ? "..." : ""}*\n`;
          // itemRarity có thể không có cho shop_item, giữ default
        } else if (listing.itemType === "car_instance" && snapshot) {
          itemRarity = snapshot.rarity || "common";
          nameDisplay = `🚗 ${snapshot.modelName || listing.itemName} [${snapshot.brand || "N/A"}] - ${itemRarity.toUpperCase()}`;
          valueDisplay += `Giá tổng: **${(listing.price || 0).toLocaleString()} VNĐ**\n`;
          valueDisplay += `Chỉ số: Tốc ${snapshot.baseStats?.speed || "N/A"} | Tăng ${snapshot.baseStats?.acceleration || "N/A"} | Xử lý ${snapshot.baseStats?.handling || "N/A"} | Bền ${snapshot.baseStats?.durability || "N/A"}\n`;
          if (snapshot.installedParts && snapshot.installedParts.length > 0) {
            valueDisplay += `Phụ tùng: ${snapshot.installedParts.map((p) => p.partName).join(", ") || "Không có"}\n`;
          }
          if (snapshot.cosmetics?.licensePlate)
            valueDisplay += `Biển số: ${inlineCode(snapshot.cosmetics.licensePlate)}\n`;
          if (snapshot.imageUrl) embed.setThumbnail(snapshot.imageUrl); // Thumbnail cho xe đầu tiên
        } else if (listing.itemType === "part_instance" && snapshot) {
          itemRarity = snapshot.rarity || "common";
          nameDisplay = `⚙️ ${snapshot.name || listing.itemName} [${snapshot.partType?.toUpperCase() || "N/A"}] - ${itemRarity.toUpperCase()}`;
          valueDisplay += `Giá: **${(listing.price || 0).toLocaleString()} VNĐ / cái**\n`;
          if (snapshot.statModifiers) {
            const stats = Object.entries(snapshot.statModifiers)
              .filter(([, val]) => val !== 0)
              .map(
                ([key, val]) =>
                  `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${val > 0 ? "+" : ""}${val}`,
              )
              .join(" | ");
            if (stats) valueDisplay += `Chỉ số: ${stats}\n`;
          }
          if (snapshot.imageUrl && !embed.thumbnail)
            embed.setThumbnail(snapshot.imageUrl); // Thumbnail cho phụ tùng nếu chưa có xe
        } else {
          // Fallback nếu snapshot lỗi hoặc itemType không rõ
          nameDisplay = `${listing.itemName} (x${listing.quantity})`;
          valueDisplay += `Giá: **${(listing.price || 0).toLocaleString()} VNĐ / cái**\n`;
        }

        valueDisplay += `Đăng lúc: <t:${Math.floor(new Date(listing.listedAt).getTime() / 1000)}:R>\nID: ${inlineCode(listing._id.toString())}`;

        embed.addFields({
          name: nameDisplay,
          value: valueDisplay,
          inline: false,
        });
        // Chỉ set màu theo item đầu tiên của trang để embed không bị đổi màu liên tục
        if (listings.indexOf(listing) === 0) {
          embed.setColor(rarityColors[itemRarity] || rarityColors.default);
          if (
            snapshot &&
            (listing.itemType === "car_instance" ||
              listing.itemType === "part_instance") &&
            snapshot.imageUrl
          ) {
            embed.setThumbnail(snapshot.imageUrl);
          }
        }
      }
      // Nút phân trang sẽ truyền cả typeFilter hiện tại
      const components = [
        generatePaginationButtons(
          page,
          totalPages,
          `market_view_${currentTypeFilter || "all"}_`,
        ),
      ];

      return {
        embeds: [embed],
        components,
        currentPage: page,
        totalPages,
        currentTypeFilter,
      };
    };

    const generatePaginationButtons = (
      currentPage,
      totalPages,
      prefixWithFilter,
    ) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`${prefixWithFilter}prev_${currentPage}`)
          .setLabel("◀️ Trước")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId(`${prefixWithFilter}next_${currentPage}`)
          .setLabel("Sau ▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage >= totalPages),
      );
    };

    const initialData = await generateMarketEmbedAndButtons(
      requestedPage,
      typeFilter,
    );
    const message = await interaction.editReply(initialData);

    if (initialData.totalPages <= 1 && (!typeFilter || typeFilter === "all"))
      return; // Không cần collector nếu chỉ có 1 trang và không filter

    const collectorFilter = (i) => {
      const [prefix, viewOrSearch, filterType, action, pageStr] =
        i.customId.split("_");
      return (
        i.user.id === interaction.user.id &&
        prefix === "market" &&
        viewOrSearch === "view"
      );
    };

    const collector = message.createMessageComponentCollector({
      filter: collectorFilter, // Sử dụng filter đã định nghĩa
      time: 5 * 60 * 1000, // 5 phút
    });

    let currentCollectedPage = initialData.currentPage;
    let currentCollectedTypeFilter = initialData.currentTypeFilter;

    collector.on("collect", async (i) => {
      if (!i.isButton()) return;
      await i.deferUpdate();

      const customIdParts = i.customId.split("_"); // market_view_type_action_page
      currentCollectedTypeFilter = customIdParts[2]; // Lấy type filter từ customId
      const action = customIdParts[3];
      // currentCollectedPage được lấy từ button id hoặc được cập nhật ở vòng lặp trước
      let pageFromButton = parseInt(customIdParts[4]);

      if (action === "prev") {
        currentCollectedPage = Math.max(1, pageFromButton - 1); // Đảm bảo không nhỏ hơn 1
      } else if (action === "next") {
        currentCollectedPage = Math.min(
          initialData.totalPages,
          pageFromButton + 1,
        ); // Đảm bảo không lớn hơn tổng số trang
      }

      const newData = await generateMarketEmbedAndButtons(
        currentCollectedPage,
        currentCollectedTypeFilter,
      );
      currentCollectedPage = newData.currentPage; // Cập nhật lại trang hiện tại sau khi newData clamp giá trị
      await i.editReply(newData);
    });

    collector.on("end", async (collected, reason) => {
      if (reason !== "messageDelete") {
        // Lấy lại dữ liệu cuối cùng để disable nút
        const finalData = await generateMarketEmbedAndButtons(
          currentCollectedPage,
          currentCollectedTypeFilter,
        );
        if (finalData.components && finalData.components.length > 0) {
          const disabledComponents = finalData.components.map((row) => {
            row.components.forEach((button) => button.setDisabled(true));
            return row;
          });
          try {
            await message.edit({ components: disabledComponents });
          } catch (error) {
            Logger.warn(
              `Could not edit market view message on collector end: ${error.message}`,
            );
          }
        }
      }
    });
  },
};
