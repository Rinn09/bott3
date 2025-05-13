const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const MarketTransaction = require("../../models/MarketTransaction");
const Logger = require("../../utils/logger");

const TRANSACTIONS_PER_PAGE = 10; // Số giao dịch mỗi trang

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market-history")
    .setDescription("Xem lịch sử mua và bán của bạn trên chợ.")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Số trang muốn xem (mặc định là 1)")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    let requestedHistoryPage = interaction.options.getInteger("page") || 1;

    await interaction.deferReply({ ephemeral: false }); // Lịch sử thường chỉ người đó xem

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
        Math.ceil(transactionsCount / TRANSACTIONS_PER_PAGE) || 1;

      if (page > totalPages) page = totalPages;
      if (page < 1) page = 1;

      const skip = (page - 1) * TRANSACTIONS_PER_PAGE;

      const transactions = await MarketTransaction.find(mongoQuery)
        .sort({ transactionTime: -1 }) // Sắp xếp mới nhất lên đầu
        .skip(skip)
        .limit(TRANSACTIONS_PER_PAGE)
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
            ? [generatePaginationButtons(page, totalPages, "market_history_")]
            : [];
        return { embeds: [embed], components, currentPage: page, totalPages };
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
  },
};
