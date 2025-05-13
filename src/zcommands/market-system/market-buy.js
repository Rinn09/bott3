const { SlashCommandBuilder, EmbedBuilder } = require("discord.js"); // Bỏ ActionRowBuilder, ButtonBuilder, ModalBuilder nếu không dùng trực tiếp ở đây
const MarketListing = require("../../models/MarketListing");
const User = require("../../models/User");
const MarketTransaction = require("../../models/MarketTransaction");
const Logger = require("../../utils/logger");
const mongoose = require("mongoose");
const GuildConfig = require("../../models/GuildConfig");
const CarModel = require("../../models/CarModel"); // Cần để lấy thông tin xe
const PartDefinition = require("../../models/PartDefinition"); // Cần để lấy thông tin phụ tùng

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market-buy")
    .setDescription("Mua một vật phẩm, xe, hoặc phụ tùng từ chợ.") // Cập nhật mô tả
    .addStringOption((option) =>
      option
        .setName("listing_id")
        .setDescription("ID của tin đăng bạn muốn mua")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity") // Số lượng chỉ áp dụng cho 'shop_item' hoặc 'part_instance' nếu bán theo stack
        .setDescription("Số lượng (bỏ qua nếu mua xe, xe luôn là 1)")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const buyerId = interaction.user.id;
    const guildId = interaction.guild.id;
    const listingIdString = interaction.options.getString("listing_id");
    let quantityToBuyOption = interaction.options.getInteger("quantity");

    if (!mongoose.Types.ObjectId.isValid(listingIdString)) {
      return interaction.reply({
        content: "❌ ID tin đăng không hợp lệ.",
        ephemeral: true,
      });
    }
    const listingId = new mongoose.Types.ObjectId(listingIdString);

    await interaction.deferReply({ ephemeral: false });

    const buySession = await mongoose.startSession();
    buySession.startTransaction();

    let boughtItemNameDisplay = "Vật phẩm không xác định";
    let actualBoughtQuantity = 0;
    let finalTotalPrice = 0;
    let sellerIdForDM = null;
    let marketNotiChannelId = null;

    try {
      const listing =
        await MarketListing.findById(listingId).session(buySession);

      if (!listing) throw new Error("Tin đăng không tồn tại.");
      if (listing.guildId !== guildId)
        throw new Error("Tin đăng này không thuộc server hiện tại.");
      if (listing.status !== "active")
        throw new Error(
          `Tin đăng này không còn hoạt động (trạng thái: ${listing.status}).`,
        );
      if (listing.sellerId === buyerId)
        throw new Error("Bạn không thể tự mua vật phẩm của chính mình.");

      const buyerData = await User.findOne({
        userId: buyerId,
        guildId,
      }).session(buySession);
      if (!buyerData)
        throw new Error(
          "Không tìm thấy dữ liệu người mua. Hãy thử tương tác với bot để tạo tài khoản.",
        );

      const sellerData = await User.findOne({
        userId: listing.sellerId,
        guildId,
      }).session(buySession);
      if (!sellerData) {
        listing.status = "cancelled"; // Hủy tin đăng nếu người bán không tồn tại
        await listing.save({ buySession });
        throw new Error(
          "Không tìm thấy dữ liệu người bán. Tin đăng có thể đã bị lỗi và sẽ được hủy.",
        );
      }

      sellerIdForDM = listing.sellerId; // Lưu để gửi DM sau
      boughtItemNameDisplay = listing.itemName; // Lấy từ listing luôn cho thống nhất

      // Xử lý mua theo itemType
      if (listing.itemType === "shop_item") {
        actualBoughtQuantity =
          quantityToBuyOption === null || quantityToBuyOption === undefined
            ? listing.quantity
            : quantityToBuyOption;
        if (actualBoughtQuantity <= 0)
          throw new Error("Số lượng mua phải lớn hơn 0.");
        if (listing.quantity < actualBoughtQuantity) {
          throw new Error(
            `Số lượng vật phẩm \`${listing.itemName}\` trên chợ không đủ. Chỉ còn ${listing.quantity}.`,
          );
        }
        finalTotalPrice = listing.price * actualBoughtQuantity;

        if (buyerData.balance < finalTotalPrice) {
          throw new Error(
            `Bạn không đủ tiền. Cần **${finalTotalPrice.toLocaleString()} VNĐ**, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`,
          );
        }

        // Cập nhật inventory người mua
        const buyerCurrentItemQty =
          buyerData.inventory.get(listing.itemId) || 0;
        buyerData.inventory.set(
          listing.itemId,
          buyerCurrentItemQty + actualBoughtQuantity,
        );
        buyerData.markModified("inventory");
      } else if (listing.itemType === "car_instance") {
        actualBoughtQuantity = 1; // Xe luôn là 1
        finalTotalPrice = listing.price; // price của listing xe là tổng giá

        if (buyerData.balance < finalTotalPrice) {
          throw new Error(
            `Bạn không đủ tiền. Cần **${finalTotalPrice.toLocaleString()} VNĐ** để mua xe này, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`,
          );
        }

        // Xóa CarInstance khỏi garage người bán
        const carIndexInSellerGarage = sellerData.garage.cars.findIndex(
          (c) => c._id.toString() === listing.itemId,
        ); // listing.itemId là _id của CarInstance
        if (carIndexInSellerGarage === -1) {
          listing.status = "cancelled"; // Nếu xe không còn trong garage người bán, hủy listing
          await listing.save({ buySession });
          throw new Error(
            "Xe này không còn tồn tại trong garage của người bán. Tin đăng sẽ được hủy.",
          );
        }
        const carInstanceSoldBySeller =
          sellerData.garage.cars[carIndexInSellerGarage];

        // Tạo CarInstance mới cho người mua
        const newCarForBuyer = {
          carModelId: listing.itemSnapshot.modelId,
          cosmetics: listing.itemSnapshot.cosmetics || {
            color: "#FFFFFF",
            licensePlate: null,
          }, // Lấy từ snapshot
          acquiredAt: new Date(),
          isDisplayed: false, // Mặc định không trưng bày
          installedParts: new Map(), // Khởi tạo map rỗng
          // raceHistory, lastMaintenance có thể để default
        };
        buyerData.garage.cars.push(newCarForBuyer);
        // `_id` cho newCarForBuyer sẽ tự được Mongoose tạo khi push và save.
        // Chúng ta cần lấy _id của chiếc xe vừa được tạo cho người mua để gán vào phụ tùng.
        // Điều này sẽ được thực hiện sau khi buyerData.save() lần đầu hoặc lấy _id của phần tử cuối cùng sau khi push.

        // Xử lý chuyển giao phụ tùng từ snapshot
        const partsToTransferToBuyer = [];
        if (
          listing.itemSnapshot.installedParts &&
          listing.itemSnapshot.installedParts.length > 0
        ) {
          for (const partSnap of listing.itemSnapshot.installedParts) {
            // Tìm PartInstance gốc trong kho của người bán để "xóa"
            const partInstanceIndexInSeller = sellerData.garage.parts.findIndex(
              (p) =>
                p.partDefinitionId === partSnap.partDefinitionId && // Giả sử partDefinitionId là đủ để định danh (cần cẩn thận nếu có nhiều instance cùng defId)
                carInstanceSoldBySeller.installedParts
                  .get(partSnap.slot)
                  ?.toString() === p._id.toString(), // Đảm bảo đó là part đang lắp trên xe bị bán
            );

            if (partInstanceIndexInSeller !== -1) {
              // Xóa PartInstance này khỏi kho người bán
              sellerData.garage.parts.splice(partInstanceIndexInSeller, 1);
            } else {
              Logger.warn(
                `[Market-Buy Car] PartInstance (DefID: ${partSnap.partDefinitionId}, Slot: ${partSnap.slot}) for sold car ${listing.itemId} not found in seller's ${sellerData.userId} parts. It might have been double-listed or an issue with snapshot.`,
              );
              // Có thể bỏ qua phụ tùng này hoặc báo lỗi tùy logic
            }

            // Tạo PartInstance mới cho người mua
            const newPartForBuyer = {
              partDefinitionId: partSnap.partDefinitionId,
              acquiredAt: new Date(),
              // installedOnCar sẽ được gán sau khi có _id của newCarForBuyer
            };
            partsToTransferToBuyer.push({
              slot: partSnap.slot,
              partData: newPartForBuyer,
            });
          }
        }
        sellerData.garage.cars.splice(carIndexInSellerGarage, 1); // Xóa xe khỏi người bán
        sellerData.markModified("garage.cars");
        sellerData.markModified("garage.parts"); // Vì đã xóa parts khỏi người bán

        // Lưu buyerData để newCarForBuyer có _id
        await buyerData.save({ buySession }); // Lưu trước để xe mới có _id
        const newlyAddedCarInstance =
          buyerData.garage.cars[buyerData.garage.cars.length - 1];

        for (const { slot, partData } of partsToTransferToBuyer) {
          partData.installedOnCar = newlyAddedCarInstance._id; // Gán ID xe mới của người mua
          buyerData.garage.parts.push(partData);
          // Lấy _id của part vừa push vào
          const newlyAddedPartInstance =
            buyerData.garage.parts[buyerData.garage.parts.length - 1];
          newlyAddedCarInstance.installedParts.set(
            slot,
            newlyAddedPartInstance._id,
          );
        }
        buyerData.markModified("garage.cars");
        buyerData.markModified("garage.parts");
      } else if (listing.itemType === "part_instance") {
        actualBoughtQuantity = 1; // Phụ tùng bán lẻ từng instance
        if (
          quantityToBuyOption !== null &&
          quantityToBuyOption !== undefined &&
          quantityToBuyOption !== 1
        ) {
          throw new Error(
            "Khi mua phụ tùng từ chợ, bạn chỉ có thể mua từng chiếc một (số lượng là 1).",
          );
        }
        finalTotalPrice = listing.price; // price của listing phụ tùng là giá cho chiếc đó

        if (buyerData.balance < finalTotalPrice) {
          throw new Error(
            `Bạn không đủ tiền. Cần **${finalTotalPrice.toLocaleString()} VNĐ**, bạn có **${buyerData.balance.toLocaleString()} VNĐ**.`,
          );
        }

        // Xóa PartInstance khỏi kho người bán
        const partIndexInSellerGarage = sellerData.garage.parts.findIndex(
          (p) => p._id.toString() === listing.itemId,
        );
        if (partIndexInSellerGarage === -1) {
          listing.status = "cancelled";
          await listing.save({ buySession });
          throw new Error(
            "Phụ tùng này không còn tồn tại trong kho của người bán. Tin đăng sẽ được hủy.",
          );
        }
        sellerData.garage.parts.splice(partIndexInSellerGarage, 1);
        sellerData.markModified("garage.parts");

        // Tạo PartInstance mới cho người mua
        const newPartForBuyer = {
          partDefinitionId: listing.itemSnapshot.partDefinitionId, // Lấy từ snapshot
          acquiredAt: new Date(),
          installedOnCar: null, // Mua về kho thì chưa lắp
          // Các trường khác nếu có trong PartInstanceSchema sẽ lấy default
        };
        buyerData.garage.parts.push(newPartForBuyer);
        buyerData.markModified("garage.parts");
      } else {
        throw new Error("Loại vật phẩm không xác định trên chợ.");
      }

      // --- Thực hiện giao dịch tiền tệ và thuế ---
      buyerData.balance -= finalTotalPrice;
      buyerData.totalSpent = (buyerData.totalSpent || 0) + finalTotalPrice;

      const marketTaxRate = 0.07; // 7%
      const taxAmount = Math.floor(finalTotalPrice * marketTaxRate);
      const amountToSeller = finalTotalPrice - taxAmount;

      sellerData.balance += amountToSeller;
      sellerData.totalEarned = (sellerData.totalEarned || 0) + amountToSeller;

      if (taxAmount > 0) {
        const botUserId = interaction.client.user.id;
        await User.findOneAndUpdate(
          { userId: botUserId, guildId: guildId },
          { $inc: { balance: taxAmount, totalEarned: taxAmount } },
          { upsert: true, new: true, session: buySession },
        );
      }

      // Cập nhật listing (nếu là shop_item và còn hàng) hoặc xóa
      if (listing.itemType === "shop_item") {
        listing.quantity -= actualBoughtQuantity;
        if (listing.quantity <= 0) {
          await MarketListing.deleteOne({ _id: listing._id }).session(
            buySession,
          );
        } else {
          await listing.save({ buySession });
        }
      } else {
        // Với car_instance và part_instance, sau khi bán là xóa listing
        await MarketListing.deleteOne({ _id: listing._id }).session(buySession);
      }

      await buyerData.save({ buySession });
      await sellerData.save({ buySession });

      // Ghi log giao dịch
      const transactionRecord = new MarketTransaction({
        guildId: guildId,
        listingId: listing._id, // ID tin đăng gốc
        itemType: listing.itemType, // Thêm itemType
        itemId: listing.itemId, // ID của shop_item, CarInstance hoặc PartInstance GỐC của người bán
        itemName: boughtItemNameDisplay,
        quantity: actualBoughtQuantity,
        pricePerItem:
          listing.itemType === "shop_item" ||
          listing.itemType === "part_instance"
            ? listing.price
            : finalTotalPrice, // Giá mỗi đơn vị hoặc tổng giá xe
        totalPrice: finalTotalPrice,
        taxAmount: taxAmount,
        buyerId: buyerId,
        buyerUsername: interaction.user.username,
        sellerId: listing.sellerId,
        sellerUsername: sellerData.username || listing.sellerUsername,
      });
      await transactionRecord.save({ session });

      await buySession.commitTransaction();

      // Thông báo thành công
      const successEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🛒 Mua Hàng Thành Công!")
        .setDescription(
          `Bạn đã mua thành công **${actualBoughtQuantity} ${boughtItemNameDisplay}** từ người bán **${listing.sellerUsername}**.`,
        )
        .addFields(
          {
            name: "💸 Tổng chi phí",
            value: `${finalTotalPrice.toLocaleString()} VNĐ`,
          },
          {
            name: "💰 Tiền người bán nhận (sau thuế 7%)",
            value: `${amountToSeller.toLocaleString()} VNĐ`,
          },
          { name: "🧾 ID Tin đăng (cũ)", value: `\`${listingIdString}\`` },
        )
        .setTimestamp()
        .setFooter({
          text: `Người mua: ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.editReply({ embeds: [successEmbed] });

      // Gửi DM cho người bán
      if (sellerIdForDM) {
        try {
          const sellerUserObj =
            await interaction.client.users.fetch(sellerIdForDM);
          if (sellerUserObj) {
            const dmEmbed = new EmbedBuilder()
              .setColor("Blue")
              .setTitle("🔔 Thông Báo Chợ: Vật Phẩm/Xe Đã Bán!")
              .setDescription(`Món hàng của bạn đã được bán trên chợ.`)
              .addFields(
                {
                  name: "🛍️ Vật phẩm/Xe",
                  value: `${actualBoughtQuantity} ${boughtItemNameDisplay}`,
                },
                {
                  name: "👤 Người mua",
                  value: `${interaction.user.tag} (\`${buyerId}\`)`,
                },
                {
                  name: "💰 Số tiền bạn nhận (sau thuế 7%)",
                  value: `${amountToSeller.toLocaleString()} VNĐ`,
                },
              )
              .setTimestamp()
              .setFooter({ text: `Server: ${interaction.guild.name}` });
            await sellerUserObj
              .send({ embeds: [dmEmbed] })
              .catch((dmErr) =>
                Logger.warn(
                  `Could not DM seller ${sellerIdForDM}: ${dmErr.message}`,
                ),
              );
          }
        } catch (dmError) {
          Logger.warn(
            `[Market-Buy] Không thể gửi DM cho người bán ${sellerIdForDM}: ${dmError.message}`,
          );
        }
      }

      // Gửi thông báo ra kênh chung (nếu có)
      const guildConfig = await GuildConfig.findOne({
        guildId: interaction.guild.id,
      }); // Query ngoài session nếu cần
      if (guildConfig && guildConfig.marketNotificationChannelId) {
        marketNotiChannelId = guildConfig.marketNotificationChannelId;
      }
    } catch (error) {
      await buySession.abortTransaction();
      Logger.error(
        `Lỗi lệnh /market-buy (Listing: ${listingIdString}, Buyer: ${buyerId}): ${error.message}`,
        { stack: error.stack },
      );
      await interaction.editReply({
        content: `❌ Lỗi khi mua: ${error.message}`,
      });
    } finally {
      await buySession.endSession();
    }

    // Gửi thông báo vào kênh market-notification sau khi transaction đã kết thúc
    if (marketNotiChannelId && finalTotalPrice > 0) {
      // Chỉ gửi nếu giao dịch thành công
      try {
        const channel = await interaction.client.channels
          .fetch(marketNotiChannelId)
          .catch(() => null);
        if (channel && channel.isTextBased()) {
          const marketNotiEmbed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle("📈 Giao Dịch Chợ Mới")
            .addFields(
              {
                name: "🛍️ Vật phẩm/Xe",
                value: `${actualBoughtQuantity} ${boughtItemNameDisplay}`,
              },
              { name: "👤 Người mua", value: `${interaction.user.tag}` },
              {
                name: "💰 Người bán",
                value: `${(await User.findOne({ userId: sellerIdForDM }))?.username || sellerIdForDM}`,
              }, // Lấy username mới nhất
              {
                name: "💸 Giá trị giao dịch",
                value: `${finalTotalPrice.toLocaleString()} VNĐ`,
              },
            )
            .setTimestamp()
            .setFooter({
              text: `Server: ${interaction.guild.name}`,
              iconURL: interaction.guild.iconURL(),
            });
          await channel.send({ embeds: [marketNotiEmbed] });
        }
      } catch (e) {
        Logger.warn(
          `Error sending market notification to channel ${marketNotiChannelId}: ${e.message}`,
        );
      }
    }
  },
};
