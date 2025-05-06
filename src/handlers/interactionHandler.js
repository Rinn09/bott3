// src/handlers/interactionHandler.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const tradeManager = require('../utils/tradeManager');
const { calculateOfferValue, checkValueDifference, getItemTradeValue } = require('../utils/tradeUtils'); // Import các hàm tính toán
const User = require('../models/User');
const ShopItem = require('../models/ShopItem'); // Cần để lấy tên item
const Logger = require('../utils/logger');
const mongoose = require('mongoose'); // Import mongoose để dùng session (nếu có thể)


// --- HÀM HELPER CHO GIAO DIỆN TRADE ---

/**
 * Lấy tên người dùng từ ID, fallback về ID nếu không fetch được.
 */
async function getUsername(client, userId) {
    try {
        const user = await client.users.fetch(userId);
        return user.username;
    } catch {
        return userId; // Fallback về ID nếu không fetch được user
    }
}

/**
 * Tạo Embed hiển thị trạng thái giao dịch hiện tại.
 */
async function generateTradeEmbed(tradeState, client) {
    // Lấy tên người dùng
    const userAName = await getUsername(client, tradeState.userA.id);
    const userBName = await getUsername(client, tradeState.userB.id);

    // Tính toán giá trị
    const { valid, valueA, valueB, diff, percentDiff } = await checkValueDifference(tradeState.userA.offer, tradeState.userB.offer);

    // Format danh sách vật phẩm
    let itemsA = 'Không có';
    if (tradeState.userA.offer.items.size > 0) {
        const itemPromises = Array.from(tradeState.userA.offer.items.entries()).map(async ([itemId, qty]) => {
            const item = await ShopItem.findOne({ itemId }).lean(); // Dùng lean() cho nhẹ
            return `• ${item?.name || `\`${itemId}\``} (x${qty})`;
        });
        itemsA = (await Promise.all(itemPromises)).join('\n');
    }

    let itemsB = 'Không có';
    if (tradeState.userB.offer.items.size > 0) {
        const itemPromises = Array.from(tradeState.userB.offer.items.entries()).map(async ([itemId, qty]) => {
            const item = await ShopItem.findOne({ itemId }).lean();
            return `• ${item?.name || `\`${itemId}\``} (x${qty})`;
        });
        itemsB = (await Promise.all(itemPromises)).join('\n');
    }

    const embed = new EmbedBuilder()
        .setTitle(` Giao dịch: ${userAName} vs ${userBName}`)
        .setColor(valid ? '#57F287' : '#FEE75C') // Xanh lá nếu hợp lệ, Vàng nếu không
        .addFields(
            {
                name: `${userAName} đề nghị ${tradeState.userA.confirmed ? '✅' : '❓'}`,
                value: `**Tiền:** ${tradeState.userA.offer.money.toLocaleString()} VNĐ\n**Vật phẩm:**\n${itemsA}`,
                inline: true
            },
            {
                name: `${userBName} đề nghị ${tradeState.userB.confirmed ? '✅' : '❓'}`,
                value: `**Tiền:** ${tradeState.userB.offer.money.toLocaleString()} VNĐ\n**Vật phẩm:**\n${itemsB}`,
                inline: true
            },
            { name: '\u200B', value: '\u200B' }, // Dòng trống phân cách
            { name: 'Giá trị Ước tính', value: `**${userAName}:** ${valueA.toLocaleString()} VNĐ\n**${userBName}:** ${valueB.toLocaleString()} VNĐ`, inline: true },
            { name: 'Chênh lệch', value: `${diff.toLocaleString()} VNĐ (${percentDiff.toFixed(1)}%)`, inline: true },
            { name: 'Trạng thái', value: valid ? 'Hợp lệ (Chênh lệch <= 20%)' : 'Không hợp lệ (Chênh lệch > 20%)', inline: true }
        )
        .setFooter({ text: `Trade ID: ${tradeState.tradeId}` })
        .setTimestamp(tradeState.lastUpdate);

    if (tradeState.userA.confirmed && tradeState.userB.confirmed && !valid) {
         embed.setFooter({ text: `Trade ID: ${tradeState.tradeId} | Lỗi: Giá trị chênh lệch quá 20%!` });
         embed.setColor('Red');
    } else if (tradeState.userA.confirmed && tradeState.userB.confirmed && valid) {
         embed.setFooter({ text: `Trade ID: ${tradeState.tradeId} | ĐANG XỬ LÝ GIAO DỊCH...` });
         embed.setColor('Blue');
    }

    return embed;
}

/**
 * Tạo các ActionRow chứa các nút điều khiển giao dịch.
 */
function generateTradeButtons(tradeState) {
    const tradeId = tradeState.tradeId;
    const userA_id = tradeState.userA.id;
    const userB_id = tradeState.userB.id;

    // Kiểm tra lại giá trị để disable nút Confirm
    // Lưu ý: checkValueDifference là async, nhưng ở đây ta chỉ cần trạng thái gần đúng để disable nút
    // Có thể cần tính lại đồng bộ hoặc chấp nhận độ trễ nhỏ
    const valueA = tradeState.userA.offer.money + tradeState.userA.offer.items.size; // Check nhanh có offer ko
    const valueB = tradeState.userB.offer.money + tradeState.userB.offer.items.size;
    const canConfirm = valueA > 0 || valueB > 0; // Cho phép confirm nếu ít nhất 1 bên có offer


    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`trade_add_item_${tradeId}_${userA_id}`).setLabel('A: Thêm Đồ').setStyle(ButtonStyle.Secondary).setEmoji('➕').setDisabled(tradeState.userA.confirmed || tradeState.userB.confirmed), // Disable khi đã confirm
        new ButtonBuilder().setCustomId(`trade_add_money_${tradeId}_${userA_id}`).setLabel('A: Thêm Tiền').setStyle(ButtonStyle.Secondary).setEmoji('💰').setDisabled(tradeState.userA.confirmed || tradeState.userB.confirmed),
        // new ButtonBuilder().setCustomId(`trade_remove_${tradeId}_${userA_id}`).setLabel('A: Xóa').setStyle(ButtonStyle.Secondary).setEmoji('➖').setDisabled(tradeState.userA.confirmed || tradeState.userB.confirmed), // Nút xóa sẽ làm sau
        new ButtonBuilder().setCustomId(`trade_confirm_${tradeId}_${userA_id}`).setLabel(tradeState.userA.confirmed ? 'Bỏ Xác nhận' : 'Xác nhận').setStyle(tradeState.userA.confirmed ? ButtonStyle.Success : ButtonStyle.Primary).setDisabled(!canConfirm), // Disable confirm nếu chưa có offer
        new ButtonBuilder().setCustomId(`trade_cancel_${tradeId}_${userA_id}`).setLabel('Hủy').setStyle(ButtonStyle.Danger) // Nút hủy của A
    );
    const row2 = new ActionRowBuilder().addComponents(
         new ButtonBuilder().setCustomId(`trade_add_item_${tradeId}_${userB_id}`).setLabel('B: Thêm Đồ').setStyle(ButtonStyle.Secondary).setEmoji('➕').setDisabled(tradeState.userA.confirmed || tradeState.userB.confirmed),
        new ButtonBuilder().setCustomId(`trade_add_money_${tradeId}_${userB_id}`).setLabel('B: Thêm Tiền').setStyle(ButtonStyle.Secondary).setEmoji('💰').setDisabled(tradeState.userA.confirmed || tradeState.userB.confirmed),
        // new ButtonBuilder().setCustomId(`trade_remove_${tradeId}_${userB_id}`).setLabel('B: Xóa').setStyle(ButtonStyle.Secondary).setEmoji('➖').setDisabled(tradeState.userA.confirmed || tradeState.userB.confirmed),
        new ButtonBuilder().setCustomId(`trade_confirm_${tradeId}_${userB_id}`).setLabel(tradeState.userB.confirmed ? 'Bỏ Xác nhận' : 'Xác nhận').setStyle(tradeState.userB.confirmed ? ButtonStyle.Success : ButtonStyle.Primary).setDisabled(!canConfirm),
        new ButtonBuilder().setCustomId(`trade_cancel_${tradeId}_${userB_id}`).setLabel('Hủy').setStyle(ButtonStyle.Danger) // Nút hủy của B
    );

    return [row1, row2];
}

/**
 * Hàm thực hiện giao dịch (cần được gọi khi cả hai đã xác nhận và giá trị hợp lệ).
 */
async function executeTrade(tradeState, interaction) {
    const { tradeId, userA, userB, guildId } = tradeState;
    const client = interaction.client; // Lấy client từ interaction

    Logger.info(`[Trade ${tradeId}] Attempting to execute trade between ${userA.id} and ${userB.id}`);

    // Sử dụng transaction nếu có thể (ví dụ với MongoDB session)
    const session = await mongoose.startSession();
    session.startTransaction();
    let tradeSucceeded = false;

    try {
        // 1. Lấy dữ liệu mới nhất và khóa document (nếu dùng session)
        const userAData = await User.findOne({ userId: userA.id, guildId }).session(session);
        const userBData = await User.findOne({ userId: userB.id, guildId }).session(session);

        if (!userAData || !userBData) {
            throw new Error('Không tìm thấy dữ liệu người dùng.');
        }

        // 2. Kiểm tra lại lần cuối xem có đủ tiền/vật phẩm không
        // Kiểm tra tiền
        if (userAData.balance < userA.offer.money) throw new Error(`${await getUsername(client, userA.id)} không đủ tiền.`);
        if (userBData.balance < userB.offer.money) throw new Error(`${await getUsername(client, userB.id)} không đủ tiền.`);
        // Kiểm tra vật phẩm
        for (const [itemId, qty] of userA.offer.items.entries()) {
            if ((userAData.inventory?.get(itemId) || 0) < qty) throw new Error(`${await getUsername(client, userA.id)} không đủ vật phẩm \`${itemId}\`.`);
        }
        for (const [itemId, qty] of userB.offer.items.entries()) {
            if ((userBData.inventory?.get(itemId) || 0) < qty) throw new Error(`${await getUsername(client, userB.id)} không đủ vật phẩm \`${itemId}\`.`);
        }

        // 3. Thực hiện chuyển đổi
        // Trừ tiền
        userAData.balance -= userA.offer.money;
        userBData.balance -= userB.offer.money;
        // Cộng tiền
        userAData.balance += userB.offer.money;
        userBData.balance += userA.offer.money;

        // Trừ vật phẩm A, cộng vật phẩm B
        for (const [itemId, qty] of userA.offer.items.entries()) {
            const currentQtyA = userAData.inventory.get(itemId);
            userAData.inventory.set(itemId, currentQtyA - qty);
            if (userAData.inventory.get(itemId) <= 0) userAData.inventory.delete(itemId);

            const currentQtyB = userBData.inventory.get(itemId) || 0;
            userBData.inventory.set(itemId, currentQtyB + qty);
        }
        // Trừ vật phẩm B, cộng vật phẩm A
         for (const [itemId, qty] of userB.offer.items.entries()) {
            const currentQtyB = userBData.inventory.get(itemId);
            userBData.inventory.set(itemId, currentQtyB - qty);
            if (userBData.inventory.get(itemId) <= 0) userBData.inventory.delete(itemId);

            const currentQtyA = userAData.inventory.get(itemId) || 0;
            userAData.inventory.set(itemId, currentQtyA + qty);
        }

        // Đánh dấu inventory đã thay đổi để Mongoose biết cần lưu Map
        userAData.markModified('inventory');
        userBData.markModified('inventory');

        // 4. Lưu thay đổi
        await userAData.save({ session });
        await userBData.save({ session });

        // 5. Commit transaction
        await session.commitTransaction();
        tradeSucceeded = true;
        Logger.info(`[Trade ${tradeId}] Successfully executed.`);

    } catch (error) {
        // Nếu có lỗi, abort transaction
        await session.abortTransaction();
        Logger.error(`[Trade ${tradeId}] Execution failed:`, error);
        // Thông báo lỗi cho người dùng
        await interaction.followUp({ content: `❌ Giao dịch thất bại: ${error.message}`, ephemeral: true }).catch(()=>{}); // Gửi thông báo lỗi riêng
        tradeSucceeded = false; // Đánh dấu thất bại
    } finally {
        // Kết thúc session
        await session.endSession();
    }

    // 6. Dọn dẹp và thông báo kết quả
    tradeManager.removeActiveTrade(tradeId); // Xóa trade khỏi trạng thái active

    if (tradeSucceeded) {
        // Cập nhật tin nhắn gốc thành công
        await interaction.message.edit({
             content: ` Giao dịch thành công!`,
             embeds: [await generateTradeEmbed(tradeState, client)], // Hiển thị lại embed cuối cùng
             components: [] // Xóa nút
        }).catch(err => Logger.error(`[Trade ${tradeId}] Failed to edit message on success:`, err));
    } else {
         // Cập nhật tin nhắn gốc thất bại (nếu chưa bị hủy bởi collector end)
         await interaction.message.edit({
              content: ` Giao dịch thất bại!`,
              embeds: [],
              components: []
         }).catch(err => Logger.error(`[Trade ${tradeId}] Failed to edit message on failure:`, err));
    }
}


/**
 * Bắt đầu collector lắng nghe các tương tác trên giao diện trade.
 */
function startTradeInterfaceCollector(originalInteraction, tradeState) {
    const channel = originalInteraction.channel;
    if (!channel) return;

    const tradeId = tradeState.tradeId;
    const message = originalInteraction.message; // Tin nhắn chứa giao diện trade

    const collector = channel.createMessageComponentCollector({
        filter: i => i.message.id === message.id && i.customId.startsWith(`trade_`) && i.customId.includes(tradeId),
        time: 15 * 60 * 1000 // Timeout 15 phút
    });

    tradeState.collector = collector;

    collector.on('collect', async interaction => {
        const trade = tradeManager.getActiveTrade(tradeId);
        if (!trade) {
            interaction.reply({ content: 'Giao dịch này không còn tồn tại.', ephemeral: true }).catch(()=>{});
            collector.stop();
            return;
        }

        const userId = interaction.user.id;
        const customId = interaction.customId;
        const parts = customId.split('_');
        const action = parts[1];
        const actorId = parts[parts.length - 1];

        if (userId !== actorId || (userId !== trade.userA.id && userId !== trade.userB.id)) {
            return interaction.reply({ content: 'Đây không phải nút dành cho bạn!', ephemeral: true });
        }

        // Xác định người chơi hiện tại (actor) và đối tác (partner)
        const actorKey = userId === trade.userA.id ? 'userA' : 'userB';
        // const partnerKey = userId === trade.userA.id ? 'userB' : 'userA';

        try {
            // --- Xử lý Hủy ---
            if (action === 'cancel') {
                tradeManager.removeActiveTrade(tradeId);
                const initiatorName = await getUsername(interaction.client, trade.userA.id);
                const targetName = await getUsername(interaction.client, trade.userB.id);
                await interaction.update({
                    content: ` Giao dịch giữa ${initiatorName} và ${targetName} đã bị hủy bởi ${interaction.user.username}.`,
                    embeds: [], components: []
                });
                collector.stop('cancelled');
                return;
            }

             // Không cho thay đổi offer nếu ai đó đã confirm
             if (trade.userA.confirmed || trade.userB.confirmed) {
                 if (action === 'add' || action === 'remove') { // Giả sử có nút remove sau này
                     return interaction.reply({ content: '❌ Không thể thay đổi đề nghị khi một trong hai người đã xác nhận. Hãy bỏ xác nhận trước.', ephemeral: true });
                 }
             }


            // --- Xử lý Thêm Vật phẩm ---
            if (action === 'add' && parts[2] === 'item') {
                const modal = new ModalBuilder()
                    .setTitle('Thêm Vật phẩm vào Giao dịch')
                    .setCustomId(`trade_add_item_modal_${tradeId}_${userId}`);
                const itemIdInput = new TextInputBuilder()
                    .setCustomId('trade_item_id')
                    .setLabel('ID Vật phẩm (Xem ID bằng /inventory)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                const quantityInput = new TextInputBuilder()
                    .setCustomId('trade_item_quantity')
                    .setLabel('Số lượng')
                    .setStyle(TextInputStyle.Short)
                    .setValue('1')
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(itemIdInput),
                    new ActionRowBuilder().addComponents(quantityInput)
                );
                await interaction.showModal(modal);
                // Logic xử lý modal submit sẽ nằm trong listener interactionCreate
                return; // Dừng ở đây, chờ modal submit
            }

            // --- Xử lý Thêm Tiền ---
            if (action === 'add' && parts[2] === 'money') {
                const modal = new ModalBuilder()
                    .setTitle('Thêm Tiền vào Giao dịch')
                    .setCustomId(`trade_add_money_modal_${tradeId}_${userId}`);
                const amountInput = new TextInputBuilder()
                    .setCustomId('trade_money_amount')
                    .setLabel('Số tiền VNĐ')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('0')
                    .setRequired(true);
                 modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
                 await interaction.showModal(modal);
                 // Logic xử lý modal submit sẽ nằm trong listener interactionCreate
                 return; // Dừng ở đây, chờ modal submit
            }

            // --- Xử lý Xác nhận / Bỏ Xác nhận ---
            if (action === 'confirm') {
                trade[actorKey].confirmed = !trade[actorKey].confirmed; // Đảo ngược trạng thái confirm

                if (trade[actorKey].confirmed) {
                    // Kiểm tra giá trị trước khi cho phép confirm cuối cùng
                     const checkResult = await checkValueDifference(trade.userA.offer, trade.userB.offer);
                     if (!checkResult.valid) {
                         trade[actorKey].confirmed = false; // Không cho confirm nếu giá trị không hợp lệ
                          await interaction.reply({ content: '❌ Giá trị giao dịch chênh lệch quá 20%, không thể xác nhận!', ephemeral: true });
                          // Cập nhật lại embed và button để hiển thị lỗi và trạng thái confirm đã reset
                          const updatedEmbed = await generateTradeEmbed(trade, interaction.client);
                          const updatedButtons = generateTradeButtons(trade);
                          await interaction.message.edit({ embeds: [updatedEmbed], components: updatedButtons }).catch(()=>{}); // Edit tin nhắn gốc
                          return;
                     }
                }


                tradeManager.updateActiveTrade(tradeId, {
                    userA_confirmed: trade.userA.confirmed, // Cập nhật cả hai để đảm bảo đồng bộ
                    userB_confirmed: trade.userB.confirmed,
                });

                 // Kiểm tra xem cả hai đã xác nhận chưa
                if (trade.userA.confirmed && trade.userB.confirmed) {
                    // --- THỰC HIỆN GIAO DỊCH ---
                    await interaction.update({ content: ' Cả hai đã xác nhận, đang xử lý giao dịch...', components: [], embeds: [await generateTradeEmbed(trade, interaction.client)] }); // Cập nhật trạng thái
                    await executeTrade(trade, interaction); // Gọi hàm thực hiện trade
                    collector.stop('completed'); // Dừng collector sau khi thực hiện
                    return;
                } else {
                    // Chỉ một người xác nhận hoặc bỏ xác nhận
                    const updatedEmbed = await generateTradeEmbed(trade, interaction.client);
                    const updatedButtons = generateTradeButtons(trade);
                    await interaction.update({ embeds: [updatedEmbed], components: updatedButtons });
                }
                 return; // Đã xử lý xong confirm
            }


             // Trường hợp nút khác chưa xử lý
             await interaction.reply({ content: `Hành động ${action} chưa được hỗ trợ.`, ephemeral: true });


        } catch (error) {
            Logger.error(`[Trade Collector Error - Trade ${tradeId}]`, error);
            await interaction.followUp({ content: 'Có lỗi xảy ra trong quá trình xử lý giao dịch.', ephemeral: true }).catch(()=>{});
        }
    });

    collector.on('end', (collected, reason) => {
        const trade = tradeManager.getActiveTrade(tradeId);
         if (trade && reason !== 'cancelled' && reason !== 'completed' && reason !== 'trade_removed') {
            Logger.info(`[Trade ${tradeId}] Collector ended. Reason: ${reason}`);
            tradeManager.removeActiveTrade(tradeId);
             message.edit({ content: ' Giao dịch đã kết thúc do hết thời gian hoặc lỗi.', embeds: [], components: [] }).catch(()=>{});
        }
    });
}


// --- MODULE EXPORTS ---
module.exports = (client) => {
    client.buttons = new Map();
    client.selectMenus = new Map();

    // --- Load Buttons/Selects từ file (giữ nguyên) ---
    const buttonPath = path.join(__dirname, '../interactions/buttons');
    if (fs.existsSync(buttonPath)){
        fs.readdirSync(buttonPath).filter(file => file.endsWith('.js')).forEach(file => {
          try {
              const button = require(path.join(buttonPath, file));
              if (button.customId && typeof button.execute === 'function'){
                  client.buttons.set(button.customId, button);
              } else { Logger.warn(`Button handler at ${file} is missing customId or execute function.`); }
          } catch (err) { Logger.error(`Failed to load button handler ${file}:`, err); }
        });
    } else { Logger.warn(`Button directory not found: ${buttonPath}`); }

    const selectPath = path.join(__dirname, '../interactions/selects');
     if (fs.existsSync(selectPath)) {
        fs.readdirSync(selectPath).filter(file => file.endsWith('.js')).forEach(file => {
          try {
              const menu = require(path.join(selectPath, file));
              if (menu.customId && typeof menu.execute === 'function'){
                   client.selectMenus.set(menu.customId, menu);
              } else { Logger.warn(`Select menu handler at ${file} is missing customId or execute function.`); }
          } catch (err) { Logger.error(`Failed to load select menu handler ${file}:`, err); }
        });
     } else { Logger.warn(`Select menu directory not found: ${selectPath}`); }


    // --- SỰ KIỆN INTERACTION CREATE ---
    client.on('interactionCreate', async interaction => {
        // Không log interaction ở đây để tránh spam

        try {
            // --- XỬ LÝ TRADE ACCEPT/DECLINE BUTTON ---
            if (interaction.isButton()) {
                const customId = interaction.customId;
                if (customId.startsWith('trade_accept_') || customId.startsWith('trade_decline_')) {
                    // ... (Logic xử lý accept/decline đã viết ở trên) ...
                     const tradeId = customId.split('_')[2];
                     const pendingTrade = tradeManager.getPendingTrade(tradeId);

                     if (!pendingTrade) { /* ... xử lý trade không hợp lệ ... */ return; }
                     if (interaction.user.id !== pendingTrade.targetId) { /* ... xử lý không phải người nhận ... */ return; }

                     if (customId.startsWith('trade_decline_')) {
                         tradeManager.removePendingTrade(tradeId);
                         // ... update interaction ...
                     } else { // Accept
                         tradeManager.removePendingTrade(tradeId);
                         if (tradeManager.isUserInTrade(pendingTrade.initiatorId) || tradeManager.isUserInTrade(pendingTrade.targetId)) {
                            // ... xử lý lỗi đã trong trade khác ...
                            return;
                         }
                         const initialTradeState = tradeManager.createActiveTrade(tradeId, pendingTrade.initiatorId, pendingTrade.targetId, pendingTrade.guildId, pendingTrade.channelId, interaction.message.id, interaction);
                         if (!initialTradeState) { /* ... xử lý lỗi tạo trade ... */ return; }

                         const tradeEmbed = await generateTradeEmbed(initialTradeState, client); // Truyền client vào
                         const tradeButtons = generateTradeButtons(initialTradeState);
                         // ... lấy tên user ...
                         await interaction.update({ /* ... update giao diện ... */ });
                         startTradeInterfaceCollector(interaction, initialTradeState);
                     }
                    return; // Đã xử lý, dừng lại
                }
            }

             // --- XỬ LÝ MODAL SUBMIT CỦA TRADE ---
            if (interaction.isModalSubmit()) {
                 const customId = interaction.customId;
                 if (customId.startsWith('trade_add_item_modal_') || customId.startsWith('trade_add_money_modal_')) {
                    const parts = customId.split('_');
                    const tradeId = parts[4];
                    const userId = parts[5];

                    // Chỉ người gửi modal mới được xử lý
                    if (interaction.user.id !== userId) {
                        return interaction.reply({ content: 'Modal này không dành cho bạn!', ephemeral: true});
                    }

                    const trade = tradeManager.getActiveTrade(tradeId);
                    if (!trade) {
                        return interaction.reply({ content: 'Giao dịch này không còn tồn tại.', ephemeral: true });
                    }
                    // Không cho submit modal nếu ai đó đã confirm
                     if (trade.userA.confirmed || trade.userB.confirmed) {
                         return interaction.reply({ content: '❌ Không thể thay đổi đề nghị khi một trong hai người đã xác nhận.', ephemeral: true });
                     }


                    const actorKey = userId === trade.userA.id ? 'userA' : 'userB';

                    if (customId.startsWith('trade_add_item_modal_')) {
                        // --- Xử lý thêm item ---
                        const itemId = interaction.fields.getTextInputValue('trade_item_id').toLowerCase();
                        const quantityStr = interaction.fields.getTextInputValue('trade_item_quantity');
                        const quantity = parseInt(quantityStr);

                        if (isNaN(quantity) || quantity <= 0) {
                            return interaction.reply({ content: 'Số lượng không hợp lệ.', ephemeral: true });
                        }

                        const itemData = await ShopItem.findOne({ itemId });
                        if (!itemData) {
                            return interaction.reply({ content: `Không tìm thấy vật phẩm ID: ${itemId}`, ephemeral: true });
                        }

                        // Kiểm tra inventory người dùng
                        const userData = await User.findOne({ userId, guildId: trade.guildId });
                        const userQty = userData?.inventory?.get(itemId) || 0;

                        // Kiểm tra xem số lượng thêm vào có vượt quá số lượng đang có không
                        const currentOfferQty = trade[actorKey].offer.items.get(itemId) || 0;
                        if (userQty < currentOfferQty + quantity) {
                            return interaction.reply({ content: `Bạn không đủ ${quantity} ${itemData.name}. Bạn có ${userQty} và đã đề nghị ${currentOfferQty}.`, ephemeral: true });
                        }

                        // Cập nhật offer
                        trade[actorKey].offer.items.set(itemId, currentOfferQty + quantity);

                    } else { // trade_add_money_modal_
                        // --- Xử lý thêm tiền ---
                        const amountStr = interaction.fields.getTextInputValue('trade_money_amount');
                        const amount = parseInt(amountStr);

                         if (isNaN(amount) || amount <= 0) {
                            return interaction.reply({ content: 'Số tiền không hợp lệ.', ephemeral: true });
                        }
                         // Kiểm tra balance người dùng
                        const userData = await User.findOne({ userId, guildId: trade.guildId });
                        const userBalance = userData?.balance || 0;

                        if (userBalance < trade[actorKey].offer.money + amount) {
                             return interaction.reply({ content: `Bạn không đủ ${amount.toLocaleString()} VNĐ. Bạn có ${userBalance.toLocaleString()} VNĐ và đã đề nghị ${trade[actorKey].offer.money.toLocaleString()} VNĐ.`, ephemeral: true });
                        }
                         // Cập nhật offer
                        trade[actorKey].offer.money += amount;
                    }

                     // Reset confirmations và cập nhật state
                    trade.userA.confirmed = false;
                    trade.userB.confirmed = false;
                    tradeManager.updateActiveTrade(tradeId, {
                        userA_offer: trade.userA.offer,
                        userB_offer: trade.userB.offer,
                        userA_confirmed: false,
                        userB_confirmed: false,
                    });

                    // Cập nhật giao diện trade
                    const updatedEmbed = await generateTradeEmbed(trade, client);
                    const updatedButtons = generateTradeButtons(trade);

                    // Cập nhật tin nhắn gốc bằng interaction của message (trade.interaction)
                    await trade.interaction.message.edit({ embeds: [updatedEmbed], components: updatedButtons }).catch(err => Logger.error(`[Trade ${tradeId}] Failed to edit message after modal submit:`, err));

                    // Phản hồi modal submit thành công
                    await interaction.reply({ content: 'Đã cập nhật đề nghị giao dịch!', ephemeral: true});

                    return; // Đã xử lý modal trade
                 }
            } // Kết thúc isModalSubmit

            // --- Xử lý các Buttons/Selects từ file (giữ nguyên logic cũ) ---
            if (interaction.isButton()) {
                const handler = client.buttons.get(interaction.customId);
                if (handler) await handler.execute(interaction);
            } else if (interaction.isStringSelectMenu()) {
                const handler = client.selectMenus.get(interaction.customId);
                if (handler) await handler.execute(interaction);
            } else if (interaction.isChatInputCommand()) { // Xử lý slash command (nếu cần)
                // ... (logic xử lý slash command của bạn) ...
                 const command = client.commands.get(interaction.commandName);
                 if (command) await command.execute(interaction, client);
            }

        } catch (err) {
            Logger.error('[Interaction Handler Error]', err);
             try {
                 if (interaction.replied || interaction.deferred) {
                   await interaction.followUp({ content: '❌ Đã xảy ra lỗi khi xử lý tương tác!', ephemeral: true });
                 } else {
                   await interaction.reply({ content: '❌ Đã xảy ra lỗi khi xử lý tương tác!', ephemeral: true });
                 }
             } catch (replyError) { Logger.error('[Interaction Error] Failed to send error reply:', replyError); }
        }
    });
};