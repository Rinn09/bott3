const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const ShopItem = require("../../models/ShopItem");
const CarModel = require("../../models/CarModel");
const PartDefinition = require("../../models/PartDefinition");
const MarketListing = require("../../models/MarketListing");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market-sell")
    .setDescription("Đăng bán vật phẩm, xe, hoặc phụ tùng của bạn lên chợ.")
    .addStringOption((option) =>
      option
        .setName("instance_id_or_itemid")
        .setDescription(
          "ID của Xe/Phụ tùng từ Garage/Warehouse, hoặc ItemID từ Inventory",
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Loại bạn muốn bán")
        .setRequired(true)
        .addChoices(
          { name: "Vật phẩm từ Túi đồ (Inventory)", value: "shop_item" },
          { name: "Xe từ Garage", value: "car_instance" },
          { name: "Phụ tùng từ Kho (Warehouse)", value: "part_instance" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("price_per_item_or_total") // Đổi tên cho rõ nghĩa
        .setDescription(
          "Giá cho MỖI đơn vị (vật phẩm/phụ tùng), hoặc TỔNG giá (cho xe)",
        )
        .setRequired(true)
        .setMinValue(0),
    )
    .addIntegerOption(
      (option) =>
        option
          .setName("quantity")
          .setDescription("Số lượng (xe luôn là 1, bỏ qua nếu bán xe)")
          .setMinValue(1)
          .setRequired(false), // Để false, xử lý mặc định sau
    ),

  async execute(interaction) {
    const sellerId = interaction.user.id;
    const guildId = interaction.guild.id;
    const idToSell = interaction.options.getString("instance_id_or_itemid");
    const itemTypeToSell = interaction.options.getString("type");
    let quantityToSell = interaction.options.getInteger("quantity");
    const priceInput = interaction.options.getInteger(
      "price_per_item_or_total",
    );

    const MAX_LISTINGS_PER_USER = 10;
    const currentListingsCount = await MarketListing.countDocuments({
      sellerId,
      guildId,
      status: "active",
    });
    if (currentListingsCount >= MAX_LISTINGS_PER_USER) {
      return interaction.reply({
        content: `❌ Bạn đã đạt giới hạn ${MAX_LISTINGS_PER_USER} tin đăng đang hoạt động.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const sellerData = await User.findOne({
        userId: sellerId,
        guildId,
      }).session(session);
      if (!sellerData) throw new Error("Không tìm thấy dữ liệu người dùng.");

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
        if (carInstance.installedParts && carInstance.installedParts.size > 0) {
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
        if (!partDef) throw new Error("Không tìm thấy định nghĩa phụ tùng.");

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
      await newListing.save({ session });

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

      await sellerData.save({ session }); // Lưu lại User sau khi đã cập nhật inventory/garage
      await session.commitTransaction();

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ Đăng bán thành công!")
        .setDescription(
          `Bạn đã đăng bán **${quantityToSell} ${itemNameDisplay}** lên chợ với giá **${finalPrice.toLocaleString()} VNĐ** ${itemTypeToSell === "car_instance" ? "(tổng giá)" : "(mỗi cái)"}.`,
        )
        .addFields({ name: "🔎 ID Tin đăng", value: `\`${newListing._id}\`` });
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
      await session.abortTransaction();
      Logger.error(
        `Lỗi lệnh /market-sell bởi ${interaction.user.tag} (ID: ${sellerId}) cho id ${idToSell} (type ${itemTypeToSell}): ${error.message}`,
        { stack: error.stack },
      );
      await interaction.editReply({
        content: `❌ Đã xảy ra lỗi khi đăng bán: ${error.message}`,
      });
    } finally {
      await session.endSession();
    }
  },
};
