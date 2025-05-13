const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  inlineCode,
  ComponentType,
} = require("discord.js");
const User = require("../../models/User");
const CarModel = require("../../models/CarModel");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("car-discard")
    .setDescription("Phá một chiếc xe không dùng đến trong garage.")
    .addStringOption((option) =>
      option
        .setName("car_instance_id")
        .setDescription(
          "ID instance của chiếc xe bạn muốn phá (Xem ID trong /garage).",
        )
        .setRequired(true),
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const carInstanceIdToDiscard =
      interaction.options.getString("car_instance_id");

    if (!mongoose.Types.ObjectId.isValid(carInstanceIdToDiscard)) {
      return interaction.reply({
        content: "❌ ID instance của xe không hợp lệ.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });

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
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        // Lấy lại user data trong session để đảm bảo tính nhất quán
        let userInSession = await User.findOne({ userId, guildId }).session(
          session,
        );
        if (!userInSession)
          throw new Error("Lỗi dữ liệu người dùng khi thực hiện transaction.");

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

        const carToActuallyDiscardIndex = userInSession.garage.cars.findIndex(
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
            const partIndexInUserGarage = userInSession.garage.parts.findIndex(
              (p) => p._id.equals(partInstanceId),
            );

            if (partIndexInUserGarage !== -1) {
              userInSession.garage.parts[partIndexInUserGarage].installedOnCar =
                null;
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
        if (castrolToRefund > 0) userInSession.markModified("castrolBalance");
        if (discardFee > 0) userInSession.markModified("balance");

        await userInSession.save({ session });
        await session.commitTransaction();

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
        if (session.inTransaction()) await session.abortTransaction();
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
        await session.endSession();
      }
    } catch (error) {
      // Lỗi trước khi có button confirm hoặc trước transaction
      Logger.error(`Lỗi lệnh /car-discard (User ${userId}): ${error.message}`, {
        stack: error.stack,
      });
      await interaction
        .editReply({
          content: `❌ Lỗi: ${error.message}`, // Hiển thị lỗi trực tiếp cho người dùng (nếu là lỗi từ logic của mình như giới hạn)
          embeds: [],
          components: [],
        })
        .catch(() => {}); // Bắt lỗi nếu editReply cũng lỗi
    }
  },
};
