// src/commands/shop/buy.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js"); // Thêm EmbedBuilder nếu cần
const User = require("../../models/User");
const ShopItem = require("../../models/ShopItem");
const Logger = require("../../utils/logger"); // Thêm Logger

// Hàm helper để lấy ngày YYYY-MM-DD (UTC)
function getUTCDateString(date) {
  return date.toISOString().split("T")[0];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Mua vật phẩm từ cửa hàng.")
    .addStringOption((option) =>
      option
        .setName("item_id")
        .setDescription("ID của vật phẩm muốn mua (xem ID bằng /shop)")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Số lượng muốn mua (mặc định là 1)")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const itemId = interaction.options.getString("item_id").toLowerCase();
    const quantityToBuy = interaction.options.getInteger("quantity") || 1;

    await interaction.deferReply({ ephemeral: true }); // Ephemeral vì có thể có lỗi hoặc thông tin cá nhân

    try {
      const item = await ShopItem.findOne({ itemId: itemId }).lean(); // Dùng lean() cho hiệu năng
      let user = await User.findOne({ userId, guildId });

      if (!user) {
        // Hoặc tạo user mới nếu bạn muốn
        // user = new User({ userId, guildId });
        return interaction.editReply(
          "❌ Không tìm thấy dữ liệu người dùng! Hãy thử tương tác với bot trước.",
        );
      }
      // Khởi tạo các trường cần thiết nếu chưa có
      if (!user.inventory) user.inventory = new Map();
      if (!user.dailyPurchases) user.dailyPurchases = new Map();

      if (!item) {
        return interaction.editReply(
          `❌ Không tìm thấy vật phẩm với ID \`${itemId}\`.`,
        );
      }
      if (item.buyPrice === null) {
        return interaction.editReply(
          `❌ Vật phẩm **${item.name}** không thể mua từ cửa hàng.`,
        );
      }

      // --- KIỂM TRA DAILY BUY LIMIT ---
      if (item.dailyBuyLimit !== null && item.dailyBuyLimit > 0) {
        const todayStr = getUTCDateString(new Date()); // Lấy ngày hiện tại dạng YYYY-MM-DD
        const purchaseData = user.dailyPurchases.get(itemId);
        let currentDailyCount = 0;

        if (
          purchaseData &&
          getUTCDateString(purchaseData.lastPurchaseDate) === todayStr
        ) {
          // Nếu đã mua trong ngày hôm nay
          currentDailyCount = purchaseData.count;
        }

        if (currentDailyCount + quantityToBuy > item.dailyBuyLimit) {
          return interaction.editReply(
            `❌ Bạn chỉ có thể mua tối đa **${item.dailyBuyLimit}** ${item.name} mỗi ngày. Hôm nay bạn đã mua ${currentDailyCount}.`,
          );
        }
      }
      // --- KẾT THÚC KIỂM TRA DAILY LIMIT ---

      // --- KIỂM TRA YÊU CẦU NGHỀ/LEVEL (Giữ nguyên) ---
      if (item.requiredJob && item.requiredJob.length > 0) {
        // Check if array has elements
        let reqJobs = item.requiredJob.map((job) => job.toLowerCase());
        const userJob = user.mainJob?.name?.toLowerCase();
        if (
          !userJob ||
          !reqJobs.includes(userJob) ||
          (user.mainJob.level || 1) < (item.requiredLevel || 1)
        ) {
          return interaction.editReply(
            `❌ Bạn cần là một trong những nghề **<span class="math-inline">\{reqJobs\.join\(', '\)\}\*\* cấp \*\*</span>{item.requiredLevel || 1}** trở lên để mua vật phẩm này.`,
          );
        }
      }
      // --- KẾT THÚC KIỂM TRA YÊU CẦU ---

      const totalCost = item.buyPrice * quantityToBuy;

      if (user.balance < totalCost) {
        return interaction.editReply(
          `❌ Bạn không đủ tiền! Cần **${totalCost.toLocaleString()} VNĐ** nhưng bạn chỉ có ${user.balance.toLocaleString()} VNĐ.`,
        );
      }

      // --- Thực hiện giao dịch ---
      user.balance -= totalCost;
      user.totalSpent = (user.totalSpent || 0) + totalCost;

      // Thêm vật phẩm vào inventory (Vé roll giờ là item trong inventory)
      const currentInvQuantity = user.inventory.get(itemId) || 0;
      user.inventory.set(itemId, currentInvQuantity + quantityToBuy);

      // Cập nhật lại daily purchase count
      if (item.dailyBuyLimit !== null && item.dailyBuyLimit > 0) {
        const todayStr = getUTCDateString(new Date());
        const purchaseData = user.dailyPurchases.get(itemId);
        if (
          purchaseData &&
          getUTCDateString(purchaseData.lastPurchaseDate) === todayStr
        ) {
          purchaseData.count += quantityToBuy; // Cộng dồn nếu mua tiếp trong ngày
        } else {
          user.dailyPurchases.set(itemId, {
            count: quantityToBuy,
            lastPurchaseDate: new Date(),
          }); // Reset count cho ngày mới
        }
        user.markModified("dailyPurchases"); // Đánh dấu Map đã thay đổi
      }

      user.markModified("inventory"); // Đánh dấu Map inventory đã thay đổi

      await user.save();

      await interaction.editReply(
        `✅ Bạn đã mua thành công **${quantityToBuy} <span class="math-inline">\{item\.name\}\*\* với giá \*\*</span>{totalCost.toLocaleString()} VNĐ**.`,
      );
      Logger.info(
        `[Shop Buy] User ${userId} bought ${quantityToBuy} of <span class="math-inline">\{itemId\} \(</span>{item.name}) for ${totalCost} VND.`,
      );
    } catch (error) {
      Logger.error(
        `Lỗi lệnh /buy (User: ${userId}, Item: ${itemId}): ${error.message}`,
        { stack: error.stack },
      );
      await interaction.editReply({
        content: "❌ Đã xảy ra lỗi khi mua vật phẩm.",
      });
    }
  },
};
