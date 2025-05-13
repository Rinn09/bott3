// src/commands/admin/reset-user.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const User = require("../../models/User"); // Đảm bảo đường dẫn đúng
const Logger = require("../../utils/logger"); // Import Logger để ghi log

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset-user")
    .setDescription(
      "⚠️[Admin] Reset TOÀN BỘ dữ liệu của người dùng về mặc định.",
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Người dùng cần reset dữ liệu")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const guildId = interaction.guild.id;

    if (targetUser.bot) {
      return interaction.reply({
        content: "❌ Không thể reset dữ liệu của bot.",
        ephemeral: true,
      });
    }

    const confirmButton = new ButtonBuilder()
      .setCustomId(`confirm_reset_${targetUser.id}_${interaction.id}`) // Thêm interaction.id để customId thực sự unique mỗi lần gọi lệnh
      .setLabel(`Reset ${targetUser.username}`)
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId(`cancel_reset_${interaction.id}`) // Thêm interaction.id
      .setLabel("Hủy")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(
      confirmButton,
      cancelButton,
    );

    const confirmEmbed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("❓ Xác nhận Reset Dữ liệu Người Dùng")
      .setDescription(
        `Bạn có chắc chắn muốn reset **TOÀN BỘ** dữ liệu của **${targetUser.tag}** (\`${targetUser.id}\`) không?\n\nBao gồm:\n- Tiền (ví & ngân hàng)\n- Level & XP\n- Công việc (chính & phụ)\n- Kho đồ (Inventory)\n- Garage (Xe & Phụ tùng)\n- Điểm Castrol\n- Lượt Gacha & Pity\n- Cooldowns và các dữ liệu cá nhân khác.\n\nHành động này **KHÔNG THỂ** hoàn tác!`,
      )
      .setFooter({
        text: "Hành động này sẽ xóa sạch tiến trình của người dùng.",
      });

    // Sửa: ephemeral nên là true để chỉ người dùng lệnh thấy, và không cần withResponse
    await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true, // True để chỉ người gọi lệnh thấy
    });

    // Sửa: Collector nên được tạo trên `interaction.channel` nếu `interaction.reply` là ephemeral,
    // hoặc tốt hơn là trên `reply` (nếu `WorkspaceReply: true` được dùng, nhưng với ephemeral, collector trên channel là cách tiếp cận tốt)
    // Tuy nhiên, vì reply là ephemeral, chỉ người dùng lệnh thấy, nên collector trên channel có thể không nhận được component từ người đó.
    // Giải pháp tốt hơn là không dùng ephemeral cho tin nhắn có button nếu collector cần bắt từ chính tin nhắn đó.
    // Hoặc sử dụng `await interaction.channel.awaitMessageComponent`
    // Trong trường hợp này, vì ephemeral: true, collector gắn vào `interaction` (nếu v14 hỗ trợ) hoặc `interaction.channel` có thể không hoạt động như mong đợi.
    // Cách an toàn nhất là không dùng ephemeral cho tin nhắn này, hoặc phải dùng một kỹ thuật khác để chờ đợi.
    // Tuy nhiên, để giữ logic hiện tại, hãy thử để ephemeral: false cho tin nhắn confirm

    // Gửi một tin nhắn mới (không ephemeral) để các button có thể được thu thập đúng cách
    const messageWithButtons = await interaction.followUp({
      // Sử dụng followUp để gửi tin nhắn mới không ephemeral
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: false, // Quan trọng: để false thì collector mới hoạt động ổn định với awaitMessageComponent trên channel
      fetchReply: true, // Cần để lấy message object cho collector
    });

    const filter = (i) =>
      i.user.id === interaction.user.id && // Chỉ người gọi lệnh mới được bấm
      (i.customId === `confirm_reset_${targetUser.id}_${interaction.id}` ||
        i.customId === `cancel_reset_${interaction.id}`);

    try {
      // Sử dụng collector trên message đã gửi
      const confirmation = await messageWithButtons.awaitMessageComponent({
        filter,
        time: 30000,
      }); // Chờ 30 giây

      if (confirmation.customId === `cancel_reset_${interaction.id}`) {
        await confirmation.update({
          content: "✅ Đã hủy thao tác reset.",
          embeds: [],
          components: [],
        });
        // Xóa tin nhắn có button sau khi hủy (tùy chọn)
        // await messageWithButtons.delete().catch(console.error);
        return;
      }

      if (
        confirmation.customId ===
        `confirm_reset_${targetUser.id}_${interaction.id}`
      ) {
        await confirmation.deferUpdate(); // Xác nhận nút đã được bấm

        try {
          // Sử dụng findOneAndUpdate để tìm và cập nhật, hoặc không làm gì nếu user không tồn tại
          const updateResult = await User.findOneAndUpdate(
            { userId: targetUser.id, guildId: guildId }, // Điều kiện tìm
            {
              $set: {
                // Đặt các giá trị về mặc định
                balance: 0,
                bank: 0,
                xp: 0,
                level: 1,
                cooldowns: {}, // Reset tất cả cooldowns chung
                totalEarned: 0,
                totalSpent: 0,
                inventory: new Map(), // Reset túi đồ
                job: null, // Reset việc làm phụ
                mainJob: {
                  // Reset việc làm chính
                  name: null,
                  level: 1,
                  xp: 0,
                  lastSalary: null,
                  hiredAt: null,
                  lastQuit: null,
                  taskCooldowns: new Map(),
                  taskCount: 0,
                },
                gacha: {
                  // Reset dữ liệu Gacha
                  lastFreeRollDate: null,
                  freeRollsUsedToday: 0,
                  pityRolls: 0,
                  weeklyTicketExchange: { count: 0, weekStartDate: null },
                },
                garage: {
                  // Reset Garage
                  cars: [],
                  parts: [],
                },
                castrolBalance: 0, // Reset Castrol
                dailyPurchases: new Map(), // Reset giới hạn mua hàng ngày
              },
              $unset: {
                // Xóa các trường có thể không còn dùng hoặc muốn xóa hẳn
                lastDaily: "", // Nếu bạn dùng lastDaily trong cooldowns thì không cần unset ở đây
                // Thêm các trường cũ bạn muốn loại bỏ hoàn toàn nếu có
              },
            },
            {
              new: true, // Trả về document sau khi cập nhật (không bắt buộc nếu chỉ cần biết thành công hay không)
              upsert: false, // KHÔNG tạo mới nếu user chưa tồn tại. Chỉ reset user đã có dữ liệu.
            },
          );

          if (!updateResult) {
            await confirmation.editReply({
              content: `❌ Không tìm thấy dữ liệu của người dùng ${targetUser.tag} trong server này để reset. Họ có thể chưa tương tác với bot.`,
              components: [],
              embeds: [],
            });
            return;
          }

          Logger.info(
            `Admin ${interaction.user.tag} đã reset dữ liệu cho ${targetUser.tag} (ID: ${targetUser.id}) tại guild ${guildId}`,
          );
          await confirmation.editReply({
            content: `✅ Đã reset thành công toàn bộ dữ liệu của **${targetUser.tag}**!`,
            components: [],
            embeds: [],
          });
        } catch (dbError) {
          Logger.error(
            `Lỗi DB khi reset user ${targetUser.tag}: ${dbError.message}`,
            { stack: dbError.stack },
          );
          await confirmation.editReply({
            content:
              "❌ Đã xảy ra lỗi khi reset dữ liệu người dùng trong database.",
            components: [],
            embeds: [],
          });
        }
      }
    } catch (error) {
      // Lỗi từ awaitMessageComponent (thường là hết thời gian)
      // Xóa tin nhắn có button sau khi hết hạn (tùy chọn)
      // await messageWithButtons.delete().catch(console.error);
      if (
        error.code === "InteractionCollectorError" ||
        error.message.includes("time")
      ) {
        // Kiểm tra lỗi hết thời gian cụ thể hơn
        // Tin nhắn gốc ephemeral không thể edit trực tiếp theo cách này nữa.
        // Nếu muốn thông báo hết hạn, có thể gửi một tin nhắn ephemeral mới.
        await interaction.followUp({
          content: "⌛ Hết thời gian xác nhận, đã hủy thao tác reset.",
          ephemeral: true,
        });
      } else {
        Logger.error(
          `Lỗi collector hoặc xử lý component lệnh reset-user: ${error.message}`,
          { stack: error.stack },
        );
        await interaction.followUp({
          content: "❌ Có lỗi xảy ra với bộ thu tương tác.",
          ephemeral: true,
        });
      }
      // Xóa các component khỏi messageWithButtons để người dùng không bấm được nữa
      await messageWithButtons.edit({ components: [] }).catch(() => {});
    }
  },
};
