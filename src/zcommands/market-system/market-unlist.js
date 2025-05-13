const { SlashCommandBuilder, EmbedBuilder, inlineCode } = require("discord.js"); // Thêm inlineCode
const MarketListing = require("../../models/MarketListing");
const User = require("../../models/User");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market-unlist")
    .setDescription("Hủy một tin đăng bán vật phẩm, xe, hoặc phụ tùng của bạn.") // Cập nhật mô tả
    .addStringOption((option) =>
      option
        .setName("listing_id")
        .setDescription("ID của tin đăng bạn muốn hủy")
        .setRequired(true),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const unlistIdString = interaction.options.getString("listing_id");

    if (!mongoose.Types.ObjectId.isValid(unlistIdString)) {
      return interaction.reply({
        content: "❌ ID tin đăng không hợp lệ.",
        ephemeral: true,
      });
    }
    const listingId = new mongoose.Types.ObjectId(unlistIdString);

    await interaction.deferReply({ ephemeral: false });

    const session = await mongoose.startSession();
    session.startTransaction();

    let unlistedItemName = "Vật phẩm/Xe/Phụ tùng";
    let unlistedQuantity = 0;

    try {
      const listing = await MarketListing.findById(listingId).session(session);

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

      const userData = await User.findOne({ userId, guildId }).session(session);
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
            userData.garage.cars[carIndex].marketListingId.equals(listing._id)
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
            userData.garage.parts[partIndex].marketListingId.equals(listing._id)
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

      await userData.save({ session });

      // Xóa tin đăng khỏi chợ
      await MarketListing.deleteOne({ _id: listing._id }).session(session);
      // Hoặc cập nhật status:
      // listing.status = 'cancelled';
      // await listing.save({ session });

      await session.commitTransaction();

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
      await session.abortTransaction();
      Logger.error(
        `Lỗi lệnh /market-unlist (Listing: ${unlistIdString}, User: ${userId}): ${error.message}`,
        { stack: error.stack },
      );
      await interaction.editReply({
        content: `❌ Lỗi khi hủy tin đăng: ${error.message}`,
      });
    } finally {
      await session.endSession();
    }
  },
};
