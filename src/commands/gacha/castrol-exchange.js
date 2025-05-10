const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const User = require("../../models/User");
const ShopItem = require("../../models/ShopItem"); // Để lấy thông tin Vé Roll
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

const CASTROL_COST_PER_TICKET = 50;
const WEEKLY_TICKET_LIMIT = 10;
const TICKET_ITEM_ID = "roll_ticket";

// Hàm lấy ngày đầu tuần (Thứ 2)
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function toDateOnlyString(date) {
  return date.toISOString().split("T")[0];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("castrol-exchange")
    .setDescription(
      "Dùng Castrol để đổi lấy các vật phẩm đặc biệt trong cửa hàng quy đổi.",
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("Xem các vật phẩm có thể đổi bằng Castrol."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("redeem")
        .setDescription("Đổi Castrol lấy vật phẩm.")
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("Vật phẩm muốn đổi (hiện chỉ có vé roll).")
            .setRequired(true)
            .addChoices({
              name: `Vé Roll Gacha (Cần ${CASTROL_COST_PER_TICKET} Castrol)`,
              value: "roll_ticket",
            }),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription(
              `Số lượng muốn đổi (Mặc định: 1, Tối đa đổi ${WEEKLY_TICKET_LIMIT} vé/tuần).`,
            )
            .setMinValue(1)
            .setRequired(false),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (subcommand === "view") {
      const embed = new EmbedBuilder()
        .setTitle("🛢️ Cửa Hàng Quy Đổi Castrol 🛢️")
        .setColor("Aqua")
        .addFields(
          {
            name: `🎟️ Vé Roll Gacha (ID: ${TICKET_ITEM_ID})`,
            value: `Đổi **${CASTROL_COST_PER_TICKET} Castrol** lấy 1 Vé Roll.\nGiới hạn đổi: **${WEEKLY_TICKET_LIMIT} vé/tuần**.`,
          },
          // Thêm các vật phẩm khác có thể đổi bằng Castrol ở đây
        )
        .setFooter({ text: "Dùng lệnh /castrol-exchange redeem để đổi." });
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "redeem") {
      const itemToRedeem = interaction.options.getString("item");
      const quantityToRedeem = interaction.options.getInteger("quantity") || 1;

      if (itemToRedeem !== "roll_ticket") {
        return interaction.reply({
          content: "❌ Vật phẩm đổi không hợp lệ.",
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });
      const session = await mongoose.startSession();

      try {
        session.startTransaction();
        let user = await User.findOne({ userId, guildId }).session(session);
        if (!user) {
          // Nên tạo user nếu chưa có, hoặc báo lỗi tùy theo logic của bạn
          user = new User({ userId, guildId });
        }
        if (!user.gacha)
          user.gacha = {
            weeklyTicketExchange: { count: 0, weekStartDate: null },
          };
        if (!user.gacha.weeklyTicketExchange)
          user.gacha.weeklyTicketExchange = { count: 0, weekStartDate: null };
        if (!user.inventory) user.inventory = new Map();

        const totalCastrolNeeded = CASTROL_COST_PER_TICKET * quantityToRedeem;

        if ((user.castrolBalance || 0) < totalCastrolNeeded) {
          throw new Error(
            `Bạn không đủ Castrol! Cần ${totalCastrolNeeded}, bạn có ${user.castrolBalance || 0}.`,
          );
        }

        // Kiểm tra giới hạn đổi hàng tuần
        const now = new Date();
        const currentWeekStart = getStartOfWeek(now);
        let weeklyData = user.gacha.weeklyTicketExchange;

        // Nếu qua tuần mới hoặc chưa từng đổi, reset
        if (
          !weeklyData.weekStartDate ||
          toDateOnlyString(weeklyData.weekStartDate) !==
            toDateOnlyString(currentWeekStart)
        ) {
          weeklyData.count = 0;
          weeklyData.weekStartDate = currentWeekStart;
        }

        if (weeklyData.count + quantityToRedeem > WEEKLY_TICKET_LIMIT) {
          throw new Error(
            `Bạn chỉ có thể đổi tối đa ${WEEKLY_TICKET_LIMIT} vé mỗi tuần. Tuần này bạn đã đổi ${weeklyData.count} vé.`,
          );
        }

        // Thực hiện đổi
        user.castrolBalance -= totalCastrolNeeded;
        const currentTickets = user.inventory.get(TICKET_ITEM_ID) || 0;
        user.inventory.set(TICKET_ITEM_ID, currentTickets + quantityToRedeem);
        weeklyData.count += quantityToRedeem;

        user.markModified("gacha.weeklyTicketExchange");
        user.markModified("inventory");
        user.markModified("castrolBalance");

        await user.save({ session });
        await session.commitTransaction();

        await interaction.editReply(
          `✅ Bạn đã đổi thành công **${quantityToRedeem} Vé Roll Gacha** với **${totalCastrolNeeded} Castrol**.\nBạn đã đổi ${weeklyData.count}/${WEEKLY_TICKET_LIMIT} vé trong tuần này.`,
        );
        Logger.info(
          `[Castrol Exchange] User ${userId} redeemed ${quantityToRedeem} roll tickets for ${totalCastrolNeeded} castrol.`,
        );
      } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        Logger.error(
          `Lỗi /castrol-exchange redeem (User ${userId}): ${error.message}`,
          { stack: error.stack },
        );
        await interaction.editReply({ content: `❌ ${error.message}` });
      } finally {
        await session.endSession();
      }
    }
  },
};
