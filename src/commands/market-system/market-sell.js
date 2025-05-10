const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const ShopItem = require("../../models/ShopItem");
const MarketListing = require("../../models/MarketListing"); // Model đã cập nhật
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market-sell")
    .setDescription("Đăng bán vật phẩm của bạn lên chợ.")
    .addStringOption((option) =>
      option
        .setName("item_id")
        .setDescription("ID của vật phẩm bạn muốn bán (từ /inventory)")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Số lượng muốn bán")
        .setRequired(true)
        .setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName("price_per_item")
        .setDescription("Giá VNĐ cho MỖI đơn vị vật phẩm")
        .setRequired(true)
        .setMinValue(0),
    ), // Cho phép bán giá 0 nếu muốn (tặng)

  async execute(interaction) {
    const sellerId = interaction.user.id;
    const guildId = interaction.guild.id;
    const itemIdToSell = interaction.options.getString("item_id").toLowerCase();
    const quantityToSell = interaction.options.getInteger("quantity");
    const pricePerItem = interaction.options.getInteger("price_per_item");

    // Giới hạn số lượng tin đăng mỗi người (tùy chọn)
    const MAX_LISTINGS_PER_USER = 10; // Ví dụ: mỗi người tối đa 10 tin đăng active
    const currentListingsCount = await MarketListing.countDocuments({
      sellerId,
      guildId,
      status: "active",
    });
    if (currentListingsCount >= MAX_LISTINGS_PER_USER) {
      return interaction.reply({
        content: `❌ Bạn đã đạt giới hạn ${MAX_LISTINGS_PER_USER} tin đăng đang hoạt động trên chợ. Hãy quản lý các tin đăng cũ trước.`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sellerData = await User.findOne({
        userId: sellerId,
        guildId,
      }).session(session);
      if (!sellerData) {
        throw new Error("Không tìm thấy dữ liệu người dùng của bạn.");
      }

      const itemInInventory = sellerData.inventory?.get(itemIdToSell) || 0;
      if (itemInInventory < quantityToSell) {
        throw new Error(
          `Bạn không có đủ ${quantityToSell} vật phẩm \`${itemIdToSell}\` để bán. Số lượng hiện có: ${itemInInventory}.`,
        );
      }

      const shopItemData = await ShopItem.findOne({
        itemId: itemIdToSell,
      }).lean(); // .lean() để lấy plain JS object
      if (!shopItemData) {
        throw new Error(
          `Vật phẩm với ID \`${itemIdToSell}\` không tồn tại trong danh mục hệ thống.`,
        );
      }

      if (shopItemData.marketable === false) {
        throw new Error(
          `Vật phẩm **${shopItemData.name}** không được phép bán trên chợ.`,
        );
      }

      // Trừ vật phẩm khỏi inventory người bán
      const newInventoryQty = itemInInventory - quantityToSell;
      if (newInventoryQty <= 0) {
        sellerData.inventory.delete(itemIdToSell);
      } else {
        sellerData.inventory.set(itemIdToSell, newInventoryQty);
      }
      sellerData.markModified("inventory"); // Quan trọng khi thay đổi Map
      await sellerData.save({ session });

      // Tạo tin đăng mới trên chợ
      const newListing = new MarketListing({
        guildId, // Thêm guildId vào đây
        sellerId,
        sellerUsername: interaction.user.username, // Lưu username để hiển thị, có thể cập nhật nếu user đổi tên
        itemId: itemIdToSell,
        itemName: shopItemData.name,
        quantity: quantityToSell,
        price: pricePerItem, // Lưu giá mỗi đơn vị
        status: "active",
        itemSnapshot: {
          // Lưu trữ thông tin vật phẩm tại thời điểm đăng
          name: shopItemData.name,
          description: shopItemData.description,
          // Sao chép các trường cần thiết khác từ shopItemData nếu có
          // effects: shopItemData.effects, // Ví dụ
          // requiredJob: shopItemData.requiredJob // Ví dụ
        },
      });
      await newListing.save({ session });

      await session.commitTransaction();

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ Đăng bán thành công!")
        .setDescription(
          `Bạn đã đăng bán **${quantityToSell} ${shopItemData.name}** lên chợ với giá **${pricePerItem.toLocaleString()} VNĐ** mỗi cái.`,
        )
        .addFields(
          { name: "🔎 ID Tin đăng", value: `\`${newListing._id}\`` }, // Dùng để quản lý sau này (ví dụ: hủy tin đăng)
          {
            name: "📦 Số lượng còn lại trong túi",
            value: `${newInventoryQty}`,
          },
        )
        .setTimestamp()
        .setFooter({
          text: `Người bán: ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await session.abortTransaction();
      Logger.error(
        `Lỗi lệnh /market-sell bởi ${interaction.user.tag} (ID: ${sellerId}) cho item ${itemIdToSell}: ${error.message}`,
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
