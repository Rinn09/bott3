const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  inlineCode,
  ChannelType,
} = require("discord.js");
const User = require("../../models/User");
const CarModel = require("../../models/CarModel");
const RaceDefinition = require("../../models/RaceDefinition");
const NpcRacer = require("../../models/NPCRacer");
const RepairOrder = require("../../models/RepairOrder");
const GuildConfig = require("../../models/GuildConfig");
const raceSimulator = require("../../utils/raceSimulator");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");
const { checkLevelUp } = require("../../utils/levelUtil");
const { getRandomInt } = require("../../utils/gameUtils");
const MainJob = require("../../models/MainJob");
const RaceTelemetry = require("../../utils/raceTelemetry");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("race")
    .setDescription("Tham gia vào các cuộc đua xe đỉnh cao!")
    .addSubcommandGroup((group) =>
      group
        .setName("repair")
        .setDescription(
          "Quản lý việc sửa chữa xe của bạn hoặc nhận việc sửa xe.",
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("request")
            .setDescription(
              "Chủ xe: Tạo yêu cầu sửa chữa cho một chiếc xe bị hỏng.",
            )
            .addStringOption((option) =>
              option
                .setName("car_instance_id")
                .setDescription("ID instance của xe cần sửa (Bắt buộc).")
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName("reward")
                .setDescription("Số VNĐ bạn muốn trả cho thợ sửa xe.")
                .setRequired(true)
                .setMinValue(1000),
            )
            .addIntegerOption((option) =>
              option
                .setName("deadline_hours")
                .setDescription(
                  "Thời gian tối đa (giờ) để thợ hoàn thành sửa chữa (1-72 giờ).",
                )
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(72),
            )
            .addStringOption((option) =>
              option
                .setName("notes")
                .setDescription("Ghi chú thêm cho thợ (tối đa 150 ký tự).")
                .setRequired(false)
                .setMaxLength(150),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("view-orders")
            .setDescription(
              "Xem danh sách các đơn sửa xe đang chờ hoặc đang thực hiện.",
            )
            .addStringOption((option) =>
              option
                .setName("status_filter")
                .setDescription("Lọc theo trạng thái đơn (mặc định: pending).")
                .setRequired(false)
                .addChoices(
                  { name: "Đang chờ (Pending)", value: "pending" },
                  {
                    name: "Đã chấp nhận/Đang làm (Accepted/In Progress)",
                    value: "accepted_inprogress",
                  },
                  { name: "Đã hoàn thành (Completed)", value: "completed" },
                  { name: "Đơn của tôi (Chủ xe)", value: "my_owner_orders" },
                  { name: "Đơn tôi nhận sửa (Thợ)", value: "my_mechanic_jobs" },
                ),
            )
            .addIntegerOption((option) =>
              option
                .setName("page")
                .setDescription(
                  "Số trang để xem (mặc định 1, mỗi trang 5 đơn).",
                )
                .setMinValue(1)
                .setRequired(false),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("accept")
            .setDescription("Thợ sửa xe: Nhận một đơn sửa chữa đang chờ.")
            .addStringOption((option) =>
              option
                .setName("order_id")
                .setDescription(
                  "ID của đơn sửa chữa bạn muốn nhận (Xem trong /race repair view-orders).",
                )
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("complete")
            .setDescription(
              "Thợ sửa xe: Đánh dấu một đơn sửa chữa đã hoàn thành.",
            )
            .addStringOption((option) =>
              option
                .setName("order_id")
                .setDescription("ID của đơn sửa chữa bạn đã hoàn thành.")
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption((option) =>
              option
                .setName("mechanic_notes")
                .setDescription("Ghi chú của thợ về việc sửa chữa (nếu có).")
                .setRequired(false)
                .setMaxLength(150),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("cancel")
            .setDescription(
              "Chủ xe: Hủy một yêu cầu sửa chữa của bạn (nếu chưa có thợ nhận).",
            )
            .addStringOption((option) =>
              option
                .setName("order_id")
                .setDescription("ID của đơn sửa chữa bạn muốn hủy.")
                .setRequired(true)
                .setAutocomplete(true),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("challenge")
        .setDescription("Thách đấu đua xe với một người chơi khác.")
        .addUserOption((option) =>
          option
            .setName("opponent")
            .setDescription("Người bạn muốn thách đấu.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("your_car_id")
            .setDescription(
              "ID instance xe bạn muốn sử dụng để thách đấu (Lấy từ /gacha garage).",
            )
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("bet_amount")
            .setDescription("Số VNĐ bạn muốn cược cho trận đấu này.")
            .setRequired(true)
            .setMinValue(1000),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start-npc")
        .setDescription("Bắt đầu một cuộc đua với NPC.")
        .addStringOption((option) =>
          option
            .setName("car_instance_id")
            .setDescription(
              "ID instance của xe bạn muốn sử dụng (Xem trong /gacha garage).",
            )
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("tournament_id")
            .setDescription(
              "ID của giải đấu NPC bạn muốn tham gia (Để trống sẽ hiện danh sách).",
            )
            .setRequired(false),
        ),
    ),

  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(false);
    let choices = [];
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      if (subcommandGroup === "repair") {
        const user = await User.findOne({ userId, guildId }).lean();
        if (!user) return interaction.respond([]);

        if (
          subcommand === "request" &&
          focusedOption.name === "car_instance_id"
        ) {
          if (user.garage && user.garage.cars) {
            const carsNeedingRepair = user.garage.cars.filter(
              (car) =>
                car.status === "needs_repair" ||
                (car.status === "ready" && car.durability < 90),
            );
            if (carsNeedingRepair.length > 0) {
              const modelIds = [
                ...new Set(carsNeedingRepair.map((car) => car.carModelId)),
              ];
              const carModels = await CarModel.find({
                modelId: { $in: modelIds },
              }).lean();
              const carModelMap = new Map(
                carModels.map((cm) => [cm.modelId, cm]),
              );
              choices = carsNeedingRepair
                .map((carInst) => {
                  const carModel = carModelMap.get(carInst.carModelId);
                  return {
                    name: `${carModel ? carModel.name : "Xe Lỗi"} (ID: ${carInst._id.toString().slice(-6)}, Bền: ${carInst.durability}%)`,
                    value: carInst._id.toString(),
                  };
                })
                .slice(0, 25);
            }
          }
        } else if (
          (subcommand === "accept" ||
            subcommand === "complete" ||
            subcommand === "cancel") &&
          focusedOption.name === "order_id"
        ) {
          let query = { guildId };
          if (subcommand === "accept") {
            query.status = "pending";
          } else if (subcommand === "complete") {
            query.mechanicId = userId;
            query.status = { $in: ["accepted", "in_progress"] };
          } else if (subcommand === "cancel") {
            query.ownerId = userId;
            query.status = "pending";
          }

          const orders = await RepairOrder.find(query)
            .sort({ createdAt: -1 })
            .limit(25)
            .lean();
          choices = orders.map((order) => ({
            name: `Đơn #${order._id.toString().slice(-6)} - Xe: ${order.carModelName} (Thợ: ${order.mechanicId ? "Đã có" : "Chưa có"}) - Lời: ${order.offeredReward.toLocaleString()} VNĐ`,
            value: order._id.toString(),
          }));
        }
      } else if (focusedOption.name === "car_instance_id") {
        const user = await User.findOne({ userId, guildId }).lean();
        if (user && user.garage && user.garage.cars) {
          const readyCars = user.garage.cars.filter(
            (car) => car.status === "ready" && car.durability > 20,
          );
          if (readyCars.length > 0) {
            const modelIds = [
              ...new Set(readyCars.map((car) => car.carModelId)),
            ];
            const carModels = await CarModel.find({
              modelId: { $in: modelIds },
            }).lean();
            const carModelMap = new Map(
              carModels.map((cm) => [cm.modelId, cm]),
            );

            choices = readyCars
              .map((carInstance) => {
                const carModel = carModelMap.get(carInstance.carModelId);
                const rawName = `${carModel ? carModel.name : "Xe không rõ"} (ID: ${carInstance._id.toString().slice(-6)}, Bền: ${carInstance.durability}%)`;
                return {
                  name: rawName.substring(0, 100),
                  value: carInstance._id.toString(),
                };
              })
              .slice(0, 25);
          }
        }
      } else if (focusedOption.name === "tournament_id") {
        const userForLevelCheck = await User.findOne({
          userId,
          guildId,
        }).lean();
        const userLevel = userForLevelCheck?.level || 1;

        const tournaments = await RaceDefinition.find({
          type: { $in: ["NPC_SOLO_CHALLENGE", "NPC_TOURNAMENT_BRACKET"] },
          requiredLevel: { $lte: userLevel },
        })
          .limit(25)
          .lean();

        choices = tournaments.map((tour) => {
          let requirementText = tour.carRequirements?.rarity
            ? `YC: ${tour.carRequirements.rarity}`
            : "YC: Mọi loại";
          if (tour.carRequirements?.minTotalStats)
            requirementText += `, Stats >= ${tour.carRequirements.minTotalStats}`;
          const rawName = `${tour.name} (Khó: ${tour.difficulty}, Phí: ${tour.entryFee || 0} VNĐ, ${requirementText})`;
          return {
            name: rawName.substring(0, 100),
            value: tour.tournamentId,
          };
        });
      }
    } catch (error) {
      Logger.error(
        `[Autocomplete Error] /race ${subcommandGroup || ""} ${subcommand} ${focusedOption.name}: ${error.message}`,
      );
    }

    const filtered = choices
      .filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      )
      .slice(0, 25);
    await interaction
      .respond(filtered)
      .catch((err) =>
        Logger.error(`Error in autocomplete respond: ${err.message}`),
      );
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    let initialReplySent = false;

    if (subcommandGroup === "repair") {
      const repairSession = await mongoose.startSession();
      try {
        await interaction.deferReply({ ephemeral: true });
        repairSession.startTransaction();

        const player = await User.findOne({ userId, guildId }).session(
          repairSession,
        );
        if (!player) {
          await repairSession.abortTransaction();
          repairSession.endSession();
          return interaction.editReply(
            "❌ Không tìm thấy dữ liệu người chơi của bạn. Hãy thử tương tác với bot trước.",
          );
        }

        if (subcommand === "request") {
          const carIdString = interaction.options.getString("car_instance_id");
          const rewardAmount = interaction.options.getInteger("reward");
          const deadlineHours =
            interaction.options.getInteger("deadline_hours");
          const notes = interaction.options.getString("notes");

          if (!mongoose.Types.ObjectId.isValid(carIdString)) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ ID xe không hợp lệ. Bạn có thể lấy ID từ lệnh `/gacha garage`.",
            );
          }
          const carToRepairObjectId = new mongoose.Types.ObjectId(carIdString);
          const carToRepair = player.garage.cars.id(carToRepairObjectId);

          if (!carToRepair) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Không tìm thấy xe này trong garage của bạn.",
            );
          }

          const carModel = await CarModel.findOne({
            modelId: carToRepair.carModelId,
          }).lean();
          if (!carModel) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Lỗi: Không tìm thấy định nghĩa mẫu xe.",
            );
          }

          if (
            carToRepair.status === "repair_requested" ||
            carToRepair.status === "under_repair"
          ) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              `❌ Xe **${carModel.name}** (ID: ...${carIdString.slice(-6)}) đã có yêu cầu sửa hoặc đang được sửa.`,
            );
          }

          if (carToRepair.durability >= 95 && carToRepair.status === "ready") {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              `❌ Xe **${carModel.name}** (Bền: ${carToRepair.durability}%) chưa thực sự cần sửa chữa lúc này.`,
            );
          }

          if (player.balance < rewardAmount) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              `❌ Bạn không đủ ${rewardAmount.toLocaleString()} VNĐ để trả thù lao (cần thanh toán trước).`,
            );
          }

          // Trừ tiền và cập nhật trạng thái xe
          player.balance -= rewardAmount;
          player.totalSpent = (player.totalSpent || 0) + rewardAmount;
          carToRepair.status = "repair_requested";

          const newOrder = new RepairOrder({
            ownerId: userId,
            guildId: guildId,
            carInstanceId: carToRepair._id,
            carModelName: carModel.name,
            currentDurability: carToRepair.durability,
            offeredReward: rewardAmount,
            maxCompletionTimeHours: deadlineHours,
            notesFromOwner: notes,
          });

          await newOrder.save({ session: repairSession });
          await player.save({ session: repairSession });

          // Lấy kênh thông báo đơn sửa xe
          const guildConfig = await GuildConfig.findOne({
            guildId: guildId,
          }).lean();
          let notificationSent = false;
          if (guildConfig && guildConfig.repairOrdersChannelId) {
            const repairChannel = await interaction.client.channels
              .fetch(guildConfig.repairOrdersChannelId)
              .catch(() => null);
            if (repairChannel && repairChannel.isTextBased()) {
              const orderEmbed = new EmbedBuilder()
                .setTitle(
                  `🛠️ Đơn Sửa Xe Mới! #${newOrder._id.toString().slice(-6)}`,
                )
                .setColor("Orange")
                .setDescription(
                  `Một yêu cầu sửa xe mới đã được tạo bởi <@${userId}>. Các thợ máy hãy vào việc!`,
                )
                .addFields(
                  {
                    name: "Chủ Xe",
                    value: `<@${userId}> (${interaction.user.tag})`,
                    inline: true,
                  },
                  {
                    name: "Xe Cần Sửa",
                    value: `**${carModel.name}**\n(ID Instance: \`...${carIdString.slice(-6)}\`)`,
                    inline: true,
                  },
                  {
                    name: "Độ Bền Hiện Tại",
                    value: `${carToRepair.durability}%`,
                    inline: true,
                  },
                  {
                    name: "Thù Lao Đề Xuất",
                    value: `${rewardAmount.toLocaleString()} VNĐ`,
                    inline: true,
                  },
                  {
                    name: "Thời Gian Tối Đa",
                    value: `${deadlineHours} giờ`,
                    inline: true,
                  },
                  {
                    name: "Ghi Chú Chủ Xe",
                    value: notes || "Không có",
                    inline: false,
                  },
                )
                .setTimestamp(newOrder.createdAt)
                .setFooter({
                  text: `Sử dụng /race repair accept order_id:${newOrder._id.toString()}`,
                });

              await repairChannel.send({
                embeds: [orderEmbed],
              });
              notificationSent = true;
            } else {
              Logger.warn(
                `[Race Repair Request] Repair order channel ${guildConfig.repairOrdersChannelId} not found or not text-based for guild ${guildId}.`,
              );
            }
          } else {
            Logger.warn(
              `[Race Repair Request] No repair order channel configured for guild ${guildId}.`,
            );
          }

          await repairSession.commitTransaction();
          await interaction.editReply(
            `✅ Đã tạo yêu cầu sửa xe **${carModel.name}** (ID: ...${carIdString.slice(-6)}) với thù lao **${rewardAmount.toLocaleString()} VNĐ**. ${notificationSent ? "Thông báo đã được gửi đến kênh đơn sửa xe." : "Admin chưa cài đặt kênh thông báo đơn sửa xe."}`,
          );
        } else if (subcommand === "view-orders") {
          const statusFilter =
            interaction.options.getString("status_filter") || "pending";
          const page = interaction.options.getInteger("page") || 1;
          const ordersPerPage = 5;

          let query = { guildId: guildId };
          let title = "Danh Sách Đơn Sửa Xe";

          switch (statusFilter) {
            case "pending":
              query.status = "pending";
              title = "Danh Sách Đơn Sửa Xe Đang Chờ";
              break;
            case "accepted_inprogress":
              query.status = { $in: ["accepted", "in_progress"] };
              title = "Danh Sách Đơn Sửa Xe Đã Chấp Nhận/Đang Làm";
              break;
            case "completed":
              query.status = { $in: ["completed", "completed_late"] };
              title = "Danh Sách Đơn Sửa Xe Đã Hoàn Thành";
              break;
            case "my_owner_orders":
              query.ownerId = userId;
              title = `Tất Cả Đơn Sửa Xe Của Bạn`;
              break;
            case "my_mechanic_jobs":
              query.mechanicId = userId;
              title = `Tất Cả Đơn Bạn Nhận Sửa`;
              break;
            default:
              query.status = "pending";
              title = "Danh Sách Đơn Sửa Xe Đang Chờ";
          }

          const totalOrders =
            await RepairOrder.countDocuments(query).session(repairSession);
          const totalPages = Math.ceil(totalOrders / ordersPerPage);
          if (page > totalPages && totalPages > 0) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              `⚠️ Trang ${page} không tồn tại. Chỉ có ${totalPages} trang cho bộ lọc này.`,
            );
          }
          if (totalOrders === 0) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              `ℹ️ Không có đơn sửa xe nào khớp với bộ lọc của bạn.`,
            );
          }

          const orders = await RepairOrder.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * ordersPerPage)
            .limit(ordersPerPage)
            .lean()
            .session(repairSession);

          const embed = new EmbedBuilder()
            .setTitle(`🛠️ ${title} (Trang ${page}/${totalPages})`)
            .setColor("Aqua")
            .setTimestamp();

          if (orders.length === 0) {
            embed.setDescription("Không tìm thấy đơn sửa xe nào.");
          } else {
            for (const order of orders) {
              let mechanicInfo = "Chưa có";
              if (order.mechanicId) {
                const mechanicUser = await interaction.client.users
                  .fetch(order.mechanicId)
                  .catch(() => null);
                mechanicInfo = mechanicUser
                  ? mechanicUser.tag
                  : `ID: ${order.mechanicId}`;
              }
              const ownerUser = await interaction.client.users
                .fetch(order.ownerId)
                .catch(() => null);
              const ownerInfo = ownerUser
                ? ownerUser.tag
                : `ID: ${order.ownerId}`;

              embed.addFields({
                name: `Đơn #${order._id.toString().slice(-6)} - Xe: ${order.carModelName}`,
                value:
                  `Chủ xe: ${ownerInfo}\n` +
                  `Thợ nhận: ${mechanicInfo}\n` +
                  `Thù lao: ${order.offeredReward.toLocaleString()} VNĐ\n` +
                  `Trạng thái: \`${order.status}\`\n` +
                  `Độ bền xe: ${order.currentDurability}%\n` +
                  `Deadline: ${order.maxCompletionTimeHours} giờ (từ lúc tạo)\n` +
                  `Tạo lúc: <t:${Math.floor(new Date(order.createdAt).getTime() / 1000)}:R>\n` +
                  `${order.notesFromOwner ? `Ghi chú chủ xe: ${order.notesFromOwner}\n` : ""}` +
                  `${order.status === "pending" && player.mainJob?.name === "thợ sửa xe" ? `➡️ Nhận đơn: \`/race repair accept order_id:${order._id.toString()}\`\n` : ""}` +
                  `${order.status === "pending" && order.ownerId === userId ? `➡️ Hủy đơn: \`/race repair cancel order_id:${order._id.toString()}\`\n` : ""}` +
                  `${(order.status === "accepted" || order.status === "in_progress") && order.mechanicId === userId ? `➡️ Hoàn thành: \`/race repair complete order_id:${order._id.toString()}\`\n` : ""}`,
                inline: false,
              });
            }
          }
          await repairSession.abortTransaction();
          await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === "accept") {
          const orderIdString = interaction.options.getString("order_id");

          if (!mongoose.Types.ObjectId.isValid(orderIdString)) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply("❌ ID đơn sửa chữa không hợp lệ.");
          }
          const orderObjectId = new mongoose.Types.ObjectId(orderIdString);

          const repairOrder =
            await RepairOrder.findById(orderObjectId).session(repairSession);

          if (!repairOrder) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply("❌ Không tìm thấy đơn sửa chữa này.");
          }
          if (repairOrder.guildId !== guildId) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Đơn sửa chữa này không thuộc server này.",
            );
          }

          const player = await User.findOne({ userId, guildId }).session(
            repairSession,
          );

          if (player.mainJob?.name !== "thợ sửa xe") {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Bạn phải là 'Thợ Sửa Xe' để nhận đơn sửa chữa.",
            );
          }
          if (player.userId === repairOrder.ownerId) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Bạn không thể nhận sửa xe của chính mình.",
            );
          }

          const currentJobsByMechanic = await RepairOrder.countDocuments({
            mechanicId: userId,
            status: { $in: ["accepted", "in_progress"] },
          }).session(repairSession);
          if (currentJobsByMechanic >= 3) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Bạn đang có quá nhiều đơn sửa chữa chưa hoàn thành. Hãy hoàn thành bớt trước khi nhận thêm.",
            );
          }

          if (repairOrder.status !== "pending") {
            let statusMessage = `đã được thợ khác nhận`;
            if (
              repairOrder.status === "completed" ||
              repairOrder.status === "completed_late"
            )
              statusMessage = "đã hoàn thành";
            else if (repairOrder.status === "cancelled_by_owner")
              statusMessage = "đã bị chủ xe hủy";
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              `❌ Đơn sửa chữa này không còn ở trạng thái 'pending' (hiện tại: ${statusMessage}).`,
            );
          }

          // Cập nhật đơn hàng
          repairOrder.status = "accepted";
          repairOrder.mechanicId = userId;
          repairOrder.acceptedAt = new Date();

          // Cập nhật trạng thái xe của chủ xe
          const owner = await User.findOne({
            userId: repairOrder.ownerId,
            guildId: repairOrder.guildId,
          }).session(repairSession);
          if (!owner) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            Logger.error(
              `[Race Repair Accept] Không tìm thấy chủ xe ${repairOrder.ownerId} cho đơn ${repairOrder._id}`,
            );
            return interaction.editReply(
              "❌ Lỗi: Không tìm thấy dữ liệu của chủ xe.",
            );
          }
          const carToUpdate = owner.garage.cars.id(repairOrder.carInstanceId);
          if (carToUpdate) {
            carToUpdate.status = "under_repair";
          } else {
            Logger.warn(
              `[Race Repair Accept] Không tìm thấy xe ${repairOrder.carInstanceId} trong garage của chủ xe ${repairOrder.ownerId} cho đơn ${repairOrder._id}`,
            );
          }

          await repairOrder.save({ session: repairSession });
          if (owner) await owner.save({ session: repairSession });

          await repairSession.commitTransaction();

          // Thông báo cho chủ xe
          const ownerUserDM = await interaction.client.users
            .fetch(repairOrder.ownerId)
            .catch(() => null);
          if (ownerUserDM) {
            ownerUserDM
              .send(
                `🛠️ Thợ máy **${interaction.user.tag}** đã nhận yêu cầu sửa xe **${repairOrder.carModelName}** (Đơn #${repairOrder._id.toString().slice(-6)}) của bạn!`,
              )
              .catch((e) =>
                Logger.error(
                  `Không thể DM chủ xe ${repairOrder.ownerId}: ${e.message}`,
                ),
              );
          }

          // Cập nhật kênh thông báo (nếu có)
          const guildConfig = await GuildConfig.findOne({
            guildId: guildId,
          }).lean();
          if (guildConfig && guildConfig.repairOrdersChannelId) {
            const repairChannel = await interaction.client.channels
              .fetch(guildConfig.repairOrdersChannelId)
              .catch(() => null);
            if (repairChannel && repairChannel.isTextBased()) {
              await repairChannel.send(
                `✅ Đơn sửa xe #${repairOrder._id.toString().slice(-6)} (Xe: ${repairOrder.carModelName}) đã được thợ **${interaction.user.tag}** nhận!`,
              );
            }
          }

          await interaction.editReply(
            `✅ Bạn đã nhận thành công đơn sửa chữa #${repairOrder._id.toString().slice(-6)} cho xe **${repairOrder.carModelName}**. Hãy hoàn thành đúng hạn!`,
          );
        } else if (subcommand === "complete") {
          const orderIdString = interaction.options.getString("order_id");
          const mechanicNotes = interaction.options.getString("mechanic_notes");

          if (!mongoose.Types.ObjectId.isValid(orderIdString)) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply("❌ ID đơn sửa chữa không hợp lệ.");
          }
          const orderObjectId = new mongoose.Types.ObjectId(orderIdString);
          const repairOrder =
            await RepairOrder.findById(orderObjectId).session(repairSession);

          if (!repairOrder || repairOrder.guildId !== guildId) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Không tìm thấy đơn sửa chữa này hoặc đơn không thuộc server này.",
            );
          }

          const player = await User.findOne({ userId, guildId }).session(
            repairSession,
          );

          if (repairOrder.mechanicId !== userId) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Bạn không phải là thợ đã nhận đơn sửa chữa này.",
            );
          }
          if (
            repairOrder.status !== "accepted" &&
            repairOrder.status !== "in_progress"
          ) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Đơn sửa chữa này không ở trạng thái có thể hoàn thành.",
            );
          }

          // Tính toán thời gian hoàn thành
          const timeTakenHours =
            (new Date().getTime() -
              new Date(
                repairOrder.acceptedAt || repairOrder.createdAt,
              ).getTime()) /
            (1000 * 60 * 60);
          const isLate = timeTakenHours > repairOrder.maxCompletionTimeHours;

          repairOrder.status = isLate ? "completed_late" : "completed";
          repairOrder.completedAt = new Date();
          if (mechanicNotes) repairOrder.notesFromMechanic = mechanicNotes;

          // Tìm chủ xe để cập nhật xe và trả tiền
          const owner = await User.findOne({
            userId: repairOrder.ownerId,
            guildId: repairOrder.guildId,
          }).session(repairSession);
          if (!owner) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            Logger.error(
              `[Race Repair Complete] Không tìm thấy chủ xe ${repairOrder.ownerId} cho đơn ${repairOrder._id}`,
            );
            return interaction.editReply(
              "❌ Lỗi: Không tìm thấy dữ liệu của chủ xe để cập nhật xe.",
            );
          }
          const carRepaired = owner.garage.cars.id(repairOrder.carInstanceId);
          if (!carRepaired) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            Logger.error(
              `[Race Repair Complete] Không tìm thấy xe ${repairOrder.carInstanceId} trong garage chủ xe ${repairOrder.ownerId}`,
            );
            return interaction.editReply(
              "❌ Lỗi: Không tìm thấy xe của chủ xe để cập nhật.",
            );
          }

          // Phục hồi độ bền xe
          carRepaired.durability = 100;
          carRepaired.status = "ready";

          // Thợ nhận tiền thù lao
          player.balance += repairOrder.offeredReward;
          player.totalEarned =
            (player.totalEarned || 0) + repairOrder.offeredReward;

          // Thợ nhận XP nghề + lương bonus (nếu có)
          const mechanicJobInfo = await MainJob.findOne({
            name: "thợ sửa xe",
          }).lean();
          if (mechanicJobInfo) {
            const completeTask = mechanicJobInfo.tasks.find(
              (t) => t.taskId === "completeRepairOrder",
            );
            if (completeTask) {
              player.mainJob.xp = (player.mainJob.xp || 0) + completeTask.xp;
            }
            const salaryBonus =
              mechanicJobInfo.salaryByLevel[
                player.mainJob.level?.toString?.()
              ] || 0;
            if (salaryBonus > 0) {
              player.balance += salaryBonus;
              player.totalEarned += salaryBonus;
            }
          }

          let replyMessage = `✅ Bạn đã hoàn thành sửa xe **${repairOrder.carModelName}** (Đơn #${repairOrder._id.toString().slice(-6)}) và nhận được **${repairOrder.offeredReward.toLocaleString()} VNĐ**.`;
          if (isLate) {
            replyMessage +=
              "\n⚠️ **LƯU Ý:** Bạn đã hoàn thành đơn hàng này trễ hạn!";
          }

          await repairOrder.save({ session: repairSession });
          await owner.save({ session: repairSession });
          await player.save({ session: repairSession });

          await repairSession.commitTransaction();

          // Thông báo cho chủ xe
          const ownerUserDM = await interaction.client.users
            .fetch(repairOrder.ownerId)
            .catch(() => null);
          if (ownerUserDM) {
            ownerUserDM
              .send(
                `🎉 Xe **${repairOrder.carModelName}** (Đơn #${repairOrder._id.toString().slice(-6)}) của bạn đã được thợ **${interaction.user.tag}** sửa xong!`,
              )
              .catch((e) =>
                Logger.error(
                  `Không thể DM chủ xe ${repairOrder.ownerId}: ${e.message}`,
                ),
              );
          }

          await interaction.editReply(replyMessage);
        } else if (subcommand === "cancel") {
          const orderIdString = interaction.options.getString("order_id");

          if (!mongoose.Types.ObjectId.isValid(orderIdString)) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply("❌ ID đơn sửa chữa không hợp lệ.");
          }
          const orderObjectId = new mongoose.Types.ObjectId(orderIdString);
          const repairOrder =
            await RepairOrder.findById(orderObjectId).session(repairSession);

          if (!repairOrder || repairOrder.guildId !== guildId) {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Không tìm thấy đơn sửa chữa này hoặc đơn không thuộc server này.",
            );
          }
          const player = await User.findOne({ userId, guildId }).session(
            repairSession,
          );

          if (repairOrder.status !== "pending") {
            await repairSession.abortTransaction();
            repairSession.endSession();
            return interaction.editReply(
              "❌ Bạn chỉ có thể hủy đơn sửa chữa đang ở trạng thái 'pending' (chưa có thợ nhận).",
            );
          }

          // Hoàn lại tiền thù lao cho chủ xe
          player.balance += repairOrder.offeredReward;
          player.totalSpent =
            (player.totalSpent || 0) - repairOrder.offeredReward;

          // Cập nhật trạng thái xe
          const carToRestore = player.garage.cars.id(repairOrder.carInstanceId);
          if (carToRestore) {
            carToRestore.status =
              carToRestore.durability <= 20 ? "needs_repair" : "ready";
          }

          repairOrder.status = "cancelled_by_owner";

          await repairOrder.save({ session: repairSession });
          await player.save({ session: repairSession });

          await repairSession.commitTransaction();

          await interaction.editReply(
            `✅ Đã hủy thành công đơn sửa xe #${repairOrder._id.toString().slice(-6)} cho xe **${repairOrder.carModelName}**. Số tiền ${repairOrder.offeredReward.toLocaleString()} VNĐ đã được hoàn lại.`,
          );
        } else {
          if (repairSession.inTransaction())
            await repairSession.abortTransaction();
          await interaction.editReply(
            `Tính năng \`/race repair ${subcommand}\` đang được phát triển.`,
          );
        }
      } catch (error) {
        if (repairSession.inTransaction()) {
          await repairSession.abortTransaction();
        }
        Logger.error(`Lỗi lệnh /race repair ${subcommand}: ${error.message}`, {
          stack: error.stack,
        });
        if (initialReplySent && !interaction.replied) {
          await interaction
            .editReply({ content: `❌ Đã xảy ra lỗi: ${error.message}` })
            .catch(() => {});
        } else if (!initialReplySent && !interaction.replied) {
          await interaction
            .reply({
              content: `❌ Đã xảy ra lỗi: ${error.message}`,
              ephemeral: true,
            })
            .catch(() => {});
        } else {
          await interaction
            .followUp({
              content: `❌ Đã xảy ra lỗi: ${error.message}`,
              ephemeral: true,
            })
            .catch(() => {});
        }
      } finally {
        if (repairSession.inTransaction()) {
          await repairSession.abortTransaction();
        }
        repairSession.endSession();
      }
    } else if (subcommand === "start-npc") {
      const carInstanceIdString =
        interaction.options.getString("car_instance_id");
      let tournamentIdString = interaction.options.getString("tournament_id");

      const session = await mongoose.startSession();

      try {
        await interaction.deferReply();
        session.startTransaction();

        const player = await User.findOne({ userId, guildId }).session(session);
        if (!player) {
          await session.abortTransaction();
          return interaction.editReply(
            "❌ Không tìm thấy dữ liệu người chơi của bạn. Hãy thử tương tác với bot trước.",
          );
        }

        if (!mongoose.Types.ObjectId.isValid(carInstanceIdString)) {
          await session.abortTransaction();
          return interaction.editReply({ content: "❌ ID xe không hợp lệ." });
        }
        const carInstanceObjectId = new mongoose.Types.ObjectId(
          carInstanceIdString,
        );
        const playerCarInstance = player.garage.cars.id(carInstanceObjectId);

        if (!playerCarInstance) {
          await session.abortTransaction();
          return interaction.editReply(
            "❌ Không tìm thấy xe này trong garage của bạn.",
          );
        }
        if (playerCarInstance.status !== "ready") {
          await session.abortTransaction();
          return interaction.editReply(
            `❌ Xe "${playerCarInstance.carModelId}" của bạn đang ở trạng thái "${playerCarInstance.status}" và không thể đua.`,
          );
        }
        if (playerCarInstance.durability <= 20) {
          await session.abortTransaction();
          return interaction.editReply(
            `❌ Xe "${playerCarInstance.carModelId}" có độ bền quá thấp (${playerCarInstance.durability}%) để đua. Hãy sửa chữa trước qua lệnh \`/race repair request\`!`,
          );
        }

        const playerCarModel = await CarModel.findOne({
          modelId: playerCarInstance.carModelId,
        }).lean();
        if (!playerCarModel) {
          await session.abortTransaction();
          return interaction.editReply(
            "❌ Lỗi: Không tìm thấy định nghĩa cho mẫu xe của bạn.",
          );
        }

        let selectedTournament;
        let messageForRaceStart = interaction;

        if (!tournamentIdString) {
          const availableTournaments = await RaceDefinition.find({
            type: { $in: ["NPC_SOLO_CHALLENGE", "NPC_TOURNAMENT_BRACKET"] },
            requiredLevel: { $lte: player.level || 1 },
          })
            .limit(25)
            .lean();

          if (!availableTournaments.length) {
            await session.abortTransaction();
            return interaction.editReply(
              "🏁 Hiện tại không có giải đua NPC nào phù hợp hoặc bạn chưa đủ điều kiện tham gia.",
            );
          }

          const tournamentOptions = availableTournaments.map((tour) => {
            let reqText = tour.carRequirements?.rarity
              ? `YC: ${tour.carRequirements.rarity}`
              : "YC xe: Mọi loại";
            if (tour.carRequirements?.minTotalStats)
              reqText += `, Tổng Stats >= ${tour.carRequirements.minTotalStats}`;
            return {
              label: `${tour.name} (Khó: ${tour.difficulty})`,
              description:
                `Phí: ${tour.entryFee || 0} VNĐ. ${reqText}`.substring(0, 100),
              value: tour.tournamentId,
            };
          });

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(
              `select_tournament_${interaction.id}_${playerCarInstance._id}`,
            )
            .setPlaceholder("Chọn một giải đấu NPC...")
            .addOptions(tournamentOptions);
          const row = new ActionRowBuilder().addComponents(selectMenu);

          if (session.inTransaction()) {
            await session.abortTransaction();
          }

          const selectMessageInstance = await interaction.editReply({
            content: `Bạn đã chọn xe **${playerCarModel.name}**. Vui lòng chọn một giải đấu NPC để tham gia:`,
            components: [row],
            embeds: [],
          });

          const filter = (i) =>
            i.customId ===
              `select_tournament_${interaction.id}_${playerCarInstance._id}` &&
            i.user.id === userId;
          try {
            const collected = await selectMessageInstance.awaitMessageComponent(
              {
                filter,
                componentType: ComponentType.StringSelect,
                time: 120000,
              },
            );
            tournamentIdString = collected.values[0];
            await collected.update({
              content: `Đang chuẩn bị giải đấu "${tournamentIdString}" cho xe **${playerCarModel.name}**...`,
              components: [],
            });
            messageForRaceStart = collected.message;

            if (!session.inTransaction()) {
              await session.startTransaction();
            }
          } catch (e) {
            await interaction.editReply({
              content:
                "⏰ Bạn đã không chọn giải đấu trong thời gian cho phép. Cuộc đua bị hủy.",
              components: [],
            });
            if (session.inTransaction()) await session.abortTransaction();
            session.endSession();
            return;
          }
        }

        // Lấy lại player data trong session mới
        const currentPlayerInSession = await User.findOne({
          userId,
          guildId,
        }).session(session);
        if (!currentPlayerInSession)
          throw new Error("Lỗi lấy dữ liệu người chơi trong session mới.");
        const currentCarInSession = currentPlayerInSession.garage.cars.id(
          playerCarInstance._id,
        );
        if (!currentCarInSession)
          throw new Error("Lỗi lấy dữ liệu xe trong session mới.");

        selectedTournament = await RaceDefinition.findOne({
          tournamentId: tournamentIdString,
        }).lean();
        if (!selectedTournament) {
          await session.abortTransaction();
          return interaction.editReply(
            "❌ Giải đấu NPC không tồn tại hoặc đã kết thúc.",
          );
        }

        // Kiểm tra yêu cầu xe
        if (selectedTournament.carRequirements) {
          const req = selectedTournament.carRequirements;
          let tempPlayerCarStatsSum = 0;
          if (playerCarModel.baseStats) {
            tempPlayerCarStatsSum =
              (playerCarModel.baseStats.speed || 0) +
              (playerCarModel.baseStats.acceleration || 0) +
              (playerCarModel.baseStats.handling || 0) +
              (playerCarModel.baseStats.durability || 0);
          }

          if (req.rarity && playerCarModel.rarity !== req.rarity) {
            await session.abortTransaction();
            return interaction.editReply(
              `❌ Xe của bạn (${playerCarModel.rarity}) không đáp ứng yêu cầu độ hiếm (${req.rarity}) của giải này.`,
            );
          }
          if (req.minTotalStats && tempPlayerCarStatsSum < req.minTotalStats) {
            await session.abortTransaction();
            return interaction.editReply(
              `❌ Xe của bạn (Tổng Stats: ${tempPlayerCarStatsSum}) chưa đạt yêu cầu Tổng Stats tối thiểu (${req.minTotalStats}) của giải này.`,
            );
          }
          if (
            req.allowedModelIds &&
            req.allowedModelIds.length > 0 &&
            !req.allowedModelIds.includes(playerCarModel.modelId)
          ) {
            await session.abortTransaction();
            return interaction.editReply(
              `❌ Mẫu xe ${playerCarModel.name} không được phép tham gia giải này.`,
            );
          }
          if (
            req.bannedModelIds &&
            req.bannedModelIds.length > 0 &&
            req.bannedModelIds.includes(playerCarModel.modelId)
          ) {
            await session.abortTransaction();
            return interaction.editReply(
              `❌ Mẫu xe ${playerCarModel.name} bị cấm tham gia giải này.`,
            );
          }
        }
        if (
          currentPlayerInSession.level < (selectedTournament.requiredLevel || 1)
        ) {
          await session.abortTransaction();
          return interaction.editReply(
            `❌ Bạn cần đạt cấp ${selectedTournament.requiredLevel || 1} để tham gia giải này.`,
          );
        }

        const entryFee = selectedTournament.entryFee || 0;
        if (currentPlayerInSession.balance < entryFee) {
          await session.abortTransaction();
          return interaction.editReply(
            `❌ Bạn không đủ ${entryFee.toLocaleString()} VNĐ để tham gia giải đấu này.`,
          );
        }
        if (entryFee > 0) {
          currentPlayerInSession.balance -= entryFee;
          currentPlayerInSession.totalSpent =
            (currentPlayerInSession.totalSpent || 0) + entryFee;
        }

        // Chọn NPC
        if (
          !selectedTournament.npcOpponentIds ||
          selectedTournament.npcOpponentIds.length === 0
        ) {
          await session.abortTransaction();
          return interaction.editReply("❌ Giải đấu này chưa có đối thủ NPC.");
        }
        const randomNpcId =
          selectedTournament.npcOpponentIds[
            Math.floor(Math.random() * selectedTournament.npcOpponentIds.length)
          ];
        const npcProfile = await NpcRacer.findOne({
          npcId: randomNpcId,
        }).lean();
        if (!npcProfile) {
          await session.abortTransaction();
          return interaction.editReply("❌ Lỗi: Không tìm thấy NPC đối thủ.");
        }
        const npcCarModelId =
          npcProfile.preferredCarModelIds[
            Math.floor(Math.random() * npcProfile.preferredCarModelIds.length)
          ] || "toyota_vios_2018";
        const npcCarModel = await CarModel.findOne({
          modelId: npcCarModelId,
        }).lean();
        if (!npcCarModel) {
          await session.abortTransaction();
          return interaction.editReply("❌ Lỗi: Không tìm thấy xe của NPC.");
        }

        // ---- Telemetry: START ----
        const seed = Math.floor(Math.random() * 2147483647);
        const trace = RaceTelemetry.start({
          guildId,
          userId,
          carId: String(playerCarInstance._id),
          track: selectedTournament.trackInfo?.name,
          seed,
          weather: selectedTournament.trackInfo?.defaultWeather,
          stats0: {
            playerLevel: currentPlayerInSession.level || 1,
            carModelId: playerCarModel.modelId,
            carName: playerCarModel.name,
            durability: playerCarInstance.durability,
            entryFee,
          },
        });
        // ---- Telemetry: START ----

        currentCarInSession.status = "racing";
        await currentPlayerInSession.save({ session });

        const raceStartEmbed = new EmbedBuilder()
          .setTitle(`🏁 Giải Đua: ${selectedTournament.name} 🏁`)
          .setDescription(
            `**${interaction.user.username}** trên chiếc **${playerCarModel.name}**\n⚔️ VS ⚔️\n**${npcProfile.name}** trên chiếc **${npcCarModel.name}**`,
          )
          .setColor("Orange")
          .addFields(
            {
              name: "Đường đua",
              value: selectedTournament.trackInfo.name,
              inline: true,
            },
            {
              name: "Thời tiết",
              value:
                selectedTournament.trackInfo.defaultWeather
                  .charAt(0)
                  .toUpperCase() +
                selectedTournament.trackInfo.defaultWeather.slice(1),
              inline: true,
            },
          )
          .setFooter({
            text: "Cuộc đua đang diễn ra... Kết quả sẽ được thông báo sau ít phút!",
          });

        const raceProgressMessage = await interaction.editReply({
          embeds: [raceStartEmbed],
          components: [],
          fetchReply: true,
        });

        const raceResult = await raceSimulator.runRaceSimulation(
          currentPlayerInSession,
          currentCarInSession,
          playerCarModel,
          npcProfile,
          npcCarModel,
          selectedTournament,
          interaction.user.username,
        );

        // (optional) Telemetry point: raw log snapshot (tránh file quá lớn)
        try {
          const sliceLen = Math.min(raceResult.raceLog?.length || 0, 120);
          RaceTelemetry.point(trace.id, "raceLog", {
            firstLines: (raceResult.raceLog || []).slice(0, sliceLen),
          });
        } catch (e) {
          Logger.warn(`[RaceTelemetry] point failed: ${e.message}`);
        }

        // Hiển thị log diễn biến
        let accumulatedLog = raceResult.raceLog.slice(0, 3).join("\n");
        const raceInProgressEmbed = new EmbedBuilder()
          .setTitle(`🏁 Đang Đua: ${selectedTournament.name} 🏁`)
          .setColor("Blurple")
          .setDescription(accumulatedLog + "\n\n*Đang cập nhật diễn biến...*")
          .setFooter({ text: "Xin vui lòng chờ!" });

        await raceProgressMessage.edit({ embeds: [raceInProgressEmbed] });

        for (let i = 3; i < raceResult.raceLog.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          accumulatedLog += "\n" + raceResult.raceLog[i];
          if (accumulatedLog.length > 3800) {
            accumulatedLog = "...\n" + accumulatedLog.slice(-3800);
          }
          raceInProgressEmbed.setDescription(
            accumulatedLog + "\n\n*Đang cập nhật diễn biến...*",
          );
          try {
            await raceProgressMessage.edit({ embeds: [raceInProgressEmbed] });
          } catch (editError) {
            Logger.error(
              `Error editing race progress message: ${editError.message}`,
            );
            break;
          }
        }

        // Lấy lại user/xe để cập nhật lần cuối
        const finalPlayerToUpdate = await User.findById(
          currentPlayerInSession._id,
        ).session(session);
        if (!finalPlayerToUpdate)
          throw new Error(
            "Lỗi nghiêm trọng: Không tìm thấy người chơi để cập nhật kết quả.",
          );
        const finalCarToUpdate = finalPlayerToUpdate.garage.cars.id(
          currentCarInSession._id,
        );
        if (!finalCarToUpdate)
          throw new Error(
            "Lỗi nghiêm trọng: Không tìm thấy xe của người chơi để cập nhật.",
          );

        finalPlayerToUpdate.racingStats.totalRaces =
          (finalPlayerToUpdate.racingStats.totalRaces || 0) + 1;
        finalCarToUpdate.durability = raceResult.finalPlayerDurability;
        finalCarToUpdate.lastRaceAt = new Date();

        if (finalCarToUpdate.durability <= 20) {
          finalCarToUpdate.status = "needs_repair";
        } else {
          finalCarToUpdate.status = "ready";
        }

        // Tính thưởng/xp & kết quả
        let rewardDescription = "";
        let resultTitle = "";
        let resultColor = "Yellow";
        let cashReward = 0;

        if (raceResult.winner === "player") {
          resultTitle = `🎉 BẠN ĐÃ CHIẾN THẮNG GIẢI "${selectedTournament.name}"! 🎉`;
          resultColor = "Green";
          finalPlayerToUpdate.racingStats.totalWins =
            (finalPlayerToUpdate.racingStats.totalWins || 0) + 1;
          const vndReward = selectedTournament.rewards.vnd
            ? getRandomInt(
                selectedTournament.rewards.vnd.min,
                selectedTournament.rewards.vnd.max,
              )
            : 0;
          cashReward = vndReward;
          const xpReward = selectedTournament.rewards.xp
            ? getRandomInt(
                selectedTournament.rewards.xp.min,
                selectedTournament.rewards.xp.max,
              )
            : 0;

          if (vndReward > 0) {
            finalPlayerToUpdate.balance += vndReward;
            finalPlayerToUpdate.totalEarned =
              (finalPlayerToUpdate.totalEarned || 0) + vndReward;
            rewardDescription += `💰 +${vndReward.toLocaleString()} VNĐ\n`;
          }
          if (xpReward > 0) {
            finalPlayerToUpdate.xp += xpReward;
            rewardDescription += `✨ +${xpReward} XP (Chung)\n`;
          }
        } else if (raceResult.winner === "npc") {
          resultTitle = `💔 BẠN ĐÃ THUA GIẢI "${selectedTournament.name}"... 💔`;
          resultColor = "Red";
          finalPlayerToUpdate.racingStats.totalLosses =
            (finalPlayerToUpdate.racingStats.totalLosses || 0) + 1;
          const consolationXp = Math.floor(
            (selectedTournament.rewards.xp?.min || 10) / 3,
          );
          if (consolationXp > 0) {
            finalPlayerToUpdate.xp += consolationXp;
            rewardDescription += `✨ +${consolationXp} XP (an ủi)\n`;
          }
        } else {
          resultTitle = `⚖️ KẾT QUẢ HÒA TẠI GIẢI "${selectedTournament.name}"! ⚖️`;
          resultColor = "Greyple";
          const drawXp = Math.floor(
            (selectedTournament.rewards.xp?.min || 10) * 0.6,
          );
          if (drawXp > 0) {
            finalPlayerToUpdate.xp += drawXp;
            rewardDescription += `✨ +${drawXp} XP (hòa)\n`;
          }
          if (entryFee > 0) {
            finalPlayerToUpdate.balance += entryFee;
            finalPlayerToUpdate.totalSpent -= entryFee;
            rewardDescription += `💸 Hoàn lại ${entryFee.toLocaleString()} VNĐ phí tham gia.\n`;
          }
        }

        const levelUpResult = checkLevelUp(finalPlayerToUpdate);
        if (levelUpResult && levelUpResult.leveledUp) {
          rewardDescription += `⏫ Lên cấp! Bạn đạt cấp ${levelUpResult.newLevel} và nhận ${levelUpResult.reward.toLocaleString()} VNĐ!\n`;
        }

        await finalPlayerToUpdate.save({ session });
        await session.commitTransaction();

        const finalResultEmbed = new EmbedBuilder()
          .setTitle(resultTitle)
          .setColor(resultColor)
          .setDescription("```\n" + raceResult.raceLog.join("\n") + "\n```")
          .addFields(
            {
              name: "Đối Thủ",
              value: `**${npcProfile.name}** với **${npcCarModel.name}**`,
              inline: true,
            },
            {
              name: "Xe Của Bạn",
              value: `**${playerCarModel.name}** (Độ bền còn: ${finalCarToUpdate.durability}%)`,
              inline: true,
            },
          );
        if (rewardDescription) {
          finalResultEmbed.addFields({
            name: "Phần Thưởng/Thay Đổi",
            value: rewardDescription || "Không có.",
          });
        }
        finalResultEmbed
          .setFooter({
            text: `Số dư mới: ${finalPlayerToUpdate.balance.toLocaleString()} VNĐ`,
          })
          .setTimestamp();

        await raceProgressMessage.edit({
          embeds: [finalResultEmbed],
          components: [],
        });

        // ---- Telemetry: FINISH ----
        try {
          const placement =
            raceResult.winner === "player"
              ? 1
              : raceResult.winner === "npc"
                ? 2
                : 0;
          const wearDelta =
            (playerCarInstance.durability || 0) -
            (finalCarToUpdate.durability || 0);

          await RaceTelemetry.finish(trace.id, {
            guildId,
            userId,
            carId: String(playerCarInstance._id),
            track: selectedTournament.trackInfo?.name,
            seed,
            weather: selectedTournament.trackInfo?.defaultWeather,
            stats0: {
              levelBefore: currentPlayerInSession.level || 1,
              durabilityBefore: playerCarInstance.durability,
            },
            stats1: {
              levelAfter:
                finalPlayerToUpdate.level || currentPlayerInSession.level || 1,
              durabilityAfter: finalCarToUpdate.durability,
            },
            lapTimes: raceResult.lapTimes || [],
            placement,
            reward: cashReward,
            wearDelta,
            totalTimeMs: Date.now() - (trace.t0 || Date.now()),
          });
        } catch (e) {
          Logger.warn(`[RaceTelemetry] finish failed: ${e.message}`);
        }
        // ---- Telemetry: FINISH ----
      } catch (error) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        Logger.error(`Lỗi thực thi /race start-npc: ${error.message}`, {
          stack: error.stack,
          carInstanceIdString,
          tournamentIdString,
        });
        const errorReplyOptions = {
          content: `❌ Đã xảy ra lỗi nghiêm trọng khi xử lý cuộc đua: ${error.message}.`,
          embeds: [],
          components: [],
        };
        if (initialReplySent) {
          await interaction
            .editReply(errorReplyOptions)
            .catch((e) =>
              Logger.error("Error editing reply with final error:", e),
            );
        } else {
          await interaction
            .reply(errorReplyOptions)
            .catch((e) => Logger.error("Error replying initial error:", e));
        }

        // Recovery: reset xe nếu kẹt racing
        try {
          const userToFix = await User.findOne({ userId, guildId });
          if (userToFix) {
            const carToFix = userToFix.garage.cars.id(
              new mongoose.Types.ObjectId(carInstanceIdString),
            );
            if (carToFix && carToFix.status === "racing") {
              carToFix.status = "ready";
              await userToFix.save();
              Logger.info(
                `[Race Error Recovery] Car ${carInstanceIdString} status reset to ready for user ${userId}.`,
              );
            }
          }
        } catch (recoveryError) {
          Logger.error(
            `[Race Error Recovery] Failed to reset car status: ${recoveryError.message}`,
          );
        }
      } finally {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
      }
    }
  },
};
