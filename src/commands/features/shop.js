// src/commands/features/shop.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType, // Cần cho collector của view
} = require("discord.js");
const User = require("../../models/User");
const ShopItem = require("../../models/ShopItem");
const MainJob = require("../../models/MainJob"); // Cho lệnh use item
const Logger = require("../../utils/logger");
// const { /* các helper function nếu cần, ví dụ getUTCDateString từ buy.js */ } = require('../../utils/someUtil'); // Tạo file utils nếu cần

// --- Helper functions (di chuyển từ các file con nếu có) ---
function getUTCDateString(date) {
  // Từ buy.js
  return date.toISOString().split("T")[0];
}

// Constants
const ITEMS_PER_PAGE_SHOP_VIEW = 5; // Từ shop.js (view)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription(
      "Tương tác với cửa hàng của bot (mua, bán, sử dụng vật phẩm, xem túi đồ).",
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription(
          "Xem các vật phẩm đang được bán trong cửa hàng của bot.",
        )
        .addIntegerOption(
          (
            option, // Thêm option page cho view
          ) =>
            option
              .setName("page")
              .setDescription("Số trang muốn xem.")
              .setMinValue(1)
              .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buy")
        .setDescription("Mua một vật phẩm từ cửa hàng của bot.")
        .addStringOption((option) =>
          option
            .setName("item_id")
            .setDescription(
              "ID của vật phẩm bạn muốn mua (xem ID bằng /shop view).",
            )
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("Số lượng muốn mua (mặc định là 1).")
            .setMinValue(1)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sell")
        .setDescription("Bán vật phẩm từ túi đồ của bạn cho cửa hàng của bot.")
        .addStringOption((option) =>
          option
            .setName("item_id")
            .setDescription(
              "ID của vật phẩm bạn muốn bán (xem ID bằng /shop inventory).",
            )
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("Số lượng muốn bán (mặc định là 1).")
            .setMinValue(1)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("inventory")
        .setDescription("Xem các vật phẩm trong túi đồ của bạn."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("use")
        .setDescription("Sử dụng một vật phẩm từ túi đồ của bạn.")
        .addStringOption((option) =>
          option
            .setName("item_id")
            .setDescription(
              "ID của vật phẩm bạn muốn sử dụng (xem ID bằng /shop inventory).",
            )
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("Số lượng muốn sử dụng (mặc định là 1).")
            .setMinValue(1)
            .setRequired(false),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      let user = await User.findOne({ userId, guildId });
      // Tạo user nếu chưa có cho các lệnh yêu cầu (trừ view shop)
      if (!user && !["view"].includes(subcommand)) {
        user = await User.create({ userId, guildId });
      }

      if (subcommand === "view") {
        // <<<----- LOGIC TỪ src/commands/shop/shop.js ----->>>
        await interaction.deferReply();
        const requestedPage = interaction.options.getInteger("page") || 1;

        // Chỉ lấy các item có buyPrice (có thể mua được)
        const itemsQuery = ShopItem.find({
          buyPrice: { $ne: null, $exists: true },
        }).sort({ name: 1 });
        const totalItems = await ShopItem.countDocuments({
          buyPrice: { $ne: null, $exists: true },
        });

        if (totalItems === 0) {
          return interaction.editReply(
            "Hiện tại cửa hàng của bot chưa có vật phẩm nào để bán!",
          );
        }

        const totalPages =
          Math.ceil(totalItems / ITEMS_PER_PAGE_SHOP_VIEW) || 1;
        let currentPageNum = Math.min(Math.max(requestedPage, 1), totalPages); // Clamp page number

        const itemsToShow = await itemsQuery
          .skip((currentPageNum - 1) * ITEMS_PER_PAGE_SHOP_VIEW)
          .limit(ITEMS_PER_PAGE_SHOP_VIEW)
          .lean();

        const generateEmbed = (page, itemsList, totalPgs, totalIts) => {
          const embed = new EmbedBuilder()
            .setTitle("🛒 Cửa Hàng Vật Phẩm Của Bot")
            .setColor("#00A86B")
            .setDescription(
              `Có tổng cộng **${totalIts}** vật phẩm, hiển thị trang **${page}/${totalPgs}**.\nSử dụng \`/shop buy <item_id> [số lượng]\` để mua.`,
            )
            .setTimestamp()
            .setFooter({ text: `Trang ${page} của ${totalPgs}` });

          if (!itemsList.length && totalIts > 0) {
            embed.addFields({
              name: "Thông báo",
              value: "Không có vật phẩm nào ở trang này.",
            });
          } else if (!itemsList.length && totalIts === 0) {
            embed.addFields({
              name: "Thông báo",
              value: "Cửa hàng hiện đang trống trơn!",
            });
          }

          itemsList.forEach((item) => {
            let fieldValue =
              `**Mô tả:** ${item.description || "Không có mô tả."}\n` +
              `**Giá mua:** ${item.buyPrice?.toLocaleString()} VNĐ`;
            if (item.sellPrice !== null && item.sellPrice !== undefined) {
              fieldValue += ` | **Giá bán lại:** ${item.sellPrice.toLocaleString()} VNĐ`;
            }
            if (item.requiredJob && item.requiredJob.length > 0) {
              const reqJob = Array.isArray(item.requiredJob)
                ? item.requiredJob.join(", ")
                : item.requiredJob;
              fieldValue += `\n*Yêu cầu nghề:* **${reqJob
                .split(",")
                .map(
                  (j) => j.trim().charAt(0).toUpperCase() + j.trim().slice(1),
                )
                .join(" hoặc ")}** (Cấp ${item.requiredLevel || 1}+)`;
            }
            if (item.dailyBuyLimit !== null && item.dailyBuyLimit > 0) {
              fieldValue += `\n*Giới hạn mua:* **${item.dailyBuyLimit} cái/ngày**`;
            }
            embed.addFields({
              name: `**${item.name}** (\`${item.itemId}\`)`,
              value: fieldValue,
            });
          });
          return embed;
        };

        const generateButtons = (page, totalPgs) => {
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`shop_view_prev_${page}_${interaction.id}`)
              .setLabel("◀️ Trước")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 1),
            new ButtonBuilder()
              .setCustomId(`shop_view_next_${page}_${interaction.id}`)
              .setLabel("Sau ▶️")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page >= totalPgs),
          );
        };

        const initialEmbed = generateEmbed(
          currentPageNum,
          itemsToShow,
          totalPages,
          totalItems,
        );
        const components =
          totalPages > 1 ? [generateButtons(currentPageNum, totalPages)] : [];
        const message = await interaction.editReply({
          embeds: [initialEmbed],
          components,
        });

        if (totalPages <= 1) return;

        const filter = (i) =>
          i.user.id === userId &&
          i.message.id === message.id &&
          i.customId.startsWith("shop_view_");
        const collector = message.createMessageComponentCollector({
          filter,
          componentType: ComponentType.Button,
          time: 2 * 60 * 1000,
        }); // 2 phút

        collector.on("collect", async (i) => {
          await i.deferUpdate();
          const actionPart = i.customId.split("_")[2]; // prev hoặc next

          if (actionPart === "prev") {
            currentPageNum = Math.max(1, currentPageNum - 1);
          } else if (actionPart === "next") {
            currentPageNum = Math.min(totalPages, currentPageNum + 1);
          }
          const newItemsToShow = await ShopItem.find({
            buyPrice: { $ne: null, $exists: true },
          })
            .sort({ name: 1 })
            .skip((currentPageNum - 1) * ITEMS_PER_PAGE_SHOP_VIEW)
            .limit(ITEMS_PER_PAGE_SHOP_VIEW)
            .lean();

          const updatedEmbed = generateEmbed(
            currentPageNum,
            newItemsToShow,
            totalPages,
            totalItems,
          );
          const updatedButtons = generateButtons(currentPageNum, totalPages);
          await i.editReply({
            embeds: [updatedEmbed],
            components: [updatedButtons],
          });
        });

        collector.on("end", async () => {
          const finalEmbed = generateEmbed(
            currentPageNum,
            itemsToShow,
            totalPages,
            totalItems,
          ); // Có thể itemsToShow ở đây là của trang cũ
          const finalItems = await ShopItem.find({
            buyPrice: { $ne: null, $exists: true },
          })
            .sort({ name: 1 })
            .skip((currentPageNum - 1) * ITEMS_PER_PAGE_SHOP_VIEW)
            .limit(ITEMS_PER_PAGE_SHOP_VIEW)
            .lean();
          const disabledEmbed = generateEmbed(
            currentPageNum,
            finalItems,
            totalPages,
            totalItems,
          );

          const disabledButtons = generateButtons(
            currentPageNum,
            totalPages,
          ).components.map((b) => b.setDisabled(true));
          await message
            .edit({
              embeds: [disabledEmbed],
              components: [
                new ActionRowBuilder().addComponents(disabledButtons),
              ],
            })
            .catch(() => {});
        });
      } else if (subcommand === "buy") {
        // <<<----- LOGIC TỪ src/commands/shop/buy.js ----->>>
        await interaction.deferReply({ ephemeral: true }); // Mua bán nên ephemeral
        if (!user)
          return interaction.editReply(
            "❌ Lỗi: Không tìm thấy dữ liệu của bạn để thực hiện giao dịch.",
          );

        const itemIdToBuy = interaction.options
          .getString("item_id")
          .toLowerCase();
        const quantityToBuy = interaction.options.getInteger("quantity") || 1;

        const itemData = await ShopItem.findOne({ itemId: itemIdToBuy }).lean();

        if (!itemData) {
          return interaction.editReply(
            `❌ Không tìm thấy vật phẩm với ID: \`${itemIdToBuy}\`.`,
          );
        }
        if (itemData.buyPrice === null || itemData.buyPrice === undefined) {
          return interaction.editReply(
            `❌ Vật phẩm **${itemData.name}** hiện không thể mua từ cửa hàng.`,
          );
        }

        // Kiểm tra daily buy limit
        if (itemData.dailyBuyLimit !== null && itemData.dailyBuyLimit > 0) {
          const todayStr = getUTCDateString(new Date());
          const purchaseData = user.dailyPurchases?.get(itemIdToBuy) || {
            count: 0,
            lastPurchaseDate: new Date(0),
          };
          let currentDailyCount = 0;
          if (
            getUTCDateString(new Date(purchaseData.lastPurchaseDate)) ===
            todayStr
          ) {
            currentDailyCount = purchaseData.count;
          }
          if (currentDailyCount + quantityToBuy > itemData.dailyBuyLimit) {
            return interaction.editReply(
              `❌ Bạn chỉ có thể mua tối đa **${itemData.dailyBuyLimit}** ${itemData.name} mỗi ngày. Hôm nay bạn đã mua ${currentDailyCount}.`,
            );
          }
        }

        // Kiểm tra yêu cầu nghề/level
        if (itemData.requiredJob && itemData.requiredJob.length > 0) {
          const reqJobs = itemData.requiredJob.map((job) => job.toLowerCase());
          const userJobName = user.mainJob?.name?.toLowerCase();
          if (
            !userJobName ||
            !reqJobs.includes(userJobName) ||
            (user.mainJob.level || 1) < (itemData.requiredLevel || 1)
          ) {
            return interaction.editReply(
              `❌ Bạn cần là một trong những nghề **${itemData.requiredJob.join(" hoặc ")}** (cấp **${itemData.requiredLevel || 1}**+) để mua vật phẩm này.`,
            );
          }
        }

        const totalCost = itemData.buyPrice * quantityToBuy;
        if (user.balance < totalCost) {
          return interaction.editReply(
            `❌ Bạn không đủ tiền! Cần **${totalCost.toLocaleString()} VNĐ** nhưng bạn chỉ có ${user.balance.toLocaleString()} VNĐ.`,
          );
        }

        // Thực hiện giao dịch
        user.balance -= totalCost;
        user.totalSpent = (user.totalSpent || 0) + totalCost;

        const currentInvQuantity = user.inventory?.get(itemIdToBuy) || 0;
        user.inventory.set(itemIdToBuy, currentInvQuantity + quantityToBuy);

        if (itemData.dailyBuyLimit !== null && itemData.dailyBuyLimit > 0) {
          const todayStr = getUTCDateString(new Date());
          let purchaseData = user.dailyPurchases?.get(itemIdToBuy);
          if (
            purchaseData &&
            getUTCDateString(new Date(purchaseData.lastPurchaseDate)) ===
              todayStr
          ) {
            purchaseData.count += quantityToBuy;
          } else {
            user.dailyPurchases.set(itemIdToBuy, {
              count: quantityToBuy,
              lastPurchaseDate: new Date(),
            });
          }
          user.markModified("dailyPurchases");
        }
        user.markModified("inventory");
        await user.save();

        Logger.info(
          `[Shop/Buy] User ${userId} bought ${quantityToBuy} of ${itemIdToBuy} for ${totalCost} VND.`,
        );
        await interaction.editReply(
          `✅ Bạn đã mua thành công **${quantityToBuy} ${itemData.name}** với giá **${totalCost.toLocaleString()} VNĐ**.\nSố dư mới: ${user.balance.toLocaleString()} VNĐ.`,
        );
      } else if (subcommand === "sell") {
        // <<<----- LOGIC TỪ src/commands/shop/sell.js ----->>>
        await interaction.deferReply({ ephemeral: true });
        if (!user)
          return interaction.editReply(
            "❌ Lỗi: Không tìm thấy dữ liệu của bạn để thực hiện giao dịch.",
          );

        const itemIdToSell = interaction.options
          .getString("item_id")
          .toLowerCase();
        const quantityToSell = interaction.options.getInteger("quantity") || 1;

        const itemData = await ShopItem.findOne({
          itemId: itemIdToSell,
        }).lean();

        if (!itemData) {
          return interaction.editReply(
            `❌ Không tìm thấy vật phẩm với ID \`${itemIdToSell}\` trong danh mục của shop.`,
          );
        }
        if (itemData.sellPrice === null || itemData.sellPrice === undefined) {
          return interaction.editReply(
            `❌ Vật phẩm **${itemData.name}** không thể bán lại cho cửa hàng.`,
          );
        }

        const currentInvQuantity = user.inventory?.get(itemIdToSell) || 0;
        if (currentInvQuantity < quantityToSell) {
          return interaction.editReply(
            `❌ Bạn không có đủ **${quantityToSell} ${itemData.name}** để bán. (Hiện có: ${currentInvQuantity})`,
          );
        }

        const totalGain = itemData.sellPrice * quantityToSell;
        user.balance += totalGain;
        user.totalEarned = (user.totalEarned || 0) + totalGain;

        const newInvQuantity = currentInvQuantity - quantityToSell;
        if (newInvQuantity <= 0) {
          user.inventory.delete(itemIdToSell);
        } else {
          user.inventory.set(itemIdToSell, newInvQuantity);
        }
        user.markModified("inventory");
        await user.save();

        Logger.info(
          `[Shop/Sell] User ${userId} sold ${quantityToSell} of ${itemIdToSell} for ${totalGain} VND.`,
        );
        await interaction.editReply(
          `✅ Bạn đã bán thành công **${quantityToSell} ${itemData.name}** và nhận được **${totalGain.toLocaleString()} VNĐ**.\nSố dư mới: ${user.balance.toLocaleString()} VNĐ.`,
        );
      } else if (subcommand === "inventory") {
        // <<<----- LOGIC TỪ src/commands/shop/inventory.js ----->>>
        await interaction.deferReply({ ephemeral: false }); // Inventory có thể public
        if (!user)
          return interaction.editReply("❌ Không tìm thấy dữ liệu của bạn.");

        if (!user.inventory || user.inventory.size === 0) {
          return interaction.editReply(
            "🎒 Túi đồ của bạn hiện đang trống trơn!",
          );
        }

        const inventoryEmbed = new EmbedBuilder()
          .setTitle(`🎒 Túi đồ của ${interaction.user.username}`)
          .setColor("Orange")
          .setTimestamp();

        let description = "";
        if (user.inventory.size > 0) {
          for (const [itemId, quantity] of user.inventory) {
            if (quantity > 0) {
              const itemInfo = await ShopItem.findOne({
                itemId: itemId,
              }).lean();
              const itemName = itemInfo
                ? itemInfo.name
                : `Vật phẩm (ID: ${itemId})`;
              description += `**${itemName}** (\`${itemId}\`) - Số lượng: **${quantity}**\n`;
            }
          }
        }

        if (!description) {
          // Nếu sau vòng lặp vẫn không có gì (do tất cả item có quantity = 0)
          description = "Túi đồ của bạn hiện đang trống trơn!";
        }
        inventoryEmbed.setDescription(description);
        await interaction.editReply({ embeds: [inventoryEmbed] });
      } else if (subcommand === "use") {
        // <<<----- LOGIC TỪ src/commands/shop/use.js ----->>>
        await interaction.deferReply({ ephemeral: false }); // Use item có thể public
        if (!user)
          return interaction.editReply(
            "❌ Lỗi: Không tìm thấy dữ liệu của bạn.",
          );

        const itemIdToUse = interaction.options
          .getString("item_id")
          .toLowerCase();
        const quantityToUse = interaction.options.getInteger("quantity") || 1;

        const itemData = await ShopItem.findOne({ itemId: itemIdToUse }).lean();

        if (!itemData) {
          return interaction.editReply(
            `❌ Không tìm thấy vật phẩm với ID: \`${itemIdToUse}\`.`,
          );
        }

        const userItemQuantity = user.inventory?.get(itemIdToUse) || 0;
        if (userItemQuantity < quantityToUse) {
          return interaction.editReply(
            `❌ Bạn không có đủ ${quantityToUse} **${itemData.name}** để sử dụng. (Hiện có: ${userItemQuantity})`,
          );
        }

        // --- Logic sử dụng vật phẩm ---
        let replyMessage = `✅ Bạn đã sử dụng **${quantityToUse} ${itemData.name}**.`;
        let itemConsumed = false; // Cờ để biết vật phẩm có thực sự bị tiêu hao không

        // 1. Kiểm tra yêu cầu nghề và level (nếu có)
        if (itemData.requiredJob && itemData.requiredJob.length > 0) {
          const reqJobs = itemData.requiredJob.map((job) => job.toLowerCase());
          const userJobName = user.mainJob?.name?.toLowerCase();
          const userJobLevel = user.mainJob?.level || 1;
          if (
            !userJobName ||
            !reqJobs.includes(userJobName) ||
            userJobLevel < (itemData.requiredLevel || 1)
          ) {
            return interaction.editReply(
              `❌ Bạn cần là **${itemData.requiredJob.join(" hoặc ")}** cấp **${itemData.requiredLevel || 1}**+ để sử dụng **${itemData.name}**.`,
            );
          }
        }

        // 2. Xử lý hiệu ứng (ví dụ: cooldownReduction)
        if (itemData.effects && itemData.effects.cooldownReduction) {
          const { targetTaskId, reductionTime } =
            itemData.effects.cooldownReduction;
          const totalReductionTime = (reductionTime || 0) * quantityToUse;

          if (
            targetTaskId &&
            totalReductionTime > 0 &&
            user.mainJob &&
            user.mainJob.name
          ) {
            const mainJobData = await MainJob.findOne({
              name: user.mainJob.name.toLowerCase(),
            }).lean();
            const taskData = mainJobData?.tasks?.find((t) =>
              Array.isArray(targetTaskId)
                ? targetTaskId
                    .map((tid) => tid.toLowerCase())
                    .includes(t.taskId.toLowerCase())
                : t.taskId.toLowerCase() === targetTaskId.toLowerCase(),
            );

            if (taskData) {
              const actualTaskIdToModify = taskData.taskId; // Lấy taskId chính xác từ taskData
              const taskCooldownMs = taskData.cooldown;
              const lastUsedTimestamp =
                user.mainJob.taskCooldowns?.get(actualTaskIdToModify) || 0;
              const now = Date.now();
              const elapsedSinceLastUse = now - lastUsedTimestamp;
              const remainingCooldown = Math.max(
                0,
                taskCooldownMs - elapsedSinceLastUse,
              );

              if (remainingCooldown > 0) {
                let newRemainingCooldown =
                  remainingCooldown - totalReductionTime;
                if (newRemainingCooldown < 0) newRemainingCooldown = 0;

                const newLastUsedTimestamp =
                  now - (taskCooldownMs - newRemainingCooldown);
                user.mainJob.taskCooldowns.set(
                  actualTaskIdToModify,
                  newLastUsedTimestamp,
                );
                user.markModified("mainJob.taskCooldowns");
                itemConsumed = true; // Đánh dấu vật phẩm đã có hiệu ứng

                const minutesReduced = Math.floor(totalReductionTime / 60000);
                const secondsReduced = Math.floor(
                  (totalReductionTime % 60000) / 1000,
                );
                replyMessage += `\n⏱️ Cooldown nhiệm vụ **${taskData.name}** đã giảm ${minutesReduced > 0 ? `${minutesReduced} phút ` : ""}${secondsReduced} giây!`;
                Logger.info(
                  `[Shop/Use] User ${userId} used ${quantityToUse} ${itemIdToUse}, reduced cooldown for ${actualTaskIdToModify} by ${totalReductionTime}ms.`,
                );
              } else {
                replyMessage += `\nℹ️ Nhiệm vụ **${taskData.name}** hiện không trong thời gian chờ nên không thể giảm cooldown. Vật phẩm không bị tiêu hao.`;
              }
            } else {
              replyMessage += `\n⚠️ Không tìm thấy thông tin nhiệm vụ \`${targetTaskId.join ? targetTaskId.join(", ") : targetTaskId}\` cho nghề của bạn. Vật phẩm không bị tiêu hao.`;
            }
          } else {
            replyMessage += `\nℹ️ Vật phẩm này không có hiệu ứng giảm cooldown hoặc bạn không có nghề phù hợp.`;
          }
        } else {
          replyMessage += `\nℹ️ Vật phẩm này không có hiệu ứng đặc biệt được định nghĩa.`;
        }
        // Thêm các loại effect khác ở đây nếu có (ví dụ: tăng XP, tiền, item đặc biệt)

        // 3. Tiêu hao vật phẩm nếu có hiệu ứng và consumable
        if (itemConsumed && itemData.consumable) {
          const newInvQuantity = userItemQuantity - quantityToUse;
          if (newInvQuantity <= 0) {
            user.inventory.delete(itemIdToUse);
          } else {
            user.inventory.set(itemIdToUse, newInvQuantity);
          }
          user.markModified("inventory");
          replyMessage += `\n🎒 Số lượng **${itemData.name}** còn lại: ${Math.max(0, newInvQuantity)}.`;
        } else if (!itemConsumed && itemData.consumable) {
          // Không làm gì nếu không có hiệu ứng và vật phẩm là consumable, vì đã thông báo ở trên
        }

        await user.save();
        await interaction.editReply(replyMessage);
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /shop ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      const errorMessage = "❌ Đã xảy ra lỗi khi xử lý lệnh cửa hàng.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for shop:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for shop:", e));
      }
    }
  },
};
