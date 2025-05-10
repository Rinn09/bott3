// src/commands/gacha/roll.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const CarModel = require("../../models/CarModel");
const PartDefinition = require("../../models/PartDefinition");
const {
  performWeightedRoll,
  performPityRoll,
} = require("../../utils/gachaUtil");
const botConfig = require("../../config/botConfig");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

function getUTCDateString(date) {
  return date.toISOString().split("T")[0];
}

const TICKET_ITEM_ID = "roll_ticket";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Quay Gacha VNGarage bằng lượt miễn phí hoặc vé roll!"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    const session = await mongoose.startSession();

    let rollResultData = null; // Sẽ chứa { type, item, rollType, pityTriggered, finalCost, userPityRolls, userFreeRollsUsedToday, userTicketsRemaining }
    let success = false;

    try {
      session.startTransaction(); // Bắt đầu transaction ở đây

      let user = await User.findOne({ userId, guildId }).session(session);
      if (!user) {
        user = new User({ userId, guildId });
        user.gacha = {
          lastFreeRollDate: null,
          freeRollsUsedToday: 0,
          pityRolls: 0,
        };
        user.garage = { cars: [], parts: [] };
        user.inventory = new Map();
      } else {
        if (!user.gacha)
          user.gacha = {
            lastFreeRollDate: null,
            freeRollsUsedToday: 0,
            pityRolls: 0,
          };
        else {
          if (user.gacha.lastFreeRollDate === undefined)
            user.gacha.lastFreeRollDate = null;
          if (user.gacha.freeRollsUsedToday === undefined)
            user.gacha.freeRollsUsedToday = 0;
          if (user.gacha.pityRolls === undefined) user.gacha.pityRolls = 0;
        }
        if (!user.garage) user.garage = { cars: [], parts: [] };
        if (!user.inventory) user.inventory = new Map();
      }

      const now = new Date();
      const todayStr = getUTCDateString(now);
      const MAX_DAILY_FREE_ROLLS = 10;
      let currentRollType = "Ticket"; // Mặc định

      if (user.gacha.lastFreeRollDate !== todayStr) {
        user.gacha.freeRollsUsedToday = 0;
        user.gacha.lastFreeRollDate = todayStr;
      }

      if (user.gacha.freeRollsUsedToday < MAX_DAILY_FREE_ROLLS) {
        currentRollType = "Free";
        user.gacha.freeRollsUsedToday += 1;
        Logger.info(
          `[Gacha Roll] User ${userId} using free roll #${user.gacha.freeRollsUsedToday}/${MAX_DAILY_FREE_ROLLS}.`,
        );
      } else {
        const userTickets = user.inventory.get(TICKET_ITEM_ID) || 0;
        if (userTickets > 0) {
          currentRollType = "Ticket";
          if (userTickets - 1 <= 0) {
            user.inventory.delete(TICKET_ITEM_ID);
          } else {
            user.inventory.set(TICKET_ITEM_ID, userTickets - 1);
          }
          // user.markModified("inventory"); // Không cần thiết nếu dùng Map.set/delete trực tiếp
          Logger.info(
            `[Gacha Roll] User ${userId} using a ticket. ${user.inventory.get(TICKET_ITEM_ID) || 0} remaining.`,
          );
        } else {
          throw new Error(
            `Bạn đã hết ${MAX_DAILY_FREE_ROLLS} lượt roll miễn phí và không có \`Vé Roll Gacha\`. Mua từ \`/shop\` hoặc chờ ngày mai!`,
          );
        }
      }

      let currentPityRolls = user.gacha.pityRolls; // Pity trước khi roll
      user.gacha.pityRolls += 1;
      let currentPityTriggered = false;
      let actualRollResult;

      if (user.gacha.pityRolls >= botConfig.gacha.pityThreshold) {
        Logger.info(
          `[Gacha Roll] User ${userId} hit pity threshold (${user.gacha.pityRolls}/${botConfig.gacha.pityThreshold}). Forcing rare roll.`,
        );
        actualRollResult = await performPityRoll(
          botConfig.gacha.guaranteedRarities,
        );
        if (actualRollResult) {
          user.gacha.pityRolls = 0;
          currentPityTriggered = true;
        } else {
          Logger.warn(
            `[Gacha Roll] Pity roll failed for user ${userId}, attempting normal roll. Pity counter not reset.`,
          );
          actualRollResult = await performWeightedRoll();
          user.gacha.pityRolls = currentPityRolls + 1; // Giữ nguyên pity nếu pity roll fail
        }
      } else {
        actualRollResult = await performWeightedRoll();
        if (
          actualRollResult &&
          botConfig.gacha.guaranteedRarities.includes(
            actualRollResult.item.rarity,
          )
        ) {
          Logger.info(
            `[Gacha Roll] User ${userId} got rare+ item (${actualRollResult.item.rarity}) before pity. Resetting pity counter from ${user.gacha.pityRolls}.`,
          );
          user.gacha.pityRolls = 0;
        }
      }

      if (!actualRollResult) {
        throw new Error(
          "Không thể thực hiện roll vào lúc này. Lỗi hệ thống Gacha.",
        );
      }

      let receivedCastrol = 0;

      if (actualRollResult.type === "car") {
        const carDef = actualRollResult.item; // Đây là CarModel definition

        // Kiểm tra xem người dùng đã sở hữu xe này chưa (dựa trên carModelId)
        const existingCar = user.garage.cars.find(
          (car) => car.carModelId === carDef.modelId,
        );

        if (existingCar) {
          // Đã sở hữu xe này -> Quy đổi ra Castrol
          receivedCastrol = carDef.castrolValue || 1; // Lấy giá trị castrol, fallback về 1 nếu chưa set
          user.castrolBalance = (user.castrolBalance || 0) + receivedCastrol;
          itemAdded = carDef; // Vẫn là chiếc xe roll ra để hiển thị
          Logger.info(
            `[Gacha Roll] User ${userId} received DUPLICATE CAR: ${itemAdded.name} (${itemAdded.modelId}). Converted to ${receivedCastrol} Castrol.`,
          );
        } else {
          // Xe mới, chưa sở hữu -> Thêm vào garage
          const newCarInstance = {
            carModelId: carDef.modelId,
            acquiredAt: new Date(),
          };
          user.garage.cars.push(newCarInstance);
          itemAdded = carDef;
          Logger.info(
            `[Gacha Roll] User ${userId} received NEW CAR: ${itemAdded.name} (${itemAdded.modelId})`,
          );
        }
        user.markModified("garage"); // Đánh dấu nếu cars array thay đổi
      } else if (actualRollResult.type === "part") {
        // Phụ tùng trùng vẫn thêm vào như bình thường
        const newPartInstance = {
          partDefinitionId: actualRollResult.item.partId,
          acquiredAt: new Date(),
        };
        user.garage.parts.push(newPartInstance);
        itemAdded = actualRollResult.item;
        user.markModified("garage");
        Logger.info(
          `[Gacha Roll] User ${userId} received PART: ${itemAdded.name} (${actualRollResult.item.partId})`,
        );
      }

      user.markModified("gacha"); // Quan trọng khi object con thay đổi
      user.markModified("garage");
      user.markModified("inventory");

      if (receivedCastrol > 0) user.markModified("castrolBalance");

      await user.save({ session });
      await session.commitTransaction();
      success = true; // Đánh dấu transaction thành công

      // Chuẩn bị dữ liệu để gửi embed SAU KHI session kết thúc
      rollResultData = {
        type: actualRollResult.type,
        item: actualRollResult.item,
        rollType: currentRollType,
        pityTriggered: currentPityTriggered,
        userPityRolls: user.gacha.pityRolls, // Pity sau khi roll
        userFreeRollsUsedToday: user.gacha.freeRollsUsedToday,
        userTicketsRemaining: user.inventory.get(TICKET_ITEM_ID) || 0,
        MAX_DAILY_FREE_ROLLS: MAX_DAILY_FREE_ROLLS,
        item: itemAdded, // itemAdded giờ có thể là xe mới hoặc xe trùng (để hiển thị)
        receivedCastrol: receivedCastrol, // Thêm thông tin castrol
        userCastrolBalance: user.castrolBalance || 0,
      };
    } catch (error) {
      // Nếu transaction chưa được commit và đang active, thì abort
      if (session.inTransaction()) {
        await session.abortTransaction();
        Logger.info(`[Gacha Roll] Transaction aborted for user ${userId}.`);
      }
      Logger.error(`Lỗi lệnh /roll (User: ${userId}): ${error.message}`, {
        stack: error.stack,
      });
      await interaction.editReply({ content: `❌ ${error.message}` });
      return; // Thoát sớm nếu có lỗi
    } finally {
      await session.endSession();
      Logger.info(`[Gacha Roll] Session ended for user ${userId}.`);
    }

    // Chỉ gửi Embed nếu transaction thành công
    if (success && rollResultData) {
      try {
        const rarityColors = {
          common: "#95a5a6",
          uncommon: "#2ecc71",
          rare: "#3498db",
          epic: "#9b59b6",
          legendary: "#f1c40f",
          mythic: "#e67e22",
        };
        const rarityEmojis = {
          common: "⚪",
          uncommon: "🟢",
          rare: "🔵",
          epic: "🟣",
          legendary: "🟡",
          mythic: "🟠",
        };

        // KHỞI TẠO ĐÚNG CÁCH
        const resultEmbed = new EmbedBuilder().setTimestamp(); // Gọi .setTimestamp() trên instance EmbedBuilder

        let title = `🎉 ${rollResultData.pityTriggered ? "✨ PITY! " : ""}Bạn đã roll ra ${rollResultData.type === "car" ? "SIÊU XE" : "PHỤ TÙNG"}!`;

        if (rollResultData.receivedCastrol > 0) {
          title = `♻️ Xe trùng! Bạn nhận được ${rollResultData.receivedCastrol} Castrol!`;
          resultEmbed.setColor("Orange"); // Gọi .setColor() trên instance EmbedBuilder
        } else {
          resultEmbed.setColor(
            // Gọi .setColor() trên instance EmbedBuilder
            rarityColors[rollResultData.item.rarity] || "#ffffff",
          );
        }
        resultEmbed.setTitle(title); // Gọi .setTitle()

        let itemDetails = `**${rollResultData.item.name}**\n`;
        itemDetails += `Độ hiếm: **${rollResultData.item.rarity.toUpperCase()}** ${rarityEmojis[rollResultData.item.rarity] || ""}\n`;

        if (rollResultData.type === "car") {
          if (rollResultData.item.brand)
            itemDetails += `Hãng: ${rollResultData.item.brand}\n`;
          if (rollResultData.item.description)
            itemDetails += `Mô tả: *${rollResultData.item.description}*\n`;

          if (rollResultData.item.baseStats) {
            // Luôn kiểm tra trước khi truy cập
            const carStats = rollResultData.item.baseStats;
            itemDetails +=
              `\n**Chỉ số gốc:**\n` +
              `🏎️ Tốc độ: ${carStats.speed}\n` +
              `💨 Tăng tốc: ${carStats.acceleration}\n` +
              `🔄 Xử lý: ${carStats.handling}\n` +
              `🛡️ Độ bền: ${carStats.durability}`;
          } else {
            itemDetails += `\n**Chỉ số gốc:** Không có thông tin.`;
          }
        } else if (rollResultData.type === "part") {
          itemDetails += `Loại phụ tùng: ${rollResultData.item.partType}\n`;
          if (rollResultData.item.statModifiers) {
            // Luôn kiểm tra
            const stats = Object.entries(rollResultData.item.statModifiers)
              .filter(([, value]) => value !== 0)
              .map(
                ([key, value]) =>
                  `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value > 0 ? "+" : ""}${value}`,
              )
              .join(" | ");
            if (stats) itemDetails += `Chỉ số cộng thêm: ${stats}\n`;
          }
          if (rollResultData.item.description)
            itemDetails += `Mô tả: *${rollResultData.item.description}*\n`;
        }
        resultEmbed.setDescription(itemDetails);

        if (rollResultData.item.imageUrl) {
          resultEmbed.setImage(rollResultData.item.imageUrl);
        }

        let footerText = `Roll: ${rollResultData.rollType}`;
        if (rollResultData.rollType === "Free") {
          footerText += ` (${rollResultData.userFreeRollsUsedToday}/${rollResultData.MAX_DAILY_FREE_ROLLS})`;
        }
        footerText += ` | Pity: ${rollResultData.userPityRolls}/${botConfig.gacha.pityThreshold}`;
        if (rollResultData.rollType === "Ticket") {
          footerText += ` | Vé còn lại: ${rollResultData.userTicketsRemaining}`;
        }
        if (rollResultData.receivedCastrol > 0) {
          footerText += ` | Castrol hiện có: ${rollResultData.userCastrolBalance}`;
        }
        resultEmbed.setFooter({ text: footerText });

        await interaction.editReply({ embeds: [resultEmbed] });
      } catch (embedError) {
        Logger.error(
          `[Gacha Roll] Error sending success embed for user ${userId}: ${embedError.message}`,
          { stack: embedError.stack },
        );
        await interaction
          .editReply({
            content:
              "Bạn đã roll thành công! Lỗi hiển thị kết quả, vui lòng kiểm tra /garage.",
          })
          .catch(() => {});
      }
    }
  },
};
