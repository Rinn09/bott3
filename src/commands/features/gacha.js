const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  inlineCode,
  StringSelectMenuBuilder, // Cho list-gacha-items
  StringSelectMenuOptionBuilder, // Cho list-gacha-items
} = require("discord.js");
const User = require("../../models/User");
const CarModel = require("../../models/CarModel");
const {
  PartDefinition,
  PartTypeEnum: PartSlotsEnumAliased,
} = require("../../models/PartDefinition"); // PartTypeEnum đã được alias ở đây
const ShopItem = require("../../models/ShopItem"); // Cho castrol-exchange
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");
const botConfig = require("../../config/botConfig"); // Cho roll
const {
  performWeightedRoll,
  performPityRoll,
} = require("../../utils/gachaUtil"); // Cho roll
// const { PartTypeEnum: PartSlotsEnum } = require("../../models/PartDefinition"); // Dòng này không cần nữa vì đã import ở trên và alias là PartSlotsEnumAliased
const PartSlotsEnum = PartSlotsEnumAliased; // Sử dụng alias đã import
const rollCooldown = new Map();

// --- Helper functions (di chuyển từ các file con nếu cần) ---
// Ví dụ: getUTCDateString từ roll.js
function getUTCDateString(date) {
  return date.toISOString().split("T")[0];
}
// Ví dụ: getStartOfWeek, toDateOnlyString từ castrol-exchange.js
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
function toDateOnlyString(date) {
  return date.toISOString().split("T")[0];
}
// Ví dụ: calculateUpgradeCost, formatStatModifiers từ car-upgrade.js
function calculateUpgradeCost(carRarity, partRarity) {
  const rarityCostMultiplier = {
    common: 1,
    uncommon: 1.5,
    rare: 2.5,
    epic: 4,
    legendary: 7,
    mythic: 12,
  };
  const baseCost = 500;
  const carMultiplier = rarityCostMultiplier[carRarity] || 1;
  const partMultiplier = rarityCostMultiplier[partRarity] || 1;
  return Math.floor(baseCost * ((carMultiplier + partMultiplier) / 1.5));
}
function formatStatModifiers(modifiers) {
  if (!modifiers) return "Không có";
  return Object.entries(modifiers)
    .filter(([, value]) => value !== 0)
    .map(
      ([key, value]) =>
        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value > 0 ? "+" : ""}${value}`,
    )
    .join(" | ");
}

// --- Constants (di chuyển từ các file con) ---
const TICKET_ITEM_ID_FOR_ROLL = "roll_ticket"; // Từ roll.js
const ITEMS_PER_PAGE_WAREHOUSE = 10; // Từ warehouse.js
const ITEMS_PER_PAGE_GACHA_LIST = 5; // Từ list-gacha-definitions.js
const CASTROL_COST_PER_TICKET_EXCHANGE = 50; // Từ castrol-exchange.js
const WEEKLY_TICKET_LIMIT_EXCHANGE = 10; // Từ castrol-exchange.js

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gacha")
    .setDescription("Các lệnh liên quan đến hệ thống Gacha, xe và phụ tùng.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("roll")
        .setDescription("Quay Gacha VNGarage bằng lượt miễn phí hoặc vé roll!"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list-items") // Đổi tên từ list-gacha-definitions
        .setDescription(
          "Xem danh sách các xe và phụ tùng trong hệ thống Gacha.",
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Chọn loại muốn xem (xe hoặc phụ tùng).")
            .setRequired(false)
            .addChoices(
              { name: "Chỉ Xe (Cars)", value: "cars" },
              { name: "Chỉ Phụ Tùng (Parts)", value: "parts" },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Số trang muốn xem.")
            .setMinValue(1)
            .setRequired(false),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("castrol")
        .setDescription("Quản lý và sử dụng điểm Castrol.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("exchange-view") // Gộp view vào đây
            .setDescription("Xem các vật phẩm có thể đổi bằng Castrol."),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("exchange-redeem") // Gộp redeem vào đây
            .setDescription("Đổi Castrol lấy vật phẩm.")
            .addStringOption((option) =>
              option
                .setName("item")
                .setDescription("Vật phẩm muốn đổi.")
                .setRequired(true)
                .addChoices(
                  // Cần cập nhật nếu có thêm item đổi bằng castrol
                  {
                    name: `Vé Roll Gacha (Cần ${CASTROL_COST_PER_TICKET_EXCHANGE} Castrol)`,
                    value: "roll_ticket",
                  },
                ),
            )
            .addIntegerOption((option) =>
              option
                .setName("quantity")
                .setDescription(
                  `Số lượng (Tối đa ${WEEKLY_TICKET_LIMIT_EXCHANGE} vé/tuần).`,
                )
                .setMinValue(1)
                .setRequired(false),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("garage")
        .setDescription(
          "Xem chi tiết từng chiếc xe trong garage của bạn hoặc người khác.",
        )
        .addUserOption((option) =>
          option.setName("user").setDescription("Người dùng muốn xem garage."),
        )
        .addIntegerOption((option) =>
          option
            .setName("index")
            .setDescription("Xem xe ở vị trí cụ thể (ví dụ: 1, 2...).")
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("warehouse")
        .setDescription("Xem kho chứa phụ tùng của bạn hoặc người khác.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Người dùng muốn xem kho phụ tùng."),
        )
        .addIntegerOption((option) =>
          option
            .setName("page")
            .setDescription("Số trang muốn xem.")
            .setMinValue(1),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("car")
        .setDescription("Quản lý xe trong garage của bạn.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("discard")
            .setDescription("Phá một chiếc xe không dùng đến trong garage.")
            .addStringOption((option) =>
              option
                .setName("car_instance_id")
                .setDescription(
                  "ID instance của xe bạn muốn phá (Xem trong /gacha garage).",
                )
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("upgrade")
            .setDescription("Lắp hoặc thay thế phụ tùng cho xe của bạn.")
            .addStringOption((option) =>
              option
                .setName("car_instance_id")
                .setDescription(
                  "ID instance của xe muốn nâng cấp (Xem trong /gacha garage).",
                )
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("part_slot")
                .setDescription("Vị trí (loại phụ tùng) bạn muốn lắp/thay thế.")
                .setRequired(true)
                .addChoices(
                  ...PartSlotsEnum.map((type) => ({
                    name: type.toUpperCase(),
                    value: type,
                  })),
                ),
            )
            .addStringOption((option) =>
              option
                .setName("part_instance_id")
                .setDescription(
                  "ID instance của phụ tùng muốn lắp (Xem trong /gacha warehouse).",
                )
                .setRequired(true),
            ),
        ),
    ),

  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // Xử lý các lệnh không có group trước
    if (subcommand === "roll") {
      await interaction.deferReply();
      const lastRoll = rollCooldown.get(userId);
      if (lastRoll && Date.now() - lastRoll < 700) {
        return interaction.editReply({
          content: "⏳ **Bạn đang roll quá nhanh!**",
          ephemeral: true,
        });
      }
      rollCooldown.set(userId, Date.now());
      const Rollsession = await mongoose.startSession();
      let rollResultData = null;
      let success = false;

      try {
        Rollsession.startTransaction(); // Bắt đầu transaction ở đây

        let user = await User.findOne({ userId, guildId }).session(Rollsession);
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
          const userTickets = user.inventory.get(TICKET_ITEM_ID_FOR_ROLL) || 0;
          if (userTickets > 0) {
            currentRollType = "Ticket";
            if (userTickets - 1 <= 0) {
              user.inventory.delete(TICKET_ITEM_ID_FOR_ROLL);
            } else {
              user.inventory.set(TICKET_ITEM_ID_FOR_ROLL, userTickets - 1);
            }
            // user.markModified("inventory"); // Không cần thiết nếu dùng Map.set/delete trực tiếp
            Logger.info(
              `[Gacha Roll] User ${userId} using a ticket. ${user.inventory.get(TICKET_ITEM_ID_FOR_ROLL) || 0} remaining.`,
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

        await user.save({ Rollsession });
        await Rollsession.commitTransaction();
        success = true; // Đánh dấu transaction thành công

        // Chuẩn bị dữ liệu để gửi embed SAU KHI session kết thúc
        rollResultData = {
          type: actualRollResult.type,
          item: actualRollResult.item,
          rollType: currentRollType,
          pityTriggered: currentPityTriggered,
          userPityRolls: user.gacha.pityRolls, // Pity sau khi roll
          userFreeRollsUsedToday: user.gacha.freeRollsUsedToday,
          userTicketsRemaining:
            user.inventory.get(TICKET_ITEM_ID_FOR_ROLL) || 0,
          MAX_DAILY_FREE_ROLLS: MAX_DAILY_FREE_ROLLS,
          item: itemAdded, // itemAdded giờ có thể là xe mới hoặc xe trùng (để hiển thị)
          receivedCastrol: receivedCastrol, // Thêm thông tin castrol
          userCastrolBalance: user.castrolBalance || 0,
        };
      } catch (error) {
        // Nếu transaction chưa được commit và đang active, thì abort
        if (Rollsession.inTransaction()) {
          await Rollsession.abortTransaction();
          Logger.info(`[Gacha Roll] Transaction aborted for user ${userId}.`);
        }
        Logger.error(`Lỗi lệnh /roll (User: ${userId}): ${error.message}`, {
          stack: error.stack,
        });
        await interaction.editReply({ content: `❌ ${error.message}` });
        return; // Thoát sớm nếu có lỗi
      } finally {
        await Rollsession.endSession();
        Logger.info(`[Gacha Roll] Session ended for user ${userId}.`);
      }

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
      return; // Kết thúc xử lý subcommand 'roll'
    } else if (subcommand === "list-items") {
      await interaction.deferReply();
      const typeFilter = interaction.options.getString("type");
      let requestedPage = interaction.options.getInteger("page") || 1;

      const generateEmbedAndComponents = async (page, currentTypeFilter) => {
        let items = [];
        let totalItems = 0;
        let itemTypeLabel = "Xe và Phụ tùng";

        const carQuery = CarModel.find().sort({ rarity: 1, name: 1 });
        const partQuery = PartDefinition.find().sort({ rarity: 1, name: 1 });

        if (currentTypeFilter === "cars") {
          items = await carQuery
            .skip((page - 1) * ITEMS_PER_PAGE_GACHA_LIST)
            .limit(ITEMS_PER_PAGE_GACHA_LIST)
            .lean();
          totalItems = await CarModel.countDocuments();
          itemTypeLabel = "Xe (Cars)";
        } else if (currentTypeFilter === "parts") {
          items = await partQuery
            .skip((page - 1) * ITEMS_PER_PAGE_GACHA_LIST)
            .limit(ITEMS_PER_PAGE_GACHA_LIST)
            .lean();
          totalItems = await PartDefinition.countDocuments();
          itemTypeLabel = "Phụ tùng (Parts)";
        } else {
          if (!currentTypeFilter) currentTypeFilter = "cars"; // Mặc định

          if (currentTypeFilter === "cars") {
            items = await carQuery
              .skip((page - 1) * ITEMS_PER_PAGE_GACHA_LIST)
              .limit(ITEMS_PER_PAGE_GACHA_LIST)
              .lean();
            totalItems = await CarModel.countDocuments();
            itemTypeLabel = "Xe (Cars)";
          } else {
            // currentTypeFilter === 'parts'
            items = await partQuery
              .skip((page - 1) * ITEMS_PER_PAGE_GACHA_LIST)
              .limit(ITEMS_PER_PAGE_GACHA_LIST)
              .lean();
            totalItems = await PartDefinition.countDocuments();
            itemTypeLabel = "Phụ tùng (Parts)";
          }
        }

        const totalPages =
          Math.ceil(totalItems / ITEMS_PER_PAGE_GACHA_LIST) || 1;
        if (page > totalPages) page = totalPages;
        if (page < 1 && totalPages > 0) page = 1;

        const embed = new EmbedBuilder()
          .setTitle(
            `🔧 Kho Gacha: ${itemTypeLabel} - Trang ${page}/${totalPages}`,
          )
          .setColor("#2ECC71")
          .setFooter({
            text: `Tổng cộng ${totalItems} ${itemTypeLabel.toLowerCase()}`,
          });

        if (!items.length) {
          embed.setDescription("Không tìm thấy định nghĩa nào phù hợp.");
        } else {
          items.forEach((item) => {
            if (item.modelId) {
              // Là CarModel
              embed.addFields({
                name: `🚗 ${item.name} (${item.modelId})`,
                value: `Hãng: ${item.brand || "N/A"} | Hiếm: ${item.rarity} | Stats: S${item.baseStats.speed}/A${item.baseStats.acceleration}/H${item.baseStats.handling}/D${item.baseStats.durability} | Weight: ${item.gachaWeight}`,
                inline: false,
              });
            } else if (item.partId) {
              // Là PartDefinition
              const stats = Object.entries(item.statModifiers)
                .filter(([, value]) => value !== 0)
                .map(
                  ([key, value]) =>
                    `${key.slice(0, 1).toUpperCase()}${value > 0 ? "+" : ""}${value}`,
                )
                .join(", ");
              embed.addFields({
                name: `⚙️ ${item.name} (${item.partId})`,
                value: `Loại: ${item.partType} | Hiếm: ${item.rarity} | Modifiers: ${stats || "Không có"} | Weight: ${item.gachaWeight}`,
                inline: false,
              });
            }
          });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("gacha_def_type_select")
          .setPlaceholder("Chọn loại để xem...")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Xem Tất Cả Xe")
              .setValue("cars")
              .setEmoji("🚗"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Xem Tất Cả Phụ Tùng")
              .setValue("parts")
              .setEmoji("⚙️"),
          );
        if (currentTypeFilter) {
          // Đặt giá trị hiện tại cho select menu nếu đã filter
          const currentOption = selectMenu.options.find(
            (opt) => opt.data.value === currentTypeFilter,
          );
          if (currentOption) currentOption.setDefault(true);
        }

        const paginationButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`gacha_def_prev_${currentTypeFilter || "all"}_${page}`)
            .setLabel("◀️ Trước")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
          new ButtonBuilder()
            .setCustomId(`gacha_def_next_${currentTypeFilter || "all"}_${page}`)
            .setLabel("Sau ▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages),
        );
        return {
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(selectMenu),
            paginationButtons,
          ],
          currentPage: page,
          totalPages,
          currentTypeFilter,
        };
      };

      const initialData = await generateEmbedAndComponents(
        requestedPage,
        typeFilter || "cars",
      ); // Mặc định là 'cars' nếu không có filter
      const message = await interaction.editReply(initialData);

      // Collector
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect | ComponentType.Button, // Lắng nghe cả select và button
        time: 5 * 60 * 1000, // 5 phút
      });

      let collectorPage = initialData.currentPage;
      let collectorTypeFilter = initialData.currentTypeFilter;

      collector.on("collect", async (i) => {
        await i.deferUpdate();
        let newPage = collectorPage;
        let newTypeFilter = collectorTypeFilter;

        if (i.isStringSelectMenu()) {
          // Xử lý chọn từ select menu
          newTypeFilter = i.values[0];
          newPage = 1; // Reset về trang 1 khi đổi filter
        } else if (i.isButton()) {
          // Xử lý nút pagination
          const [action, type, pageStr] = i.customId.split("_").slice(2); // Bỏ qua 'gacha_def'
          newPage = parseInt(pageStr);
          // type đã được lưu trong collectorTypeFilter rồi, nhưng có thể lấy lại từ button ID nếu cần
          if (action === "prev") newPage--;
          else if (action === "next") newPage++;
        }

        const newData = await generateEmbedAndComponents(
          newPage,
          newTypeFilter,
        );
        collectorPage = newData.currentPage;
        collectorTypeFilter = newData.currentTypeFilter; // Quan trọng: Cập nhật lại filter type
        await i.editReply(newData);
      });
      collector.on("end", async (collected, reason) => {
        if (reason !== "messageDelete") {
          const finalData = await generateEmbedAndComponents(
            collectorPage,
            collectorTypeFilter,
          );
          const disabledComponents = finalData.components.map((row) => {
            row.components.forEach((comp) => comp.setDisabled(true));
            return row;
          });
          try {
            await message.edit({ components: disabledComponents });
          } catch (error) {
            /* Bỏ qua lỗi nếu tin nhắn đã bị xóa */
          }
        }
      });
      return;
    } else if (subcommand === "garage") {
      const targetUserOption = interaction.options.getUser("user");
      const targetUser = targetUserOption || interaction.user;
      let carIndexToShow = (interaction.options.getInteger("index") || 1) - 1; // Chuyển sang 0-based index
      /*
      // Kiểm tra quyền nếu xem garage người khác
      if (
        targetUser.id !== interaction.user.id &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({
          content: "❌ Bạn không có quyền xem garage của người khác.",
          ephemeral: true,
        });
      }
        */
      await interaction.deferReply({
        ephemeral: !targetUserOption, // Sửa điều kiện ephemeral
      }); // Ephemeral nếu xem của chính mình và không có option user

      const generateCarEmbedAndButtons = async (
        userId,
        guildId,
        currentCarIndex,
      ) => {
        const user = await User.findOne({ userId, guildId });

        if (
          !user ||
          !user.garage ||
          !user.garage.cars ||
          user.garage.cars.length === 0
        ) {
          const emptyEmbed = new EmbedBuilder()
            .setColor("Grey")
            .setTitle(`Garage của ${targetUser.username}`)
            .setDescription(
              "🚗 Garage này trống trơn, không có chiếc xe nào cả!",
            );
          return {
            embeds: [emptyEmbed],
            components: [],
            currentCarInstance: null,
            carDefinition: null,
            totalCars: 0,
            currentIndex: -1,
          };
        }

        const userCars = user.garage.cars;
        const totalCars = userCars.length;

        if (currentCarIndex < 0) currentCarIndex = 0;
        if (currentCarIndex >= totalCars) currentCarIndex = totalCars - 1;

        const carInstance = userCars[currentCarIndex];
        if (!carInstance) {
          // Trường hợp hiếm
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("Không tìm thấy xe ở vị trí này.");
          return {
            embeds: [errorEmbed],
            components: [],
            currentCarInstance: null,
            carDefinition: null,
            totalCars,
            currentIndex: currentCarIndex,
          };
        }

        const carDefinition = await CarModel.findOne({
          modelId: carInstance.carModelId,
        }).lean();
        if (!carDefinition) {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `Lỗi: Không tìm thấy định nghĩa cho xe với model ID: ${carInstance.carModelId}`,
            );
          return {
            embeds: [errorEmbed],
            components: [],
            currentCarInstance: carInstance,
            carDefinition: null,
            totalCars,
            currentIndex: currentCarIndex,
          };
        }

        // --- Tính toán chỉ số hiện tại của xe (TẠM THỜI HIỂN THỊ BASE STATS) ---
        // Sẽ phức tạp hơn khi có phụ tùng. Hiện tại chỉ lấy baseStats.
        let currentStats = { ...(carDefinition.baseStats || {}) };
        let installedPartsInfo = "Chưa lắp phụ tùng nào.";

        if (
          user.garage.parts &&
          carInstance.installedParts &&
          carInstance.installedParts.size > 0
        ) {
          // Lấy danh sách các ID (dưới dạng String) của các PartInstance đang được lắp trên xe
          const installedPartInstanceIds_strings = Array.from(
            carInstance.installedParts.values(),
          ).map((id) => id.toString());

          // Lọc từ kho (user.garage.parts) những PartInstance có _id nằm trong danh sách trên
          const currentlyInstalledPartInstances = user.garage.parts.filter(
            (p_instance) =>
              installedPartInstanceIds_strings.includes(
                p_instance._id.toString(),
              ),
          );

          if (currentlyInstalledPartInstances.length > 0) {
            const partDefinitionIds = [
              ...new Set(
                currentlyInstalledPartInstances.map(
                  (p_instance) => p_instance.partDefinitionId,
                ),
              ),
            ];

            const partDefs = await PartDefinition.find({
              partId: { $in: partDefinitionIds },
            }).lean();
            const partDefMap = new Map(partDefs.map((pd) => [pd.partId, pd]));

            let partsTextArray = [];
            // Duyệt qua các PartInstance thực sự đang được lắp
            for (const installedPartInst of currentlyInstalledPartInstances) {
              const partDef = partDefMap.get(
                installedPartInst.partDefinitionId,
              );
              if (partDef) {
                // Tìm slot mà part này được lắp vào (dựa trên _id của PartInstance)
                let slotName = "Không rõ";
                for (const [
                  slot,
                  inst_id_from_car,
                ] of carInstance.installedParts.entries()) {
                  if (
                    inst_id_from_car.toString() ===
                    installedPartInst._id.toString()
                  ) {
                    slotName = slot;
                    break;
                  }
                }
                partsTextArray.push(
                  `**${slotName.toUpperCase()}**: ${partDef.name} (${partDef.rarity})`,
                );
                // Cộng dồn statModifiers
                if (partDef.statModifiers) {
                  // Kiểm tra statModifiers có tồn tại không
                  for (const [stat, value] of Object.entries(
                    partDef.statModifiers,
                  )) {
                    currentStats[stat] =
                      (currentStats[stat] || 0) + (value || 0);
                  }
                }
              }
            }
            if (partsTextArray.length > 0) {
              installedPartsInfo = partsTextArray.join("\n");
            } else {
              // Trường hợp này có thể xảy ra nếu installedParts có ID nhưng không tìm thấy PartInstance tương ứng trong kho
              // (Điều này không nên xảy ra nếu logic car-upgrade đúng)
              installedPartsInfo =
                "Lỗi: Không tìm thấy chi tiết phụ tùng đã lắp.";
              Logger.warn(
                `[Garage] Car ${carInstance._id} has installed part IDs but instances not found in user's parts.`,
              );
            }
          }
        }
        // --- Kết thúc tính toán chỉ số ---

        const rarityColor = {
          common: "#95a5a6",
          uncommon: "#2ecc71",
          rare: "#3498db",
          epic: "#9b59b6",
          legendary: "#f1c40f",
          mythic: "#e67e22",
        };
        const embed = new EmbedBuilder()
          .setColor(rarityColor[carDefinition.rarity] || "#3498DB")
          .setTitle(
            `🚗 ${carDefinition.name} ${carInstance.isDisplayed ? "⭐" : ""}`,
          )
          .setDescription(
            carDefinition.description || "Một chiếc xe tuyệt vời.",
          )
          .addFields(
            {
              name: "🆔 IDs",
              value: `Model: ${inlineCode(carDefinition.modelId)}\nInstance: ${inlineCode(carInstance._id.toString())}`,
            },
            {
              name: "📋 Thông Tin",
              value: `Hãng: ${carDefinition.brand || "N/A"}\nĐộ hiếm: ${carDefinition.rarity.toUpperCase()}`,
            },
            {
              name: "📊 Chỉ Số Hiện Tại",
              value: `Tốc độ: ${currentStats.speed !== undefined ? currentStats.speed : "N/A"}\nTăng tốc: ${currentStats.acceleration !== undefined ? currentStats.acceleration : "N/A"}\nXử lý: ${currentStats.handling !== undefined ? currentStats.handling : "N/A"}\nĐộ bền: ${currentStats.durability !== undefined ? currentStats.durability : "N/A"}`,
            }, // Thêm kiểm tra undefined
            {
              name: "🎨 Ngoại Hình",
              value: `Màu sơn: ${carInstance.cosmetics?.color || "#FFFFFF"}\nBiển số: ${carInstance.cosmetics?.licensePlate || "Chưa có"}`,
            },
            { name: "⚙️ Phụ Tùng Đã Lắp", value: installedPartsInfo }, // installedPartsInfo giờ sẽ đúng
          )
          .setFooter({
            text: `Xe ${currentCarIndex + 1}/${totalCars} | Garage của: ${targetUser.username}`,
          })
          .setTimestamp();

        if (carDefinition.imageUrl) {
          embed.setImage(carDefinition.imageUrl);
        }

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`garage_car_prev_${targetUser.id}_${currentCarIndex}`)
            .setLabel("◀️ Xe Trước")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentCarIndex === 0),
          new ButtonBuilder()
            .setCustomId(`garage_car_next_${targetUser.id}_${currentCarIndex}`)
            .setLabel("Xe Sau ▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentCarIndex >= totalCars - 1),
        );

        return {
          embeds: [embed],
          components: [buttons],
          currentCarInstance: carInstance,
          carDefinition,
          totalCars,
          currentIndex: currentCarIndex,
        };
      };

      // Hiển thị xe ban đầu
      const initialData = await generateCarEmbedAndButtons(
        targetUser.id,
        interaction.guild.id,
        carIndexToShow,
      );
      if (!initialData.currentCarInstance && initialData.totalCars === 0) {
        // Trường hợp garage trống
        return interaction.editReply({
          embeds: initialData.embeds,
          components: initialData.components,
        });
      }
      if (!initialData.currentCarInstance && initialData.totalCars > 0) {
        // Lỗi không tìm thấy xe cụ thể
        return interaction.editReply({
          embeds: initialData.embeds,
          components: [],
        });
      }

      const message = await interaction.editReply({
        embeds: initialData.embeds,
        components: initialData.components,
      });

      const filter = (i) => {
        // Người gọi lệnh hoặc người được xem garage (nếu khác người gọi) mới được tương tác
        const canInteract =
          i.user.id === interaction.user.id ||
          (targetUser.id !== interaction.user.id &&
            i.user.id === targetUser.id);
        return (
          canInteract &&
          (i.customId.startsWith(`garage_car_prev_${targetUser.id}_`) ||
            i.customId.startsWith(`garage_car_next_${targetUser.id}_`))
        );
      };

      const collector = message.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 5 * 60 * 1000,
      });

      let currentCollectedIndex = initialData.currentIndex;

      collector.on("collect", async (i) => {
        await i.deferUpdate();
        const parts = i.customId.split("_"); // garage_car_action_targetUserId_pageIndexOfButton
        const action = parts[2];
        // currentCollectedIndex đã được lưu từ lần hiển thị trước

        if (action === "prev") {
          currentCollectedIndex--;
        } else if (action === "next") {
          currentCollectedIndex++;
        }

        try {
          const newData = await generateCarEmbedAndButtons(
            targetUser.id,
            interaction.guild.id,
            currentCollectedIndex,
          );
          currentCollectedIndex = newData.currentIndex; // Cập nhật lại index sau khi hàm đã clamp giá trị
          await i.editReply({
            embeds: newData.embeds,
            components: newData.components,
          });
        } catch (error) {
          Logger.error(
            `[Garage Collector] Error updating car view: ${error.message}`,
            { stack: error.stack },
          );
          // Không cố editReply nữa nếu có lỗi ở đây, interaction có thể đã hỏng
        }
      });

      collector.on("end", async () => {
        try {
          // Lấy lại trạng thái cuối cùng của embed và disable nút
          const finalData = await generateCarEmbedAndButtons(
            targetUser.id,
            interaction.guild.id,
            currentCollectedIndex,
          );
          if (finalData.components && finalData.components.length > 0) {
            const disabledComponents = finalData.components.map((row) => {
              row.components.forEach((comp) => comp.setDisabled(true));
              return row;
            });
            await message
              .edit({ components: disabledComponents })
              .catch(() => {});
          } else {
            await message.edit({ components: [] }).catch(() => {}); // Xóa component nếu không có
          }
        } catch (error) {
          /* Bỏ qua lỗi nếu tin nhắn đã bị xóa hoặc không thể edit */
        }
      });
      return;
    } else if (subcommand === "warehouse") {
      const targetUserOption = interaction.options.getUser("user");
      const targetUser = targetUserOption || interaction.user;
      let requestedPage = interaction.options.getInteger("page") || 1;

      if (
        targetUser.id !== interaction.user.id &&
        !interaction.member.permissions.has(
          require("discord.js").PermissionFlagsBits.Administrator,
        )
      ) {
        return interaction.reply({
          content: "❌ Bạn không có quyền xem kho của người khác.",
          ephemeral: true,
        });
      }

      await interaction.deferReply({
        ephemeral: targetUser.id !== interaction.user.id && !targetUserOption,
      });

      const generateWarehouseEmbed = async (page, targetUserId) => {
        const user = await User.findOne({
          userId: targetUserId,
          guildId: interaction.guild.id,
        });

        if (
          !user ||
          !user.garage ||
          !user.garage.parts ||
          user.garage.parts.length === 0
        ) {
          return {
            embeds: [
              new EmbedBuilder()
                .setColor("#6666FF")
                .setTitle(`Kho Phụ Tùng của ${targetUser.username}`)
                .setDescription("🔧 Kho trống trơn, không có phụ tùng nào."),
            ],
            components: [],
            currentPage: 1,
            totalPages: 1,
          };
        }

        const userParts = user.garage.parts.filter(
          (p) => p.installedOnCar === null,
        );
        const totalParts = userParts.length;
        const totalPages =
          Math.ceil(totalParts / ITEMS_PER_PAGE_WAREHOUSE) || 1;

        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;

        const startIndex = (page - 1) * ITEMS_PER_PAGE_WAREHOUSE;
        const paginatedPartInstances = userParts.slice(
          startIndex,
          startIndex + ITEMS_PER_PAGE_WAREHOUSE,
        );

        // Lấy tất cả partDefinitionId cần thiết một lần
        const partDefinitionIds = [
          ...new Set(paginatedPartInstances.map((p) => p.partDefinitionId)),
        ];
        const partDefinitions = await PartDefinition.find({
          partId: { $in: partDefinitionIds },
        }).lean();
        const partDefMap = new Map(
          partDefinitions.map((def) => [def.partId, def]),
        );

        const embed = new EmbedBuilder()
          .setTitle(
            `🔩 Kho Phụ Tùng của ${targetUser.username} - Trang ${page}/${totalPages}`,
          )
          .setColor("#6666FF") // Màu xám cho kho
          .setFooter({ text: `Tổng cộng: ${totalParts} phụ tùng` });

        if (!paginatedPartInstances.length) {
          embed.setDescription("Không có phụ tùng nào ở trang này.");
        }

        for (const partInstance of paginatedPartInstances) {
          const definition = partDefMap.get(partInstance.partDefinitionId);
          let name = partInstance.partDefinitionId; // Fallback
          let details = `ID Instance: ${inlineCode(partInstance._id.toString())}\n`;

          if (definition) {
            name = definition.name;
            details += `Loại: ${definition.partType} | Hiếm: ${definition.rarity.toUpperCase()}\n`;
            const stats = Object.entries(definition.statModifiers)
              .filter(([, value]) => value !== 0)
              .map(
                ([key, value]) =>
                  `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value > 0 ? "+" : ""}${value}`,
              )
              .join(" | ");
            if (stats) details += `Modifiers: ${stats}`;
          } else {
            details += `(Lỗi: Không tìm thấy định nghĩa phụ tùng)`;
          }
          embed.addFields({
            name: `⚙️ ${name}`,
            value: details,
            inline: false,
          });
        }
        // Components cho pagination
        const paginationButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`warehouse_prev_${targetUser.id}_${page}`)
            .setLabel("◀️ Trước")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
          new ButtonBuilder()
            .setCustomId(`warehouse_next_${targetUser.id}_${page}`)
            .setLabel("Sau ▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages),
        );
        const components = totalPages > 1 ? [paginationButtons] : [];

        return { embeds: [embed], components, currentPage: page, totalPages };
      };

      const initialData = await generateWarehouseEmbed(
        requestedPage,
        targetUser.id,
      );
      const message = await interaction.editReply(initialData);

      if (initialData.totalPages <= 1) return; // Không cần collector nếu chỉ có 1 trang

      const filter = (i) =>
        (i.user.id === interaction.user.id ||
          (targetUser.id !== interaction.user.id &&
            i.user.id === targetUser.id)) &&
        (i.customId.startsWith(`warehouse_prev_${targetUser.id}_`) ||
          i.customId.startsWith(`warehouse_next_${targetUser.id}_`));
      const collector = message.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 5 * 60 * 1000,
      });

      let currentPage = initialData.currentPage;
      collector.on("collect", async (i) => {
        await i.deferUpdate();
        const parts = i.customId.split("_");
        const action = parts[1];

        if (action === "prev") currentPage--;
        else if (action === "next") currentPage++;

        const newData = await generateWarehouseEmbed(
          currentPage,
          targetUser.id,
        );
        currentPage = newData.currentPage; // Cập nhật lại trang hiện tại
        await i.editReply(newData);
      });

      collector.on("end", async () => {
        const finalData = await generateWarehouseEmbed(
          currentPage,
          targetUser.id,
        );
        if (finalData.components && finalData.components.length > 0) {
          const disabledComponents = finalData.components.map((row) => {
            row.components.forEach((comp) => comp.setDisabled(true));
            return row;
          });
          await message
            .edit({ components: disabledComponents })
            .catch(() => {});
        } else {
          await message.edit({ components: [] }).catch(() => {});
        }
      });
      return;
    }

    // Xử lý các subcommand group
    if (subcommandGroup === "castrol") {
      if (subcommand === "exchange-view") {
        const embed = new EmbedBuilder()
          .setTitle("🛢️ Cửa Hàng Quy Đổi Castrol 🛢️")
          .setColor("Aqua")
          .addFields(
            {
              name: `🎟️ Vé Roll Gacha (ID: ${TICKET_ITEM_ID_FOR_ROLL})`,
              value: `Đổi **${CASTROL_COST_PER_TICKET_EXCHANGE} Castrol** lấy 1 Vé Roll.\nGiới hạn đổi: **${WEEKLY_TICKET_LIMIT_EXCHANGE} vé/tuần**.`,
            },
            // Thêm các vật phẩm khác có thể đổi bằng Castrol ở đây
          )
          .setFooter({ text: "Dùng lệnh /castrol-exchange redeem để đổi." });
        return interaction.reply({ embeds: [embed] });
      } else if (subcommand === "exchange-redeem") {
        const itemToRedeem = interaction.options.getString("item");
        const quantityToRedeem =
          interaction.options.getInteger("quantity") || 1;

        if (itemToRedeem !== "roll_ticket") {
          return interaction.reply({
            content: "❌ Vật phẩm đổi không hợp lệ.",
            ephemeral: true,
          });
        }

        await interaction.deferReply({ ephemeral: true });
        const castrolSession = await mongoose.startSession();

        try {
          castrolSession.startTransaction();
          let user = await User.findOne({ userId, guildId }).session(
            castrolSession,
          );
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

          const totalCastrolNeeded =
            CASTROL_COST_PER_TICKET_EXCHANGE * quantityToRedeem;

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

          if (
            weeklyData.count + quantityToRedeem >
            WEEKLY_TICKET_LIMIT_EXCHANGE
          ) {
            throw new Error(
              `Bạn chỉ có thể đổi tối đa ${WEEKLY_TICKET_LIMIT_EXCHANGE} vé mỗi tuần. Tuần này bạn đã đổi ${weeklyData.count} vé.`,
            );
          }

          // Thực hiện đổi
          user.castrolBalance -= totalCastrolNeeded;
          const currentTickets =
            user.inventory.get(TICKET_ITEM_ID_FOR_ROLL) || 0;
          user.inventory.set(
            TICKET_ITEM_ID_FOR_ROLL,
            currentTickets + quantityToRedeem,
          );
          weeklyData.count += quantityToRedeem;

          user.markModified("gacha.weeklyTicketExchange");
          user.markModified("inventory");
          user.markModified("castrolBalance");

          await user.save({ castrolSession });
          await castrolSession.commitTransaction();

          await interaction.editReply(
            `✅ Bạn đã đổi thành công **${quantityToRedeem} Vé Roll Gacha** với **${totalCastrolNeeded} Castrol**.\nBạn đã đổi ${weeklyData.count}/${WEEKLY_TICKET_LIMIT_EXCHANGE} vé trong tuần này.`,
          );
          Logger.info(
            `[Castrol Exchange] User ${userId} redeemed ${quantityToRedeem} roll tickets for ${totalCastrolNeeded} castrol.`,
          );
        } catch (error) {
          if (castrolSession.inTransaction())
            await castrolSession.abortTransaction();
          Logger.error(
            `Lỗi /castrol-exchange redeem (User ${userId}): ${error.message}`,
            { stack: error.stack },
          );
          await interaction.editReply({ content: `❌ ${error.message}` });
        } finally {
          await castrolSession.endSession();
        }
        return;
      }
    } else if (subcommandGroup === "car") {
      if (subcommand === "discard") {
        await interaction.deferReply({ ephemeral: false });
        const carInstanceIdToDiscard =
          interaction.options.getString("car_instance_id");
        if (!mongoose.Types.ObjectId.isValid(carInstanceIdToDiscard)) {
          return interaction.editReply({
            content: "❌ ID instance của xe không hợp lệ.",
            ephemeral: true,
          });
        }
        // Đã xóa deferReply thứ hai ở đây

        let carDefForInfo;
        let castrolToRefund = 0;
        let discardFee = 0; // Thêm biến cho phí bỏ xe

        try {
          const user = await User.findOne({ userId, guildId });
          if (!user || !user.garage || !user.garage.cars) {
            throw new Error("Không tìm thấy dữ liệu garage của bạn.");
          }

          const carIndex = user.garage.cars.findIndex(
            (car) => car._id.toString() === carInstanceIdToDiscard,
          );
          if (carIndex === -1) {
            throw new Error(
              `Không tìm thấy xe với ID instance ${inlineCode(carInstanceIdToDiscard)} trong garage.`,
            );
          }
          const carInstanceToDiscard = user.garage.cars[carIndex];

          carDefForInfo = await CarModel.findOne({
            modelId: carInstanceToDiscard.carModelId,
          }).lean();
          if (!carDefForInfo) {
            throw new Error(
              `Lỗi: Không tìm thấy định nghĩa cho xe ${inlineCode(carInstanceToDiscard.carModelId)}.`,
            );
          }

          // --- START: Logic Tỷ Lệ Hoàn Trả Castrol Động và Phí Bỏ Xe ---
          const carRarity = carDefForInfo.rarity;
          let castrolRefundPercentage = 0.3; // Mặc định 30%

          switch (carRarity) {
            case "common":
              castrolRefundPercentage = 0.25; // 25%
              discardFee = 3000; // Phí bỏ xe common
              break;
            case "uncommon":
              castrolRefundPercentage = 0.3; // 30%
              discardFee = 10000; // Phí bỏ xe uncommon
              break;
            case "rare":
              castrolRefundPercentage = 0.35; // 35%
              discardFee = 20000; // Không phí cho rare trở lên
              break;
            case "epic":
              castrolRefundPercentage = 0.4; // 40%
              discardFee = 50000;
              break;
            case "legendary":
              castrolRefundPercentage = 0.45; // 45%
              discardFee = 100000;
              break;
            case "mythic":
              castrolRefundPercentage = 0.5; // 50%
              discardFee = 100000000;
              break;
            default:
              castrolRefundPercentage = 0.2; // Fallback
          }

          // Nếu bạn muốn thêm ảnh hưởng của "tình trạng xe" (sẽ phức tạp hơn và cần trường mới trong CarInstanceSchema)
          // Ví dụ: if (carInstanceToDiscard.condition && carInstanceToDiscard.condition < 50) castrolRefundPercentage *= 0.5;

          // Nếu bạn muốn thêm ảnh hưởng nghề nghiệp (cần check user.mainJob.name)
          // Ví dụ: if (user.mainJob?.name === 'thợ rã xe') castrolRefundPercentage += 0.1; // Thêm 10%

          castrolToRefund = Math.floor(
            (carDefForInfo.castrolValue || 0) * castrolRefundPercentage,
          );
          // --- END: Logic Tỷ Lệ Hoàn Trả Castrol Động và Phí Bỏ Xe ---

          // --- START: Logic Giới Hạn Bỏ Xe Mỗi Ngày (Tùy chọn) ---
          const MAX_DISCARDS_PER_DAY = 5; // Ví dụ: tối đa 5 lần bỏ xe mỗi ngày
          const today = new Date().toISOString().slice(0, 10); // Lấy ngày YYYY-MM-DD

          if (!user.cooldowns) user.cooldowns = {}; // Khởi tạo nếu chưa có
          if (!user.cooldowns.carDiscard) {
            user.cooldowns.carDiscard = { date: today, count: 0 };
          }

          if (user.cooldowns.carDiscard.date !== today) {
            // Nếu là ngày mới, reset count
            user.cooldowns.carDiscard.date = today;
            user.cooldowns.carDiscard.count = 0;
          }

          if (user.cooldowns.carDiscard.count >= MAX_DISCARDS_PER_DAY) {
            throw new Error(
              `Bạn đã đạt giới hạn ${MAX_DISCARDS_PER_DAY} lần phá xe trong ngày hôm nay.`,
            );
          }
          // --- END: Logic Giới Hạn Bỏ Xe Mỗi Ngày ---

          // Tạo nút xác nhận
          const confirmId = `confirm_discard_car_${carInstanceIdToDiscard}_${interaction.id}`;
          const cancelId = `cancel_discard_car_${interaction.id}`;
          const confirmButton = new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel(`Phá ${carDefForInfo.name}`)
            .setStyle(ButtonStyle.Danger);
          const cancelButton = new ButtonBuilder()
            .setCustomId(cancelId)
            .setLabel("Hủy")
            .setStyle(ButtonStyle.Secondary);
          const row = new ActionRowBuilder().addComponents(
            confirmButton,
            cancelButton,
          );

          let confirmationDescription = `Bạn có chắc chắn muốn phá chiếc **${carDefForInfo.name}** (ID: ${inlineCode(carInstanceIdToDiscard)}) không?\n\nBạn sẽ nhận lại: **${castrolToRefund.toLocaleString()} Castrol**.`;
          if (discardFee > 0) {
            confirmationDescription += `\nBạn sẽ bị trừ: **${discardFee.toLocaleString()} VNĐ** (phí xử lý).`;
          }
          confirmationDescription += `\n\n⚠️ **Lưu ý:**\n- Hành động này KHÔNG THỂ hoàn tác.\n- Các phụ tùng đã lắp trên xe này sẽ được **trả về kho** của bạn.`;

          const confirmEmbed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle(`🗑️ Xác Nhận phá Xe: ${carDefForInfo.name}`)
            .setDescription(confirmationDescription)
            .setThumbnail(carDefForInfo.imageUrl || null);

          const confirmationMessage = await interaction.editReply({
            embeds: [confirmEmbed],
            components: [row],
          });

          const filter = (i) =>
            i.user.id === interaction.user.id &&
            i.message.id === confirmationMessage.id;
          const buttonInteraction = await confirmationMessage
            .awaitMessageComponent({
              filter,
              componentType: ComponentType.Button,
              time: 60000,
            })
            .catch(() => null);

          if (!buttonInteraction || buttonInteraction.customId === cancelId) {
            return confirmationMessage.edit({
              // Không cần await ở đây
              content: "✅ Thao tác phá xe đã được hủy.",
              embeds: [],
              components: [],
            });
          }

          await buttonInteraction.deferUpdate();
          const discardsession = await mongoose.startSession();
          try {
            discardsession.startTransaction();
            // Lấy lại user data trong session để đảm bảo tính nhất quán
            let userInSession = await User.findOne({ userId, guildId }).session(
              discardsession,
            );
            if (!userInSession)
              throw new Error(
                "Lỗi dữ liệu người dùng khi thực hiện transaction.",
              );

            // Kiểm tra lại giới hạn bỏ xe trong transaction
            const currentDiscardDate =
              userInSession.cooldowns?.carDiscard?.date || "";
            let currentDiscardCount =
              userInSession.cooldowns?.carDiscard?.count || 0;

            if (currentDiscardDate !== today) {
              currentDiscardCount = 0; // Reset cho ngày mới trong transaction
            }
            if (currentDiscardCount >= MAX_DISCARDS_PER_DAY) {
              throw new Error(
                `Bạn đã đạt giới hạn ${MAX_DISCARDS_PER_DAY} lần phá xe trong ngày hôm nay (kiểm tra lại).`,
              );
            }

            // Xử lý phí bỏ xe
            if (discardFee > 0) {
              if (userInSession.balance < discardFee) {
                throw new Error(
                  `Bạn không đủ ${discardFee.toLocaleString()} VNĐ để trả phí phá xe.`,
                );
              }
              userInSession.balance -= discardFee;
              userInSession.totalSpent =
                (userInSession.totalSpent || 0) + discardFee;
              Logger.info(
                `[Car Discard] User ${userId} paid ${discardFee} VND discard fee for car ${carInstanceIdToDiscard}.`,
              );
            }

            const carToActuallyDiscardIndex =
              userInSession.garage.cars.findIndex(
                // Lấy index
                (car) => car._id.toString() === carInstanceIdToDiscard,
              );
            if (carToActuallyDiscardIndex === -1)
              // Kiểm tra lại một lần nữa trong transaction
              throw new Error("Xe không còn tồn tại trong garage để phá.");

            const carToActuallyDiscard =
              userInSession.garage.cars[carToActuallyDiscardIndex];

            // --- START: Xử lý isDisplayed ---
            if (carToActuallyDiscard.isDisplayed === true) {
              carToActuallyDiscard.isDisplayed = false;
              Logger.info(
                `[Car Discard] Car ${carInstanceIdToDiscard} was displayed, now set to not displayed.`,
              );
              // Không cần thông báo phức tạp ở đây, chỉ cần set lại là được.
              // Nếu muốn, có thể gửi một tin nhắn ephemeral riêng cho user sau.
            }
            // --- END: Xử lý isDisplayed ---

            let returnedPartsInfo = "Không có phụ tùng nào được trả về kho.";
            const returnedPartNames = [];

            if (
              carToActuallyDiscard.installedParts &&
              carToActuallyDiscard.installedParts.size > 0
            ) {
              const installedPartInstanceIdsOnCar = Array.from(
                carToActuallyDiscard.installedParts.values(),
              );

              for (const partInstanceId of installedPartInstanceIdsOnCar) {
                const partIndexInUserGarage =
                  userInSession.garage.parts.findIndex((p) =>
                    p._id.equals(partInstanceId),
                  );

                if (partIndexInUserGarage !== -1) {
                  userInSession.garage.parts[
                    partIndexInUserGarage
                  ].installedOnCar = null;
                  // Không cần xóa khỏi carToActuallyDiscard.installedParts vì cả CarInstance sẽ bị xóa
                  try {
                    const partDef = await PartDefinition.findOne({
                      partId:
                        userInSession.garage.parts[partIndexInUserGarage]
                          .partDefinitionId,
                    }).lean();
                    if (partDef) {
                      returnedPartNames.push(partDef.name);
                    } else {
                      returnedPartNames.push(
                        `ID: ${userInSession.garage.parts[partIndexInUserGarage].partDefinitionId}`,
                      );
                    }
                  } catch (e) {
                    Logger.error(
                      `[Car Discard] Error fetching PartDefinition for ${userInSession.garage.parts[partIndexInUserGarage].partDefinitionId}: ${e.message}`,
                    );
                    returnedPartNames.push(
                      `ID: ${userInSession.garage.parts[partIndexInUserGarage].partDefinitionId}`,
                    );
                  }
                } else {
                  Logger.warn(
                    `[Car Discard] PartInstance ID ${partInstanceId} found on car but not in user's garage.parts list for user ${userId}.`,
                  );
                }
              }
              if (returnedPartNames.length > 0) {
                returnedPartsInfo = `Các phụ tùng sau đã được trả về kho: ${returnedPartNames.join(", ")}.`;
              }
            }

            // Xóa xe khỏi garage
            userInSession.garage.cars.splice(carToActuallyDiscardIndex, 1);

            if (castrolToRefund > 0) {
              userInSession.castrolBalance =
                (userInSession.castrolBalance || 0) + castrolToRefund;
            }

            // Cập nhật lại cooldowns.carDiscard sau khi mọi thứ thành công
            if (
              !userInSession.cooldowns.carDiscard ||
              userInSession.cooldowns.carDiscard.date !== today
            ) {
              userInSession.cooldowns.carDiscard = { date: today, count: 1 };
            } else {
              userInSession.cooldowns.carDiscard.count += 1;
            }
            userInSession.markModified("cooldowns.carDiscard");

            userInSession.markModified("garage.cars");
            userInSession.markModified("garage.parts"); // Đánh dấu nếu có thay đổi ở đây
            if (castrolToRefund > 0)
              userInSession.markModified("castrolBalance");
            if (discardFee > 0) userInSession.markModified("balance");

            await userInSession.save({ discardsession });
            await discardsession.commitTransaction();

            let finalMessage = `♻️ Đã phá thành công xe **${carDefForInfo.name}** (ID: ${inlineCode(carInstanceIdToDiscard)}).`;
            finalMessage += `\n🛢️ Bạn nhận được: **${castrolToRefund.toLocaleString()} Castrol**.`;
            if (discardFee > 0) {
              finalMessage += `\n💸 Phí xử lý: **${discardFee.toLocaleString()} VNĐ** đã được trừ.`;
            }
            finalMessage += `\n🔩 ${returnedPartsInfo}`;

            const successEmbed = new EmbedBuilder()
              .setColor("DarkGreen")
              .setTitle(`♻️ phá Xe Thành Công!`)
              .setDescription(finalMessage) // Sử dụng finalMessage cho rõ ràng hơn
              .setTimestamp();

            await buttonInteraction.editReply({
              embeds: [successEmbed],
              components: [],
            });
            Logger.info(
              `[Car Discard] User ${userId} discarded car ${carInstanceIdToDiscard} (${carDefForInfo.name}). Received ${castrolToRefund} Castrol. Fee: ${discardFee}. Parts returned: ${returnedPartNames.join(", ")}. Discard count today: ${userInSession.cooldowns.carDiscard.count}.`,
            );
          } catch (dbError) {
            if (discardsession.inTransaction())
              await discardsession.abortTransaction();
            Logger.error(
              `Lỗi DB khi phá xe ${carInstanceIdToDiscard}: ${dbError.message}`,
              { stack: dbError.stack },
            );
            await buttonInteraction.editReply({
              // Sửa lại là buttonInteraction
              content: `❌ Đã xảy ra lỗi khi xử lý việc phá xe: ${dbError.message}`,
              embeds: [],
              components: [],
            });
          } finally {
            await discardsession.endSession();
          }
        } catch (error) {
          // Lỗi trước khi có button confirm hoặc trước transaction
          Logger.error(
            `Lỗi lệnh /car-discard (User ${userId}): ${error.message}`,
            {
              stack: error.stack,
            },
          );
          await interaction
            .editReply({
              content: `❌ Lỗi: ${error.message}`, // Hiển thị lỗi trực tiếp cho người dùng (nếu là lỗi từ logic của mình như giới hạn)
              embeds: [],
              components: [],
            })
            .catch(() => {}); // Bắt lỗi nếu editReply cũng lỗi
        }
        return;
      } else if (subcommand === "upgrade") {
        await interaction.deferReply({ ephemeral: false });
        const carInstanceIdToUpgrade =
          interaction.options.getString("car_instance_id");
        const partSlotToUpgrade = interaction.options.getString("part_slot");
        const partInstanceIdToInstall =
          interaction.options.getString("part_instance_id");

        if (
          !mongoose.Types.ObjectId.isValid(carInstanceIdToUpgrade) ||
          !mongoose.Types.ObjectId.isValid(partInstanceIdToInstall)
        ) {
          // interaction.reply đã được gọi ở trên nếu điều kiện này true, và có return.
          // Nếu điều kiện này false, deferReply ở trên đã chạy.
          // Không cần deferReply thứ hai ở đây.
          // await interaction.deferReply({ ephemeral: false }); // Xóa dòng này
          return interaction.reply({
            // Sửa: Nếu ID không hợp lệ, phải reply và return ngay. deferReply ở trên sẽ không được gọi.
            content: "❌ ID xe hoặc ID phụ tùng không hợp lệ.",
            ephemeral: true,
          });
        }

        // Nếu code chạy đến đây, nghĩa là ID hợp lệ và deferReply đầu tiên đã chạy.

        try {
          const user = await User.findOne({ userId, guildId });
          if (!user || !user.garage)
            throw new Error("Không tìm thấy dữ liệu garage của bạn.");

          const carIndex = user.garage.cars.findIndex(
            (car) => car._id.toString() === carInstanceIdToUpgrade,
          );
          if (carIndex === -1)
            throw new Error(
              `Không tìm thấy xe với ID instance ${inlineCode(carInstanceIdToUpgrade)}.`,
            );
          const carInstance = user.garage.cars[carIndex];

          const partToInstallIndex = user.garage.parts.findIndex(
            (part) => part._id.toString() === partInstanceIdToInstall,
          );
          if (partToInstallIndex === -1)
            throw new Error(
              `Không tìm thấy phụ tùng với ID instance ${inlineCode(partInstanceIdToInstall)}.`,
            );
          const partInstanceToInstall = user.garage.parts[partToInstallIndex];

          const carDef = await CarModel.findOne({
            modelId: carInstance.carModelId,
          }).lean();
          const partDefToInstall = await PartDefinition.findOne({
            partId: partInstanceToInstall.partDefinitionId,
          }).lean();

          if (!carDef)
            throw new Error(
              `Lỗi: Không tìm thấy định nghĩa cho xe ${inlineCode(carInstance.carModelId)}.`,
            );
          if (!partDefToInstall)
            throw new Error(
              `Lỗi: Không tìm thấy định nghĩa cho phụ tùng ${inlineCode(partInstanceToInstall.partDefinitionId)}.`,
            );

          if (partDefToInstall.partType !== partSlotToUpgrade) {
            throw new Error(
              `Phụ tùng **${partDefToInstall.name}** (loại ${partDefToInstall.partType}) không thể lắp vào slot **${partSlotToUpgrade.toUpperCase()}**.`,
            );
          }

          const upgradeCost = calculateUpgradeCost(
            carDef.rarity,
            partDefToInstall.rarity,
          );
          let oldPartReplacedInfo = "Chưa có phụ tùng nào ở slot này.";
          let oldPartStatsInfo = "";

          const oldPartInstanceIdInSlot =
            carInstance.installedParts.get(partSlotToUpgrade);
          if (oldPartInstanceIdInSlot) {
            const oldPartInstance = user.garage.parts.find((p) =>
              p._id.equals(oldPartInstanceIdInSlot),
            ); // Phụ tùng cũ vẫn ở trong kho
            if (oldPartInstance) {
              const oldPartDef = await PartDefinition.findOne({
                partId: oldPartInstance.partDefinitionId,
              }).lean();
              if (oldPartDef) {
                oldPartReplacedInfo = `**${oldPartDef.name}** (Loại: ${oldPartDef.partType}, Hiếm: ${oldPartDef.rarity})`;
                oldPartStatsInfo = formatStatModifiers(
                  oldPartDef.statModifiers,
                );
              }
            }
          }

          // Embed xác nhận
          const confirmEmbed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(`🔧 Xác Nhận Nâng Cấp Xe: ${carDef.name}`)
            .setDescription(
              `Bạn có muốn lắp phụ tùng **${partDefToInstall.name}** vào slot **${partSlotToUpgrade.toUpperCase()}** không?`,
            )
            .addFields(
              {
                name: "Xe Hiện Tại",
                value: `${carDef.name} (ID: ${inlineCode(carInstanceIdToUpgrade)})`,
              },
              {
                name: `⚙️ Phụ Tùng Mới (Lắp vào ${partSlotToUpgrade.toUpperCase()})`,
                value: `**${partDefToInstall.name}** (Loại: ${partDefToInstall.partType}, Hiếm: ${partDefToInstall.rarity})\nChỉ số: ${formatStatModifiers(partDefToInstall.statModifiers)}`,
              },
              {
                name: `🔩 Phụ Tùng Hiện Tại Ở Slot ${partSlotToUpgrade.toUpperCase()}`,
                value: `${oldPartReplacedInfo}${oldPartStatsInfo ? `\nChỉ số: ${oldPartStatsInfo}` : ""}`,
              },
              {
                name: "💸 Chi Phí Lắp Đặt",
                value: `${upgradeCost.toLocaleString()} VNĐ`,
              },
            )
            .setThumbnail(partDefToInstall.imageUrl || carDef.imageUrl || null);

          const confirmId = `confirm_upgrade_${interaction.id}`;
          const cancelId = `cancel_upgrade_${interaction.id}`;
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(confirmId)
              .setLabel("Xác Nhận Lắp")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(cancelId)
              .setLabel("Hủy Bỏ")
              .setStyle(ButtonStyle.Danger),
          );

          const confirmationMessage = await interaction.editReply({
            embeds: [confirmEmbed],
            components: [row],
          });

          const filter = (i) =>
            i.user.id === interaction.user.id &&
            i.message.id === confirmationMessage.id;
          const buttonInteraction = await confirmationMessage
            .awaitMessageComponent({
              filter,
              componentType: ComponentType.Button,
              time: 60000,
            })
            .catch(() => null);

          if (!buttonInteraction || buttonInteraction.customId === cancelId) {
            await confirmationMessage.edit({
              content: "❌ Thao tác nâng cấp đã được hủy bỏ.",
              embeds: [],
              components: [],
            });
            return;
          }

          await buttonInteraction.deferUpdate(); // Xác nhận nút đã được bấm

          // Bắt đầu transaction sau khi người dùng xác nhận
          const upgradeSession = await mongoose.startSession(); // Khởi tạo session ở đây
          try {
            upgradeSession.startTransaction();
            let userInSession = await User.findOne({ userId, guildId }).session(
              upgradeSession,
            );
            if (!userInSession)
              throw new Error(
                "Lỗi không tìm thấy dữ liệu người dùng trong transaction.",
              );

            const carIdx = userInSession.garage.cars.findIndex(
              (car) => car._id.toString() === carInstanceIdToUpgrade,
            );
            if (carIdx === -1)
              throw new Error("Xe không còn tồn tại trong garage.");
            let carInst = userInSession.garage.cars[carIdx];

            // Tìm PartInstance sẽ được lắp
            const partToInstallIdx = userInSession.garage.parts.findIndex(
              // Quan trọng: Tìm trong user.garage.parts
              (part) => part._id.toString() === partInstanceIdToInstall,
            );
            if (partToInstallIdx === -1)
              // Nếu không tìm thấy trong kho
              throw new Error(
                `Phụ tùng ${inlineCode(partInstanceIdToInstall)} không có trong kho của bạn hoặc đã được lắp vào xe khác.`,
              );

            const partInstToInstall =
              userInSession.garage.parts[partToInstallIdx];
            if (
              partInstToInstall.installedOnCar &&
              !partInstToInstall.installedOnCar.equals(carInst._id)
            ) {
              throw new Error(
                `Phụ tùng **${partDefToInstall.name}** (\`${partInstanceIdToInstall}\`) đang được lắp trên một chiếc xe khác.`,
              );
            }

            if (upgradeCost > 0) {
              if (userInSession.balance < upgradeCost)
                throw new Error(
                  `Bạn không đủ ${upgradeCost.toLocaleString()} VNĐ.`,
                );
              userInSession.balance -= upgradeCost;
            }

            // Xử lý phụ tùng cũ (nếu có)
            const oldPartInstanceIdInSlot =
              carInst.installedParts.get(partSlotToUpgrade);
            if (oldPartInstanceIdInSlot) {
              const oldPartInstIndex = userInSession.garage.parts.findIndex(
                (
                  p, // Tìm phụ tùng cũ trong kho
                ) => p._id.equals(oldPartInstanceIdInSlot),
              );
              if (oldPartInstIndex !== -1) {
                userInSession.garage.parts[oldPartInstIndex].installedOnCar =
                  null; // Đánh dấu là đã tháo
                Logger.info(
                  `[Car Upgrade] Part ${userInSession.garage.parts[oldPartInstIndex]._id} uninstalled from car ${carInst._id} slot ${partSlotToUpgrade}`,
                );
              }
            }

            // Lắp phụ tùng mới
            carInst.installedParts.set(
              partSlotToUpgrade,
              partInstToInstall._id,
            ); // Lưu ObjectId của PartInstance
            // Cập nhật trạng thái của PartInstance trong kho là đã được lắp vào xe này
            userInSession.garage.parts[partToInstallIdx].installedOnCar =
              carInst._id;
            Logger.info(
              `[Car Upgrade] Part ${partInstToInstall._id} installed on car ${carInst._id} slot ${partSlotToUpgrade}`,
            );

            userInSession.markModified("garage.cars");
            userInSession.markModified("garage.parts"); // Quan trọng: Vì ta đã thay đổi thuộc tính của một phần tử trong mảng parts
            if (upgradeCost > 0) userInSession.markModified("balance");

            await userInSession.save({ upgradeSession });
            await upgradeSession.commitTransaction();

            const finalEmbed = new EmbedBuilder()
              .setColor("Green")
              .setTitle(`✅ Nâng Cấp Thành Công!`)
              .setDescription(
                `Đã lắp **${partDefToInstall.name}** vào slot **${partSlotToUpgrade.toUpperCase()}** cho xe **${carDef.name}**.`,
              )
              .addFields(
                {
                  name: "Thông Tin Xe",
                  value: `ID Instance: ${inlineCode(carInstanceIdToUpgrade)}`,
                },
                {
                  name: `⚙️ Phụ Tùng Mới`,
                  value: `${partDefToInstall.name} (Hiếm: ${partDefToInstall.rarity}, Chỉ số: ${formatStatModifiers(partDefToInstall.statModifiers)})`,
                },
                { name: `🔩 Slot Cũ`, value: oldPartReplacedInfo },
                {
                  name: "💸 Chi Phí",
                  value: `${upgradeCost.toLocaleString()} VNĐ`,
                },
              )
              .setTimestamp();
            if (partDefToInstall.imageUrl)
              finalEmbed.setThumbnail(partDefToInstall.imageUrl);

            await buttonInteraction.editReply({
              embeds: [finalEmbed],
              components: [],
            });
            Logger.info(
              `[Car Upgrade SUCCESS] User ${userId} upgraded car ${carInstanceIdToUpgrade} slot ${partSlotToUpgrade} with part ${partInstanceIdToInstall}.`,
            );
          } catch (error) {
            if (upgradeSession.inTransaction())
              await upgradeSession.abortTransaction();
            Logger.error(
              `[Car Upgrade TRANSACTION_ERROR] User ${userId}: ${error.message}`,
              { stack: error.stack },
            );
            await buttonInteraction.editReply({
              content: `❌ Lỗi khi thực hiện nâng cấp: ${error.message}`,
              embeds: [],
              components: [],
            });
          } finally {
            await upgradeSession.endSession();
          }
        } catch (error) {
          // Lỗi trước khi có button confirm hoặc trước transaction
          Logger.error(
            `Lỗi lệnh /car-upgrade (User ${userId}): ${error.message}`,
            {
              stack: error.stack,
            },
          );
          await interaction.editReply({
            content: `❌ Lỗi: ${error.message}`,
            components: [],
          });
        }
        return;
      }
    }
  },
};
