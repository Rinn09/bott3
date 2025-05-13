const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  inlineCode,
} = require("discord.js");
const MarketListing = require("../../models/MarketListing");
const User = require("../../models/User");
const MarketTransaction = require("../../models/MarketTransaction");
const ShopItem = require("../../models/ShopItem");
const CarModel = require("../../models/CarModel");
const { PartDefinition } = require("../../models/PartDefinition");
const GuildConfig = require("../../models/GuildConfig");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

const ITEMS_PER_PAGE_MARKET = 5;
const TRANSACTIONS_PER_PAGE_HISTORY = 10;

const rarityColors = {
  common: "#95a5a6",
  uncommon: "#2ecc71",
  rare: "#3498db",
  epic: "#9b59b6",
  legendary: "#f1c40f",
  mythic: "#e67e22",
  default: "#99aab5",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market")
    .setDescription("Tương tác với hệ thống Chợ VN Garage.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription(
          "Xem các vật phẩm, xe, và phụ tùng đang được bán trên chợ.",
        )
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Số trang muốn xem (mặc định 1)")
            .setMinValue(1),
        )
        .addStringOption((option) =>
          option
            .setName("type_filter")
            .setDescription("Lọc theo loại")
            .setRequired(false)
            .addChoices(
              { name: "Tất cả", value: "all" },
              { name: "Vật phẩm (Shop Item)", value: "shop_item" },
              { name: "Xe (Car)", value: "car_instance" },
              { name: "Phụ tùng (Part)", value: "part_instance" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("search")
        .setDescription(
          "Tìm kiếm vật phẩm, xe, hoặc phụ tùng trên chợ theo tên.",
        )
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("Tên bạn muốn tìm kiếm.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Số trang kết quả (mặc định 1)")
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sell")
        .setDescription("Đăng bán vật phẩm, xe, hoặc phụ tùng của bạn lên chợ.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Loại bạn muốn bán.")
            .setRequired(true)
            .addChoices(
              { name: "Vật phẩm từ Túi đồ (Inventory)", value: "shop_item" },
              { name: "Xe từ Garage", value: "car_instance" },
              { name: "Phụ tùng từ Kho (Warehouse)", value: "part_instance" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("id_to_sell") // Đổi tên cho rõ nghĩa hơn
            .setDescription(
              "ID của Xe/Phụ tùng từ Garage/Kho, hoặc ItemID từ Túi đồ.",
            )
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("price")
            .setDescription(
              "Giá cho MỖI đơn vị (vật phẩm/phụ tùng), hoặc TỔNG giá (cho xe).",
            )
            .setRequired(true)
            .setMinValue(0),
        ) // Giá không thể âm
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("Số lượng (xe luôn là 1, bỏ qua nếu bán xe).")
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buy")
        .setDescription("Mua một vật phẩm, xe, hoặc phụ tùng từ chợ.")
        .addStringOption((option) =>
          option
            .setName("listing_id")
            .setDescription("ID của tin đăng bạn muốn mua.")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription(
              "Số lượng muốn mua (chỉ áp dụng cho vật phẩm, mặc định là toàn bộ số lượng đăng bán).",
            )
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unlist")
        .setDescription(
          "Hủy một tin đăng bán vật phẩm, xe, hoặc phụ tùng của bạn.",
        )
        .addStringOption((option) =>
          option
            .setName("listing_id")
            .setDescription("ID của tin đăng bạn muốn hủy.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mylistings")
        .setDescription("Xem các tin đăng đang hoạt động của bạn trên chợ.")
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Số trang muốn xem (mặc định 1)")
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("history")
        .setDescription("Xem lịch sử mua và bán của bạn trên chợ.")
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Số trang muốn xem (mặc định 1)")
            .setMinValue(1),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const client = interaction.client; // Lấy client instance

    // Không defer chung ở đây, để từng subcommand tự quyết định
    // vì một số lệnh như sell, buy, unlist cần transaction và có thể trả lời nhanh nếu lỗi sớm.

    try {
      if (subcommand === "view") {
        await interaction.deferReply({ ephemeral: false });
        let requestedPage = interaction.options.getInteger("page") || 1;
        const typeFilter = interaction.options.getString("type_filter");

        const generateMarketEmbedAndButtons = async (
          page,
          currentTypeFilter,
        ) => {
          const mongoQuery = { guildId, status: "active" };
          if (currentTypeFilter && currentTypeFilter !== "all") {
            mongoQuery.itemType = currentTypeFilter;
          }

          const listingsCount = await MarketListing.countDocuments(mongoQuery);
          const totalPages =
            Math.ceil(listingsCount / ITEMS_PER_PAGE_MARKET) || 1;

          if (page > totalPages) page = totalPages;
          if (page < 1) page = 1;

          const skip = (page - 1) * ITEMS_PER_PAGE_MARKET;

          const listings = await MarketListing.find(mongoQuery)
            .sort({ listedAt: -1 })
            .skip(skip)
            .limit(ITEMS_PER_PAGE_MARKET)
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
            .setFooter({ text: `Sử dụng /market buy <ID> để mua.` });

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
              if (
                snapshot.installedParts &&
                snapshot.installedParts.length > 0
              ) {
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

        if (
          initialData.totalPages <= 1 &&
          (!typeFilter || typeFilter === "all")
        )
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
      } else if (subcommand === "search") {
        await interaction.deferReply({ ephemeral: false });
        const searchQuery = interaction.options.getString("query");
        let requestedSearchPage = interaction.options.getInteger("page") || 1;

        const generateSearchResultsEmbedAndButtons = async (page, query) => {
          const mongoQuery = {
            guildId,
            status: "active",
            itemName: { $regex: new RegExp(query, "i") },
          };

          const listingsCount = await MarketListing.countDocuments(mongoQuery);
          const totalPages =
            Math.ceil(listingsCount / ITEMS_PER_PAGE_MARKET) || 1;

          if (page > totalPages) page = totalPages;
          if (page < 1) page = 1;

          const skip = (page - 1) * ITEMS_PER_PAGE_MARKET;

          const listings = await MarketListing.find(mongoQuery)
            .sort({ listedAt: -1 }) // Sắp xếp mới nhất lên đầu, hoặc theo relevancy nếu dùng $text search
            .skip(skip)
            .limit(ITEMS_PER_PAGE_MARKET)
            .lean();

          const embed = new EmbedBuilder()
            .setTitle(
              `🔎 Kết quả tìm kiếm cho: "${query}" - Trang ${page}/${totalPages}`,
            )
            .setColor("#2ECC71") // Màu xanh lá cây cho tìm kiếm thành công
            .setTimestamp();

          if (!listings.length && listingsCount === 0) {
            embed.setDescription(
              `Không tìm thấy vật phẩm nào khớp với "${query}" trên chợ.`,
            );
            return {
              embeds: [embed],
              components: [],
              currentPage: page,
              totalPages,
            };
          } else if (!listings.length && listingsCount > 0) {
            embed.setDescription(
              `Không tìm thấy vật phẩm ở trang ${page} cho tìm kiếm "${query}". Tổng số trang: ${totalPages}.`,
            );
            return {
              embeds: [embed],
              components: [
                generatePaginationButtons(page, totalPages, "market_search_"),
              ],
              currentPage: page,
              totalPages,
            };
          }

          listings.forEach((listing) => {
            embed.addFields({
              name: `${listing.itemSnapshot?.name || listing.itemName} (x${listing.quantity}) - ID: \`${listing._id}\``,
              value: `Người bán: ${listing.sellerUsername}\nGiá: **${listing.price.toLocaleString()} VNĐ / cái**\nĐăng lúc: <t:${Math.floor(listing.listedAt.getTime() / 1000)}:R>`,
              inline: false,
            });
          });

          const components = [
            generatePaginationButtons(page, totalPages, "market_search_"),
          ];
          // Chỉ thêm hàng nút mua nếu có vật phẩm và nếu bạn muốn tích hợp luôn nút mua ở đây
          // Tuy nhiên, để giữ cho lệnh search tập trung, có thể người dùng sẽ dùng /market-buy sau khi có ID
          // Nếu muốn thêm nút mua trực tiếp:

          /*if (listings.length > 0) {
                         const buyButtonsRow = new ActionRowBuilder();
                         listings.slice(0, 5).forEach(listing => {
                             buyButtonsRow.addComponents(
                                 new ButtonBuilder()
                                     .setCustomId(`market_buy_${listing._id}`) // customId cho nút mua
                                     .setLabel(`Mua ${listing.itemSnapshot?.name || listing.itemName.substring(0,15)}`)
                                     .setStyle(ButtonStyle.Success)
                                     .setEmoji('🛒')
                             );
                         });
                         components.push(buyButtonsRow);
                    }
                         */

          return { embeds: [embed], components, currentPage: page, totalPages };
        };

        const generatePaginationButtons = (currentPage, totalPages, prefix) => {
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`${prefix}prev_${currentPage}`)
              .setLabel("◀️ Trước")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId(`${prefix}next_${currentPage}`)
              .setLabel("Sau ▶️")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages || totalPages === 0), // Disable nếu không có trang nào
          );
        };

        const initialData = await generateSearchResultsEmbedAndButtons(
          requestedSearchPage,
          searchQuery,
        );
        const message = await interaction.editReply(initialData);
        const filter = (i) =>
          i.user.id === interaction.user.id &&
          i.customId.startsWith("market_search_");
        const collector = message.createMessageComponentCollector({
          filter,
          time: 5 * 60 * 1000, // 5 phút
        });

        let currentCollectorPage = initialData.currentPage; // Biến để theo dõi trang hiện tại của collector

        collector.on("collect", async (i) => {
          if (i.customId.startsWith("market_search_")) {
            // Xử lý phân trang
            await i.deferUpdate();
            const action = i.customId.split("_")[2];
            let currentPage = parseInt(i.customId.split("_")[3]);

            if (action === "prev") currentPage--;
            if (action === "next") currentPage++;

            const newData = await generateSearchResultsEmbedAndButtons(
              currentPage,
              searchQuery,
            );
            await i.editReply(newData);
          } else if (i.customId.startsWith("market_buy_")) {
            // Xử lý nút mua
            const listingId = i.customId.split("_")[2];
            const listing = await MarketListing.findOne({
              _id: listingId,
              guildId,
              status: "active",
            });

            if (!listing) {
              return i.reply({
                content: "❌ Tin đăng này không còn tồn tại hoặc đã được bán.",
                ephemeral: true,
              });
            }
            if (listing.sellerId === i.user.id) {
              return i.reply({
                content: "❌ Bạn không thể tự mua vật phẩm của chính mình.",
                ephemeral: true,
              });
            }

            const searchSession = await mongoose.startSession();
            searchSession.startTransaction();

            try {
              const buyerData = await User.findOne({
                userId: i.user.id,
                guildId,
              }).session(searchSession);
              const sellerData = await User.findOne({
                userId: listing.sellerId,
                guildId,
              }).session(searchSession);

              if (!buyerData)
                throw new Error("Không tìm thấy dữ liệu người mua.");
              if (!sellerData)
                throw new Error("Không tìm thấy dữ liệu người bán.");

              const totalPrice = listing.price * listing.quantity;
              if (buyerData.balance < totalPrice) {
                throw new Error(
                  `Bạn không đủ tiền. Cần **${totalPrice.toLocaleString()} VNĐ**, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`,
                );
              }

              // Thực hiện giao dịch
              buyerData.balance -= totalPrice;
              sellerData.balance += totalPrice;

              // Cập nhật inventory người mua
              const buyerCurrentItemQty =
                buyerData.inventory.get(listing.itemId) || 0;
              buyerData.inventory.set(
                listing.itemId,
                buyerCurrentItemQty + listing.quantity,
              );
              buyerData.markModified("inventory");

              // Xóa tin đăng
              await MarketListing.deleteOne({
                _id: listing._id,
              }).session(searchSession);

              await buyerData.save({ searchSession });
              await sellerData.save({ searchSession });
              await searchSession.commitTransaction();

              await i.reply({
                content: `✅ Đã mua thành công **${listing.quantity}x ${listing.itemName}** với giá **${totalPrice.toLocaleString()} VNĐ**!`,
                ephemeral: true,
              });
            } catch (error) {
              await searchSession.abortTransaction();
              Logger.error(
                `Lỗi khi xử lý mua hàng từ nút market-buy: ${error.message}`,
              );
              await i.reply({
                content: `❌ Lỗi khi mua vật phẩm: ${error.message}`,
                ephemeral: true,
              });
            } finally {
              await searchSession.endSession();
            }
          }
        });

        collector.on("end", async (collected, reason) => {
          if (reason !== "messageDelete") {
            // Không cố edit nếu tin nhắn đã bị xóa
            const finalData = await generateSearchResultsEmbedAndButtons(
              currentCollectorPage,
              searchQuery,
            );
            const disabledComponents = finalData.components.map((row) => {
              row.components.forEach((button) => button.setDisabled(true));
              return row;
            });
            try {
              await message.edit({
                components: disabledComponents,
              });
            } catch (error) {
              // Logger.warn(`Could not edit market search message on collector end: ${error.message}`);
            }
          }
        });
      } else if (subcommand === "sell") {
        await interaction.deferReply({ ephemeral: false }); // Sell có thể public kết quả
        const sellerId = userId;
        const idToSell = interaction.options.getString("id_to_sell");
        const itemTypeToSell = interaction.options.getString("type");
        let quantityToSell = interaction.options.getInteger("quantity");
        const priceInput = interaction.options.getInteger("price");
        const MAX_LISTINGS_PER_USER = 10;
        const currentListingsCount = await MarketListing.countDocuments({
          sellerId,
          guildId,
          status: "active",
        });
        if (currentListingsCount >= MAX_LISTINGS_PER_USER) {
          return interaction.editReply({
            content: `❌ Bạn đã đạt giới hạn ${MAX_LISTINGS_PER_USER} tin đăng.`,
          });
        }
        const sellSession = await mongoose.startSession();
        try {
          sellSession.startTransaction();
          const sellerData = await User.findOne({
            userId: sellerId,
            guildId,
          }).session(sellSession);
          if (!sellerData)
            throw new Error("Không tìm thấy dữ liệu người dùng.");

          let itemToSellData;
          let itemNameDisplay;
          let actualItemId; // ObjectId.toString() cho car/part, hoặc string itemId cho shop_item
          let itemSnapshot = {};
          let finalPrice = priceInput; // Giá sẽ được lưu vào DB

          if (itemTypeToSell === "shop_item") {
            if (quantityToSell === null || quantityToSell === undefined)
              quantityToSell = 1;

            const itemInInventory =
              sellerData.inventory?.get(idToSell.toLowerCase()) || 0;
            if (itemInInventory < quantityToSell) {
              throw new Error(
                `Bạn không có đủ ${quantityToSell} vật phẩm \`${idToSell}\`. Hiện có: ${itemInInventory}.`,
              );
            }
            itemToSellData = await ShopItem.findOne({
              itemId: idToSell.toLowerCase(),
            }).lean();
            if (!itemToSellData)
              throw new Error(`Vật phẩm với ID \`${idToSell}\` không tồn tại.`);
            if (itemToSellData.marketable === false) {
              throw new Error(
                `Vật phẩm **${itemToSellData.name}** không được phép bán trên chợ.`,
              );
            }

            itemNameDisplay = itemToSellData.name;
            actualItemId = itemToSellData.itemId;
            itemSnapshot = {
              name: itemToSellData.name,
              description: itemToSellData.description,
              effects: itemToSellData.effects, // Ví dụ
              // Sao chép các trường cần thiết khác
            };
            // Trừ vật phẩm khỏi inventory
            const newInventoryQty = itemInInventory - quantityToSell;
            if (newInventoryQty <= 0) {
              sellerData.inventory.delete(idToSell.toLowerCase());
            } else {
              sellerData.inventory.set(idToSell.toLowerCase(), newInventoryQty);
            }
            sellerData.markModified("inventory");
          } else if (itemTypeToSell === "car_instance") {
            if (!mongoose.Types.ObjectId.isValid(idToSell))
              throw new Error("ID Xe không hợp lệ.");
            quantityToSell = 1; // Xe luôn bán số lượng 1

            const carIndex = sellerData.garage.cars.findIndex(
              (c) => c._id.toString() === idToSell,
            );
            if (carIndex === -1)
              throw new Error("Không tìm thấy xe này trong garage của bạn.");

            const carInstance = sellerData.garage.cars[carIndex];
            if (carInstance.isListedOnMarket)
              throw new Error("Xe này đã được đăng bán.");
            // Cân nhắc: Nếu xe đang lắp phụ tùng, có cho bán không? Hoặc yêu cầu tháo?
            // Tạm thời cho bán nguyên trạng, snapshot sẽ lưu phụ tùng.

            const carModel = await CarModel.findOne({
              modelId: carInstance.carModelId,
            }).lean();
            if (!carModel) throw new Error("Không tìm thấy định nghĩa mẫu xe.");

            itemNameDisplay = carModel.name;
            actualItemId = carInstance._id.toString();

            // Tạo snapshot cho xe (bao gồm cả phụ tùng đang lắp nếu có)
            let installedPartsDetails = [];
            if (
              carInstance.installedParts &&
              carInstance.installedParts.size > 0
            ) {
              for (const [
                slot,
                partInstanceIdObj,
              ] of carInstance.installedParts.entries()) {
                if (partInstanceIdObj) {
                  // Kiểm tra partInstanceIdObj có tồn tại không
                  const partInstanceId = partInstanceIdObj.toString();
                  const partInst = sellerData.garage.parts.find(
                    (p) => p._id.toString() === partInstanceId,
                  );
                  if (partInst) {
                    const partDef = await PartDefinition.findOne({
                      partId: partInst.partDefinitionId,
                    }).lean();
                    installedPartsDetails.push({
                      slot: slot,
                      partName: partDef?.name || partInst.partDefinitionId,
                      partDefinitionId: partInst.partDefinitionId,
                      // Thêm các statModifiers của partDef nếu cần
                    });
                  }
                }
              }
            }

            itemSnapshot = {
              type: "car",
              modelId: carInstance.carModelId,
              modelName: carModel.name,
              brand: carModel.brand,
              rarity: carModel.rarity,
              baseStats: carModel.baseStats,
              cosmetics: carInstance.cosmetics,
              installedParts: installedPartsDetails, // Lưu chi tiết phụ tùng
              // Nên tính toán và lưu luôn currentStats của xe ở đây
            };

            // Đánh dấu xe đang được bán, hoặc xóa khỏi garage (tùy logic bạn muốn)
            // Cách 1: Đánh dấu
            sellerData.garage.cars[carIndex].isListedOnMarket = true;
            sellerData.garage.cars[carIndex].marketListingId = null; // Sẽ được cập nhật sau khi listing tạo
            sellerData.markModified("garage.cars");
            // Cách 2: Xóa (Nếu xóa, khi unlist phải thêm lại, phức tạp hơn)
            // sellerData.garage.cars.splice(carIndex, 1);
          } else if (itemTypeToSell === "part_instance") {
            if (!mongoose.Types.ObjectId.isValid(idToSell))
              throw new Error("ID Phụ tùng không hợp lệ.");
            if (quantityToSell === null || quantityToSell === undefined)
              quantityToSell = 1; // Mặc định bán 1 nếu là phụ tùng
            if (quantityToSell > 1)
              throw new Error("Hiện tại chỉ hỗ trợ bán lẻ từng phụ tùng."); // Giới hạn

            const partIndex = sellerData.garage.parts.findIndex(
              (p) => p._id.toString() === idToSell,
            );
            if (partIndex === -1)
              throw new Error("Không tìm thấy phụ tùng này trong kho của bạn.");

            const partInstance = sellerData.garage.parts[partIndex];
            if (partInstance.isListedOnMarket)
              throw new Error("Phụ tùng này đã được đăng bán.");
            if (partInstance.installedOnCar)
              throw new Error(
                "Phụ tùng này đang được lắp trên xe, vui lòng tháo ra trước khi bán.",
              );

            const partDef = await PartDefinition.findOne({
              partId: partInstance.partDefinitionId,
            }).lean();
            if (!partDef)
              throw new Error("Không tìm thấy định nghĩa phụ tùng.");

            itemNameDisplay = partDef.name;
            actualItemId = partInstance._id.toString();
            itemSnapshot = {
              type: "part",
              partDefinitionId: partInstance.partDefinitionId,
              name: partDef.name,
              rarity: partDef.rarity,
              partType: partDef.partType,
              statModifiers: partDef.statModifiers,
              imageUrl: partDef.imageUrl,
            };

            // Đánh dấu phụ tùng đang được bán
            sellerData.garage.parts[partIndex].isListedOnMarket = true;
            sellerData.garage.parts[partIndex].marketListingId = null; // Sẽ cập nhật sau
            sellerData.markModified("garage.parts");
          } else {
            throw new Error("Loại vật phẩm không hợp lệ.");
          }

          // Tạo tin đăng mới
          const newListing = new MarketListing({
            guildId,
            sellerId,
            sellerUsername: interaction.user.username,
            itemType: itemTypeToSell,
            itemId: actualItemId,
            itemName: itemNameDisplay,
            quantity: quantityToSell,
            price: finalPrice, // Đây là giá mỗi đơn vị cho item/part, hoặc tổng giá cho xe
            status: "active",
            itemSnapshot,
          });
          await newListing.save({ sellSession });

          // Nếu là xe hoặc phụ tùng, cập nhật marketListingId cho instance đó
          if (itemTypeToSell === "car_instance") {
            const carIdx = sellerData.garage.cars.findIndex(
              (c) => c._id.toString() === actualItemId,
            );
            if (carIdx !== -1)
              sellerData.garage.cars[carIdx].marketListingId = newListing._id;
          } else if (itemTypeToSell === "part_instance") {
            const partIdx = sellerData.garage.parts.findIndex(
              (p) => p._id.toString() === actualItemId,
            );
            if (partIdx !== -1)
              sellerData.garage.parts[partIdx].marketListingId = newListing._id;
          }

          await sellerData.save({ sellSession }); // Lưu lại User sau khi đã cập nhật inventory/garage
          await sellSession.commitTransaction();

          const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ Đăng bán thành công!")
            .setDescription(
              `Bạn đã đăng bán **${quantityToSell} ${itemNameDisplay}** lên chợ với giá **${finalPrice.toLocaleString()} VNĐ** ${itemTypeToSell === "car_instance" ? "(tổng giá)" : "(mỗi cái)"}.`,
            )
            .addFields({
              name: "🔎 ID Tin đăng",
              value: `\`${newListing._id}\``,
            });
          if (itemTypeToSell === "shop_item") {
            embed.addFields({
              name: "📦 Số lượng còn lại trong túi",
              value: `${sellerData.inventory.get(actualItemId) || 0}`,
            });
          }

          embed.setTimestamp().setFooter({
            text: `Người bán: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          });

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          await sellSession.abortTransaction();
          Logger.error(
            `Lỗi lệnh /market-sell bởi ${interaction.user.tag} (ID: ${sellerId}) cho id ${idToSell} (type ${itemTypeToSell}): ${error.message}`,
            { stack: error.stack },
          );
          await interaction.editReply({
            content: `❌ Đã xảy ra lỗi khi đăng bán: ${error.message}`,
          });
        } finally {
          await sellSession.endSession();
        }
      } else if (subcommand === "buy") {
        await interaction.deferReply({ ephemeral: false }); // Buy có thể public kết quả
        const buyerId = interaction.user.id;
        const guildId = interaction.guild.id;
        const listingIdString = interaction.options.getString("listing_id");
        let quantityToBuyOption = interaction.options.getInteger("quantity");

        if (!mongoose.Types.ObjectId.isValid(listingIdString)) {
          return interaction.reply({
            content: "❌ ID tin đăng không hợp lệ.",
            ephemeral: true,
          });
        }
        const listingId = new mongoose.Types.ObjectId(listingIdString);
        const buySession = await mongoose.startSession();
        buySession.startTransaction();

        let boughtItemNameDisplay = "Vật phẩm không xác định";
        let actualBoughtQuantity = 0;
        let finalTotalPrice = 0;
        let sellerIdForDM = null;
        let marketNotiChannelId = null;

        try {
          const listing =
            await MarketListing.findById(listingId).session(buySession);

          if (!listing) throw new Error("Tin đăng không tồn tại.");
          if (listing.guildId !== guildId)
            throw new Error("Tin đăng này không thuộc server hiện tại.");
          if (listing.status !== "active")
            throw new Error(
              `Tin đăng này không còn hoạt động (trạng thái: ${listing.status}).`,
            );
          if (listing.sellerId === buyerId)
            throw new Error("Bạn không thể tự mua vật phẩm của chính mình.");

          const buyerData = await User.findOne({
            userId: buyerId,
            guildId,
          }).session(buySession);
          if (!buyerData)
            throw new Error(
              "Không tìm thấy dữ liệu người mua. Hãy thử tương tác với bot để tạo tài khoản.",
            );

          const sellerData = await User.findOne({
            userId: listing.sellerId,
            guildId,
          }).session(buySession);
          if (!sellerData) {
            listing.status = "cancelled"; // Hủy tin đăng nếu người bán không tồn tại
            await listing.save({ buySession });
            throw new Error(
              "Không tìm thấy dữ liệu người bán. Tin đăng có thể đã bị lỗi và sẽ được hủy.",
            );
          }

          sellerIdForDM = listing.sellerId; // Lưu để gửi DM sau
          boughtItemNameDisplay = listing.itemName; // Lấy từ listing luôn cho thống nhất

          // Xử lý mua theo itemType
          if (listing.itemType === "shop_item") {
            actualBoughtQuantity =
              quantityToBuyOption === null || quantityToBuyOption === undefined
                ? listing.quantity
                : quantityToBuyOption;
            if (actualBoughtQuantity <= 0)
              throw new Error("Số lượng mua phải lớn hơn 0.");
            if (listing.quantity < actualBoughtQuantity) {
              throw new Error(
                `Số lượng vật phẩm \`${listing.itemName}\` trên chợ không đủ. Chỉ còn ${listing.quantity}.`,
              );
            }
            finalTotalPrice = listing.price * actualBoughtQuantity;

            if (buyerData.balance < finalTotalPrice) {
              throw new Error(
                `Bạn không đủ tiền. Cần **${finalTotalPrice.toLocaleString()} VNĐ**, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`,
              );
            }

            // Cập nhật inventory người mua
            const buyerCurrentItemQty =
              buyerData.inventory.get(listing.itemId) || 0;
            buyerData.inventory.set(
              listing.itemId,
              buyerCurrentItemQty + actualBoughtQuantity,
            );
            buyerData.markModified("inventory");
          } else if (listing.itemType === "car_instance") {
            actualBoughtQuantity = 1; // Xe luôn là 1
            finalTotalPrice = listing.price; // price của listing xe là tổng giá

            if (buyerData.balance < finalTotalPrice) {
              throw new Error(
                `Bạn không đủ tiền. Cần **${finalTotalPrice.toLocaleString()} VNĐ** để mua xe này, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`,
              );
            }

            // Xóa CarInstance khỏi garage người bán
            const carIndexInSellerGarage = sellerData.garage.cars.findIndex(
              (c) => c._id.toString() === listing.itemId,
            ); // listing.itemId là _id của CarInstance
            if (carIndexInSellerGarage === -1) {
              listing.status = "cancelled"; // Nếu xe không còn trong garage người bán, hủy listing
              await listing.save({ buySession });
              throw new Error(
                "Xe này không còn tồn tại trong garage của người bán. Tin đăng sẽ được hủy.",
              );
            }
            const carInstanceSoldBySeller =
              sellerData.garage.cars[carIndexInSellerGarage];

            // Tạo CarInstance mới cho người mua
            const newCarForBuyer = {
              carModelId: listing.itemSnapshot.modelId,
              cosmetics: listing.itemSnapshot.cosmetics || {
                color: "#FFFFFF",
                licensePlate: null,
              }, // Lấy từ snapshot
              acquiredAt: new Date(),
              isDisplayed: false, // Mặc định không trưng bày
              installedParts: new Map(), // Khởi tạo map rỗng
              // raceHistory, lastMaintenance có thể để default
            };
            buyerData.garage.cars.push(newCarForBuyer);
            // `_id` cho newCarForBuyer sẽ tự được Mongoose tạo khi push và save.
            // Chúng ta cần lấy _id của chiếc xe vừa được tạo cho người mua để gán vào phụ tùng.
            // Điều này sẽ được thực hiện sau khi buyerData.save() lần đầu hoặc lấy _id của phần tử cuối cùng sau khi push.

            // Xử lý chuyển giao phụ tùng từ snapshot
            const partsToTransferToBuyer = [];
            if (
              listing.itemSnapshot.installedParts &&
              listing.itemSnapshot.installedParts.length > 0
            ) {
              for (const partSnap of listing.itemSnapshot.installedParts) {
                // Tìm PartInstance gốc trong kho của người bán để "xóa"
                const partInstanceIndexInSeller =
                  sellerData.garage.parts.findIndex(
                    (p) =>
                      p.partDefinitionId === partSnap.partDefinitionId && // Giả sử partDefinitionId là đủ để định danh (cần cẩn thận nếu có nhiều instance cùng defId)
                      carInstanceSoldBySeller.installedParts
                        .get(partSnap.slot)
                        ?.toString() === p._id.toString(), // Đảm bảo đó là part đang lắp trên xe bị bán
                  );

                if (partInstanceIndexInSeller !== -1) {
                  // Xóa PartInstance này khỏi kho người bán
                  sellerData.garage.parts.splice(partInstanceIndexInSeller, 1);
                } else {
                  Logger.warn(
                    `[Market-Buy Car] PartInstance (DefID: ${partSnap.partDefinitionId}, Slot: ${partSnap.slot}) for sold car ${listing.itemId} not found in seller's ${sellerData.userId} parts. It might have been double-listed or an issue with snapshot.`,
                  );
                  // Có thể bỏ qua phụ tùng này hoặc báo lỗi tùy logic
                }

                // Tạo PartInstance mới cho người mua
                const newPartForBuyer = {
                  partDefinitionId: partSnap.partDefinitionId,
                  acquiredAt: new Date(),
                  // installedOnCar sẽ được gán sau khi có _id của newCarForBuyer
                };
                partsToTransferToBuyer.push({
                  slot: partSnap.slot,
                  partData: newPartForBuyer,
                });
              }
            }
            sellerData.garage.cars.splice(carIndexInSellerGarage, 1); // Xóa xe khỏi người bán
            sellerData.markModified("garage.cars");
            sellerData.markModified("garage.parts"); // Vì đã xóa parts khỏi người bán

            // Lưu buyerData để newCarForBuyer có _id
            await buyerData.save({ buySession }); // Lưu trước để xe mới có _id
            const newlyAddedCarInstance =
              buyerData.garage.cars[buyerData.garage.cars.length - 1];

            for (const { slot, partData } of partsToTransferToBuyer) {
              partData.installedOnCar = newlyAddedCarInstance._id; // Gán ID xe mới của người mua
              buyerData.garage.parts.push(partData);
              // Lấy _id của part vừa push vào
              const newlyAddedPartInstance =
                buyerData.garage.parts[buyerData.garage.parts.length - 1];
              newlyAddedCarInstance.installedParts.set(
                slot,
                newlyAddedPartInstance._id,
              );
            }
            buyerData.markModified("garage.cars");
            buyerData.markModified("garage.parts");
          } else if (listing.itemType === "part_instance") {
            actualBoughtQuantity = 1; // Phụ tùng bán lẻ từng instance
            if (
              quantityToBuyOption !== null &&
              quantityToBuyOption !== undefined &&
              quantityToBuyOption !== 1
            ) {
              throw new Error(
                "Khi mua phụ tùng từ chợ, bạn chỉ có thể mua từng chiếc một (số lượng là 1).",
              );
            }
            finalTotalPrice = listing.price; // price của listing phụ tùng là giá cho chiếc đó

            if (buyerData.balance < finalTotalPrice) {
              throw new Error(
                `Bạn không đủ tiền. Cần **${finalTotalPrice.toLocaleString()} VNĐ**, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`,
              );
            }

            // Xóa PartInstance khỏi kho người bán
            const partIndexInSellerGarage = sellerData.garage.parts.findIndex(
              (p) => p._id.toString() === listing.itemId,
            );
            if (partIndexInSellerGarage === -1) {
              listing.status = "cancelled";
              await listing.save({ buySession });
              throw new Error(
                "Phụ tùng này không còn tồn tại trong kho của người bán. Tin đăng sẽ được hủy.",
              );
            }
            sellerData.garage.parts.splice(partIndexInSellerGarage, 1);
            sellerData.markModified("garage.parts");

            // Tạo PartInstance mới cho người mua
            const newPartForBuyer = {
              partDefinitionId: listing.itemSnapshot.partDefinitionId, // Lấy từ snapshot
              acquiredAt: new Date(),
              installedOnCar: null, // Mua về kho thì chưa lắp
              // Các trường khác nếu có trong PartInstanceSchema sẽ lấy default
            };
            buyerData.garage.parts.push(newPartForBuyer);
            buyerData.markModified("garage.parts");
          } else {
            throw new Error("Loại vật phẩm không xác định trên chợ.");
          }

          // --- Thực hiện giao dịch tiền tệ và thuế ---
          buyerData.balance -= finalTotalPrice;
          buyerData.totalSpent = (buyerData.totalSpent || 0) + finalTotalPrice;

          const marketTaxRate = 0.07; // 7%
          const taxAmount = Math.floor(finalTotalPrice * marketTaxRate);
          const amountToSeller = finalTotalPrice - taxAmount;

          sellerData.balance += amountToSeller;
          sellerData.totalEarned =
            (sellerData.totalEarned || 0) + amountToSeller;

          if (taxAmount > 0) {
            const botUserId = interaction.client.user.id;
            await User.findOneAndUpdate(
              { userId: botUserId, guildId: guildId },
              { $inc: { balance: taxAmount, totalEarned: taxAmount } },
              { upsert: true, new: true, session: buySession },
            );
          }

          // Cập nhật listing (nếu là shop_item và còn hàng) hoặc xóa
          if (listing.itemType === "shop_item") {
            listing.quantity -= actualBoughtQuantity;
            if (listing.quantity <= 0) {
              await MarketListing.deleteOne({ _id: listing._id }).session(
                buySession,
              );
            } else {
              await listing.save({ buySession });
            }
          } else {
            // Với car_instance và part_instance, sau khi bán là xóa listing
            await MarketListing.deleteOne({ _id: listing._id }).session(
              buySession,
            );
          }

          await buyerData.save({ buySession });
          await sellerData.save({ buySession });

          // Ghi log giao dịch
          const transactionRecord = new MarketTransaction({
            guildId: guildId,
            listingId: listing._id, // ID tin đăng gốc
            itemType: listing.itemType, // Thêm itemType
            itemId: listing.itemId, // ID của shop_item, CarInstance hoặc PartInstance GỐC của người bán
            itemName: boughtItemNameDisplay,
            quantity: actualBoughtQuantity,
            pricePerItem:
              listing.itemType === "shop_item" ||
              listing.itemType === "part_instance"
                ? listing.price
                : finalTotalPrice, // Giá mỗi đơn vị hoặc tổng giá xe
            totalPrice: finalTotalPrice,
            taxAmount: taxAmount,
            buyerId: buyerId,
            buyerUsername: interaction.user.username,
            sellerId: listing.sellerId,
            sellerUsername: sellerData.username || listing.sellerUsername,
          });
          await transactionRecord.save({ buySession });

          await buySession.commitTransaction();

          // Thông báo thành công
          const successEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("🛒 Mua Hàng Thành Công!")
            .setDescription(
              `Bạn đã mua thành công **${actualBoughtQuantity} ${boughtItemNameDisplay}** từ người bán **${listing.sellerUsername}**.`,
            )
            .addFields(
              {
                name: "💸 Tổng chi phí",
                value: `${finalTotalPrice.toLocaleString()} VNĐ`,
              },
              {
                name: "💰 Tiền người bán nhận (sau thuế 7%)",
                value: `${amountToSeller.toLocaleString()} VNĐ`,
              },
              { name: "🧾 ID Tin đăng (cũ)", value: `\`${listingIdString}\`` },
            )
            .setTimestamp()
            .setFooter({
              text: `Người mua: ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            });

          await interaction.editReply({ embeds: [successEmbed] });

          // Gửi DM cho người bán
          if (sellerIdForDM) {
            try {
              const sellerUserObj =
                await interaction.client.users.fetch(sellerIdForDM);
              if (sellerUserObj) {
                const dmEmbed = new EmbedBuilder()
                  .setColor("Blue")
                  .setTitle("🔔 Thông Báo Chợ: Vật Phẩm/Xe Đã Bán!")
                  .setDescription(`Món hàng của bạn đã được bán trên chợ.`)
                  .addFields(
                    {
                      name: "🛍️ Vật phẩm/Xe",
                      value: `${actualBoughtQuantity} ${boughtItemNameDisplay}`,
                    },
                    {
                      name: "👤 Người mua",
                      value: `${interaction.user.tag} (\`${buyerId}\`)`,
                    },
                    {
                      name: "💰 Số tiền bạn nhận (sau thuế 7%)",
                      value: `${amountToSeller.toLocaleString()} VNĐ`,
                    },
                  )
                  .setTimestamp()
                  .setFooter({ text: `Server: ${interaction.guild.name}` });
                await sellerUserObj
                  .send({ embeds: [dmEmbed] })
                  .catch((dmErr) =>
                    Logger.warn(
                      `Could not DM seller ${sellerIdForDM}: ${dmErr.message}`,
                    ),
                  );
              }
            } catch (dmError) {
              Logger.warn(
                `[Market-Buy] Không thể gửi DM cho người bán ${sellerIdForDM}: ${dmError.message}`,
              );
            }
          }

          // Gửi thông báo ra kênh chung (nếu có)
          const guildConfig = await GuildConfig.findOne({
            guildId: interaction.guild.id,
          }); // Query ngoài session nếu cần
          if (guildConfig && guildConfig.marketNotificationChannelId) {
            marketNotiChannelId = guildConfig.marketNotificationChannelId;
          }
        } catch (error) {
          await buySession.abortTransaction();
          Logger.error(
            `Lỗi lệnh /market-buy (Listing: ${listingIdString}, Buyer: ${buyerId}): ${error.message}`,
            { stack: error.stack },
          );
          await interaction.editReply({
            content: `❌ Lỗi khi mua: ${error.message}`,
          });
        } finally {
          await buySession.endSession();
        }

        // Gửi thông báo vào kênh market-notification sau khi transaction đã kết thúc
        if (marketNotiChannelId && finalTotalPrice > 0) {
          // Chỉ gửi nếu giao dịch thành công
          try {
            const channel = await interaction.client.channels
              .fetch(marketNotiChannelId)
              .catch(() => null);
            if (channel && channel.isTextBased()) {
              const marketNotiEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle("📈 Giao Dịch Chợ Mới")
                .addFields(
                  {
                    name: "🛍️ Vật phẩm/Xe",
                    value: `${actualBoughtQuantity} ${boughtItemNameDisplay}`,
                  },
                  { name: "👤 Người mua", value: `${interaction.user.tag}` },
                  {
                    name: "💰 Người bán",
                    value: `${(await User.findOne({ userId: sellerIdForDM }))?.username || sellerIdForDM}`,
                  }, // Lấy username mới nhất
                  {
                    name: "💸 Giá trị giao dịch",
                    value: `${finalTotalPrice.toLocaleString()} VNĐ`,
                  },
                )
                .setTimestamp()
                .setFooter({
                  text: `Server: ${interaction.guild.name}`,
                  iconURL: interaction.guild.iconURL(),
                });
              await channel.send({ embeds: [marketNotiEmbed] });
            }
          } catch (e) {
            Logger.warn(
              `Error sending market notification to channel ${marketNotiChannelId}: ${e.message}`,
            );
          }
        }
      } else if (subcommand === "unlist") {
        await interaction.deferReply({ ephemeral: false });
        const unlistIdString = interaction.options.getString("listing_id");

        if (!mongoose.Types.ObjectId.isValid(unlistIdString)) {
          return interaction.reply({
            content: "❌ ID tin đăng không hợp lệ.",
            ephemeral: true,
          });
        }
        const listingId = new mongoose.Types.ObjectId(unlistIdString);
        const unlistSession = await mongoose.startSession();
        unlistSession.startTransaction();

        let unlistedItemName = "Vật phẩm/Xe/Phụ tùng";
        let unlistedQuantity = 0;

        try {
          const listing =
            await MarketListing.findById(listingId).session(unlistSession);

          if (!listing) throw new Error("Tin đăng không tồn tại.");
          if (listing.guildId !== guildId)
            throw new Error("Tin đăng này không thuộc server hiện tại.");
          if (listing.sellerId !== userId)
            throw new Error("Bạn không phải là người đăng tin này.");
          if (listing.status !== "active") {
            throw new Error(
              `Tin đăng này không ở trạng thái "active" (trạng thái hiện tại: ${listing.status}), không thể hủy.`,
            );
          }

          const userData = await User.findOne({ userId, guildId }).session(
            unlistSession,
          );
          if (!userData)
            throw new Error("Không tìm thấy dữ liệu người dùng của bạn.");

          unlistedItemName = listing.itemName; // Lấy tên từ listing
          unlistedQuantity = listing.quantity;

          if (listing.itemType === "shop_item") {
            // Hoàn trả vật phẩm (shop_item) vào inventory
            const currentItemQtyInInventory =
              userData.inventory.get(listing.itemId) || 0;
            userData.inventory.set(
              listing.itemId,
              currentItemQtyInInventory + listing.quantity,
            );
            userData.markModified("inventory");
            Logger.info(
              `[Market-Unlist] ShopItem ${listing.itemId} (x${listing.quantity}) returned to inventory for user ${userId}.`,
            );
          } else if (listing.itemType === "car_instance") {
            // Tìm CarInstance trong garage của người dùng và cập nhật trạng thái
            const carIndex = userData.garage.cars.findIndex(
              (c) => c._id.toString() === listing.itemId,
            ); // listing.itemId là _id của CarInstance
            if (carIndex !== -1) {
              if (
                userData.garage.cars[carIndex].marketListingId &&
                userData.garage.cars[carIndex].marketListingId.equals(
                  listing._id,
                )
              ) {
                userData.garage.cars[carIndex].isListedOnMarket = false;
                userData.garage.cars[carIndex].marketListingId = null;
                userData.markModified("garage.cars");
                Logger.info(
                  `[Market-Unlist] CarInstance ${listing.itemId} unlisted for user ${userId}.`,
                );
              } else {
                // Trường hợp này không nên xảy ra nếu logic market-sell đúng
                Logger.warn(
                  `[Market-Unlist] CarInstance ${listing.itemId} found but marketListingId does not match or not set for user ${userId}. ListingId: ${listing._id}, Car's ListingId: ${userData.garage.cars[carIndex].marketListingId}`,
                );
                // Vẫn có thể cho hủy listing, nhưng cần log lại để kiểm tra
              }
            } else {
              // Nếu xe không còn trong garage (đã bị xóa bằng cách nào đó trong khi đang list)
              // Chỉ xóa listing, không thể hoàn trả xe
              Logger.warn(
                `[Market-Unlist] CarInstance ${listing.itemId} not found in user's ${userId} garage while trying to unlist. Listing will be removed.`,
              );
              // Không throw error ở đây để listing vẫn được xóa
            }
          } else if (listing.itemType === "part_instance") {
            // Tìm PartInstance trong kho của người dùng và cập nhật trạng thái
            const partIndex = userData.garage.parts.findIndex(
              (p) => p._id.toString() === listing.itemId,
            ); // listing.itemId là _id của PartInstance
            if (partIndex !== -1) {
              if (
                userData.garage.parts[partIndex].marketListingId &&
                userData.garage.parts[partIndex].marketListingId.equals(
                  listing._id,
                )
              ) {
                userData.garage.parts[partIndex].isListedOnMarket = false;
                userData.garage.parts[partIndex].marketListingId = null;
                userData.markModified("garage.parts");
                Logger.info(
                  `[Market-Unlist] PartInstance ${listing.itemId} unlisted for user ${userId}.`,
                );
              } else {
                Logger.warn(
                  `[Market-Unlist] PartInstance ${listing.itemId} found but marketListingId does not match or not set for user ${userId}. ListingId: ${listing._id}, Part's ListingId: ${userData.garage.parts[partIndex].marketListingId}`,
                );
              }
            } else {
              Logger.warn(
                `[Market-Unlist] PartInstance ${listing.itemId} not found in user's ${userId} warehouse while trying to unlist. Listing will be removed.`,
              );
            }
          }

          await userData.save({ unlistSession });

          // Xóa tin đăng khỏi chợ
          await MarketListing.deleteOne({ _id: listing._id }).session(
            unlistSession,
          );
          // Hoặc cập nhật status:
          // listing.status = 'cancelled';
          // await listing.save({ session });

          await unlistSession.commitTransaction();

          const successEmbed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle("🗑️ Hủy Tin Đăng Thành Công!")
            .setDescription(
              `Bạn đã hủy thành công tin đăng bán **${unlistedQuantity} ${unlistedItemName}**.`,
            )
            .addFields(
              {
                name: "📦 Vật phẩm/Xe/Phụ tùng đã hoàn trả",
                value: `${unlistedQuantity} ${unlistedItemName} đã được trả lại vào kho/garage của bạn (nếu còn tồn tại).`,
              },
              { name: "🧾 ID Tin đăng đã hủy", value: `\`${unlistIdString}\`` },
            )
            .setTimestamp()
            .setFooter({
              text: `Yêu cầu bởi: ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            });

          await interaction.editReply({ embeds: [successEmbed] });
          Logger.info(
            `[Market-Unlist] User ${userId} successfully unlisted ${listing.itemType} ID: ${listing.itemId} (Listing: ${unlistIdString}).`,
          );
        } catch (error) {
          await unlistSession.abortTransaction();
          Logger.error(
            `Lỗi lệnh /market-unlist (Listing: ${unlistIdString}, User: ${userId}): ${error.message}`,
            { stack: error.stack },
          );
          await interaction.editReply({
            content: `❌ Lỗi khi hủy tin đăng: ${error.message}`,
          });
        } finally {
          await unlistSession.endSession();
        }
      } else if (subcommand === "mylistings") {
        await interaction.deferReply({ ephemeral: false }); // Có thể để false
        let requestedMyListPage = interaction.options.getInteger("page") || 1;

        const generateMyListingsEmbedAndButtons = async (page) => {
          const mongoQuery = {
            sellerId: userId, // Lọc theo người bán là chính mình
            guildId: guildId,
            status: "active", // Chỉ hiển thị tin đang hoạt động
          };

          const listingsCount = await MarketListing.countDocuments(mongoQuery);
          const totalPages =
            Math.ceil(listingsCount / ITEMS_PER_PAGE_MARKET) || 1;

          if (page > totalPages) page = totalPages;
          if (page < 1) page = 1;

          const skip = (page - 1) * ITEMS_PER_PAGE_MARKET;

          const listings = await MarketListing.find(mongoQuery)
            .sort({ listedAt: -1 }) // Sắp xếp mới nhất lên đầu
            .skip(skip)
            .limit(ITEMS_PER_PAGE_MARKET)
            .lean();

          const embed = new EmbedBuilder()
            .setTitle(
              `📰 Tin đăng đang bán của bạn - Trang ${page}/${totalPages}`,
            )
            .setColor("#F1C40F") // Màu vàng
            .setTimestamp()
            .setFooter({
              text: `Người dùng: ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            });

          if (!listings.length) {
            embed.setDescription(
              "Bạn không có tin đăng nào đang hoạt động trên chợ.",
            );
            // Không cần nút nếu không có trang nào
            const components =
              listingsCount > 0
                ? [
                    generatePaginationButtons(
                      page,
                      totalPages,
                      "market_mylistings_",
                    ),
                  ]
                : [];
            return {
              embeds: [embed],
              components,
              currentPage: page,
              totalPages,
            };
          }

          listings.forEach((listing) => {
            embed.addFields({
              // Hiển thị rõ ID để người dùng dễ dàng copy và dùng lệnh /market-unlist
              name: `${listing.itemSnapshot?.name || listing.itemName} (x${listing.quantity})`,
              value: `Giá: **${listing.price.toLocaleString()} VNĐ / cái**\nĐăng lúc: <t:${Math.floor(listing.listedAt.getTime() / 1000)}:R>\nID: \`${listing._id}\``,
              inline: false,
            });
          });

          const components = [
            generatePaginationButtons(page, totalPages, "market_mylistings_"),
          ];

          return { embeds: [embed], components, currentPage: page, totalPages };
        };

        const generatePaginationButtons = (currentPage, totalPages, prefix) => {
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`${prefix}prev_${currentPage}`)
              .setLabel("◀️ Trước")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId(`${prefix}next_${currentPage}`)
              .setLabel("Sau ▶️")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage >= totalPages), // >= vì page bắt đầu từ 1
          );
        };

        // Hiển thị lần đầu
        const initialData =
          await generateMyListingsEmbedAndButtons(requestedMyListPage);
        const message = await interaction.editReply(initialData);

        // Chỉ tạo collector nếu có nhiều hơn 1 trang
        if (initialData.totalPages <= 1) return;

        // Collector cho các nút phân trang
        const filter = (i) =>
          i.user.id === interaction.user.id &&
          i.customId.startsWith("market_mylistings_");
        const collector = message.createMessageComponentCollector({
          filter,
          time: 5 * 60 * 1000,
        }); // 5 phút

        let currentCollectorPage = initialData.currentPage;

        collector.on("collect", async (i) => {
          if (!i.isButton()) return;
          await i.deferUpdate(); // Xác nhận tương tác mà không gửi phản hồi mới

          const action = i.customId.split("_")[3]; // Lấy 'prev' hoặc 'next'

          if (action === "prev") {
            currentCollectorPage--;
          } else if (action === "next") {
            currentCollectorPage++;
          }

          // Đảm bảo trang không đi ra ngoài giới hạn trong collector
          if (currentCollectorPage < 1) currentCollectorPage = 1;
          // totalPages được lấy từ initialData vì nó không thay đổi trong lúc xem
          if (currentCollectorPage > initialData.totalPages)
            currentCollectorPage = initialData.totalPages;

          const newData =
            await generateMyListingsEmbedAndButtons(currentCollectorPage);
          await i.editReply(newData); // Cập nhật tin nhắn với trang mới
        });

        collector.on("end", async (collected, reason) => {
          if (reason !== "messageDelete") {
            const finalData =
              await generateMyListingsEmbedAndButtons(currentCollectorPage); // Lấy lại embed trang cuối cùng
            const disabledComponents = finalData.components.map((row) => {
              row.components.forEach((button) => button.setDisabled(true));
              return row;
            });
            try {
              await message.edit({ components: disabledComponents });
            } catch (error) {
              // Logger.warn(`Could not edit my listings message on collector end: ${error.message}`);
            }
          }
        });
      } else if (subcommand === "history") {
        await interaction.deferReply({ ephemeral: true }); // History nên ephemeral
        let requestedHistoryPage = interaction.options.getInteger("page") || 1;

        const generateHistoryEmbedAndButtons = async (page) => {
          const mongoQuery = {
            guildId: guildId,
            $or: [
              // Tìm các giao dịch mà người dùng là người mua HOẶC người bán
              { buyerId: userId },
              { sellerId: userId },
            ],
          };

          const transactionsCount =
            await MarketTransaction.countDocuments(mongoQuery);
          const totalPages =
            Math.ceil(transactionsCount / TRANSACTIONS_PER_PAGE_HISTORY) || 1;

          if (page > totalPages) page = totalPages;
          if (page < 1) page = 1;

          const skip = (page - 1) * TRANSACTIONS_PER_PAGE_HISTORY;

          const transactions = await MarketTransaction.find(mongoQuery)
            .sort({ transactionTime: -1 }) // Sắp xếp mới nhất lên đầu
            .skip(skip)
            .limit(TRANSACTIONS_PER_PAGE_HISTORY)
            .lean();

          const embed = new EmbedBuilder()
            .setTitle(
              `📜 Lịch sử giao dịch chợ của bạn - Trang ${page}/${totalPages}`,
            )
            .setColor("#3498DB") // Màu xanh dương
            .setTimestamp()
            .setFooter({
              text: `Người dùng: ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            });

          if (!transactions.length) {
            embed.setDescription("Bạn chưa có lịch sử giao dịch nào trên chợ.");
            const components =
              transactionsCount > 0
                ? [
                    generatePaginationButtons(
                      page,
                      totalPages,
                      "market_history_",
                    ),
                  ]
                : [];
            return {
              embeds: [embed],
              components,
              currentPage: page,
              totalPages,
            };
          }

          let description = "";
          transactions.forEach((tx) => {
            const time = `<t:${Math.floor(tx.transactionTime.getTime() / 1000)}:R>`;
            if (tx.buyerId === userId) {
              // Người dùng là người mua
              description += `🔹 **[MUA]** ${tx.quantity} **${tx.itemName}** từ \`${tx.sellerUsername || tx.sellerId}\` - Giá: ${tx.totalPrice.toLocaleString()} VNĐ (${time})\n`;
            } else {
              // Người dùng là người bán
              const netEarn = tx.totalPrice - tx.taxAmount;
              description += `🔸 **[BÁN]** ${tx.quantity} **${tx.itemName}** cho \`${tx.buyerUsername || tx.buyerId}\` - Nhận: ${netEarn.toLocaleString()} VNĐ (${time})\n`;
            }
          });
          embed.setDescription(description);

          const components = [
            generatePaginationButtons(page, totalPages, "market_history_"),
          ];

          return { embeds: [embed], components, currentPage: page, totalPages };
        };

        const generatePaginationButtons = (currentPage, totalPages, prefix) => {
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`${prefix}prev_${currentPage}`)
              .setLabel("◀️ Trước")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId(`${prefix}next_${currentPage}`)
              .setLabel("Sau ▶️")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage >= totalPages),
          );
        };

        // Hiển thị lần đầu
        const initialData =
          await generateHistoryEmbedAndButtons(requestedHistoryPage);
        const message = await interaction.editReply(initialData);

        // Chỉ tạo collector nếu có nhiều hơn 1 trang
        if (initialData.totalPages <= 1) return;

        // Collector cho các nút phân trang
        const filter = (i) =>
          i.user.id === interaction.user.id &&
          i.customId.startsWith("market_history_");
        const collector = message.createMessageComponentCollector({
          filter,
          time: 5 * 60 * 1000,
        });

        let currentCollectorPage = initialData.currentPage;

        collector.on("collect", async (i) => {
          if (!i.isButton()) return;
          await i.deferUpdate();
          const action = i.customId.split("_")[3];

          if (action === "prev") {
            currentCollectorPage--;
          } else if (action === "next") {
            currentCollectorPage++;
          }

          if (currentCollectorPage < 1) currentCollectorPage = 1;
          if (currentCollectorPage > initialData.totalPages)
            currentCollectorPage = initialData.totalPages;

          const newData =
            await generateHistoryEmbedAndButtons(currentCollectorPage);
          await i.editReply(newData);
        });

        collector.on("end", async (collected, reason) => {
          if (reason !== "messageDelete") {
            const finalData =
              await generateHistoryEmbedAndButtons(currentCollectorPage);
            const disabledComponents = finalData.components.map((row) => {
              row.components.forEach((button) => button.setDisabled(true));
              return row;
            });
            try {
              // Chỉ edit nếu message còn tồn tại
              if (message)
                await message
                  .edit({ components: disabledComponents })
                  .catch(() => {});
            } catch (error) {
              // Logger.warn(`Could not edit history message on collector end: ${error.message}`);
            }
          }
        });
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /market ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      // Tránh defer rồi lại reply gây lỗi "already replied"
      const errorMessageContent = "❌ Đã xảy ra lỗi khi xử lý lệnh Chợ.";
      if (!interaction.deferred && !interaction.replied) {
        await interaction
          .reply({ content: errorMessageContent, ephemeral: true })
          .catch((e) => Logger.error("Error in initial reply for market:", e));
      } else if (interaction.deferred && !interaction.replied) {
        await interaction
          .editReply({
            content: errorMessageContent,
            embeds: [],
            components: [],
          })
          .catch((e) => Logger.error("Error in editReply for market:", e));
      } else {
        // Đã replied hoặc followUp rồi
        // Không làm gì thêm hoặc chỉ log
      }
    }
  },
};
