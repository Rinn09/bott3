const fs = require("fs");
const path = require("path");
const User = require("../models/User"); // Đảm bảo import User model
const Logger = require("../utils/logger");
const { dealCards, formatHandEmojis } = require("../utils/deckUtils");
const Emojis = require("../models/emojis");

const {
  activeBlackjackGames,
  getHandDescriptionAndState,
  createXidachEmbed,
  createXidachButtons,
  calculateBlackjackHandValue, // Import hàm này
  NORMAL_WIN_MULTIPLIER,
  GAME_ID_XIDACH,
} = require("../commands/games/xidach");

module.exports = (client) => {
  client.buttons = new Map();
  client.selectMenus = new Map();

  // Load Buttons
  const buttonPath = path.join(__dirname, "../interactions/buttons");
  fs.readdirSync(buttonPath).forEach((file) => {
    const button = require(`${buttonPath}/${file}`);
    client.buttons.set(button.customId, button);
  });

  // Load Select Menus
  const selectPath = path.join(__dirname, "../interactions/selects");
  fs.readdirSync(selectPath).forEach((file) => {
    const menu = require(`${selectPath}/${file}`);
    client.selectMenus.set(menu.customId, menu);
  });

  // Event
  client.on("interactionCreate", async (interaction) => {
    console.log(
      `[INTERACTION] ${interaction.customId} | ${interaction.user.tag}`,
    );
    if (interaction.isButton() && interaction.customId.startsWith("xidach_")) {
      await interaction.deferUpdate(); // Luôn deferUpdate cho button click
      const [prefix, action, originalInteractionId] =
        interaction.customId.split("_");
      const gameData = activeBlackjackGames.get(originalInteractionId);

      if (
        !gameData ||
        gameData.playerId !== interaction.user.id ||
        gameData.gameOver
      ) {
        // Nếu game không tồn tại, không phải người chơi, hoặc game đã kết thúc
        // Có thể gửi tin nhắn ephemeral báo lỗi hoặc không làm gì cả
        if (!gameData) {
          Logger.warn(
            `[Xidach Button] No active game found for interaction ID: ${originalInteractionId} from button ${interaction.customId}`,
          );
          try {
            await interaction.followUp({
              content: "Ván Xì Dách này không còn hoạt động hoặc đã kết thúc.",
              ephemeral: true,
            });
          } catch (e) {
            Logger.error("Error sending followup for ended xidach game", e);
          }
        } else if (gameData.playerId !== interaction.user.id) {
          try {
            await interaction.followUp({
              content: "Đây không phải là ván bài của bạn!",
              ephemeral: true,
            });
          } catch (e) {
            Logger.error(
              "Error sending followup for wrong player xidach game",
              e,
            );
          }
        }
        return;
      }

      let user = gameData.user; // Lấy user document từ gameData
      let finalMessage = "";
      let playerWonOrPushed = null; // null: chưa quyết định, true: thắng/hòa, false: thua

      try {
        if (action === "hit") {
          if (
            gameData.playerHand.length < 5 &&
            calculateBlackjackHandValue(gameData.playerHand) < 21
          ) {
            const newCard = dealCards(gameData.deck, 1);
            if (newCard.length > 0) {
              gameData.playerHand.push(newCard[0]);
              gameData.playerValue = calculateBlackjackHandValue(
                gameData.playerHand,
              ); // Cập nhật playerValue
              Logger.info(
                `[Xidach HIT] User ${gameData.playerId} drew ${newCard[0].emoji}. Hand: ${formatHandEmojis(gameData.playerHand)}`,
              );
            } else {
              finalMessage = "Lỗi: Hết bài trong bộ!"; // Trường hợp hiếm
              gameData.playerTurnEnded = true;
              gameData.gameOver = true;
            }
          }
        } else if (action === "stand") {
          gameData.playerTurnEnded = true;
          Logger.info(
            `[Xidach STAND] User ${gameData.playerId} stands with ${calculateBlackjackHandValue(gameData.playerHand)} points.`,
          );
        } else if (action === "double") {
          if (
            gameData.playerHand.length === 2 &&
            !gameData.doubledDown &&
            user.balance >= gameData.betAmount
          ) {
            user.balance -= gameData.betAmount; // Trừ thêm tiền cược
            user.totalSpent += gameData.betAmount;
            gameData.betAmount *= 2;
            gameData.doubledDown = true;

            const newCard = dealCards(gameData.deck, 1);
            if (newCard.length > 0) {
              gameData.playerHand.push(newCard[0]);
              gameData.playerValue = calculateBlackjackHandValue(
                gameData.playerHand,
              );
              Logger.info(
                `[Xidach DOUBLE] User ${gameData.playerId} doubled down. Drew ${newCard[0].emoji}. Hand: ${formatHandEmojis(gameData.playerHand)}. New bet: ${gameData.betAmount}`,
              );
            } else {
              finalMessage = "Lỗi: Hết bài trong bộ khi cược gấp đôi!";
              gameData.gameOver = true; // Nên kết thúc game nếu không thể chia bài
            }
            gameData.playerTurnEnded = true; // Sau double là hết lượt
          } else {
            // Không thể double, không làm gì, chỉ edit lại embed và button
            // Hoặc gửi tin nhắn ephemeral báo không thể double
          }
        }

        const currentPlayerStatus = getHandDescriptionAndState(
          gameData.playerHand,
        );
        if (
          currentPlayerStatus.isBust ||
          gameData.playerHand.length === 5 ||
          action === "stand" ||
          (action === "double" && gameData.playerTurnEnded)
        ) {
          gameData.playerTurnEnded = true; // Đảm bảo lượt chơi của người chơi đã kết thúc
        }

        if (gameData.playerTurnEnded && !gameData.gameOver) {
          // --- Lượt của Nhà Cái (Bot) ---
          let botCurrentValue = calculateBlackjackHandValue(gameData.botHand);
          let botStatus = getHandDescriptionAndState(gameData.botHand);
          Logger.info(
            `[Xidach BotTurn] Bot initial hand: ${formatHandEmojis(gameData.botHand)} (${botStatus.readable})`,
          );

          while (
            botCurrentValue < 17 &&
            gameData.botHand.length < 5 &&
            !botStatus.isBust
          ) {
            const newBotCard = dealCards(gameData.deck, 1);
            if (newBotCard.length > 0) {
              gameData.botHand.push(newBotCard[0]);
              botCurrentValue = calculateBlackjackHandValue(gameData.botHand);
              botStatus = getHandDescriptionAndState(gameData.botHand);
              Logger.info(
                `[Xidach BotTurn] Bot draws ${newBotCard[0].emoji}. New hand: ${formatHandEmojis(gameData.botHand)} (${botStatus.readable})`,
              );
            } else {
              finalMessage =
                (finalMessage ? finalMessage + "\n" : "") +
                "Lỗi: Hết bài trong bộ cho nhà cái!";
              break; // Thoát vòng lặp nếu hết bài
            }
          }
          gameData.botValue = botCurrentValue; // Cập nhật giá trị cuối cùng của bot
          gameData.botState = botStatus; // Cập nhật trạng thái cuối cùng của bot

          // --- So sánh kết quả ---
          const playerFinalStatus = getHandDescriptionAndState(
            gameData.playerHand,
          ); // Lấy lại trạng thái cuối của player

          if (playerFinalStatus.isBust) {
            finalMessage = `😭 Bạn đã Quắc! Nhà cái thắng. Bạn mất ${gameData.betAmount.toLocaleString()} VNĐ.`;
            playerWonOrPushed = false;
          } else if (botStatus.isBust) {
            finalMessage = `🎉 Nhà cái Quắc! Bạn thắng!`;
            playerWonOrPushed = true;
          } else if (playerFinalStatus.isBlackjack && !botStatus.isBlackjack) {
            // Player Xì Bàn, Bot không
            finalMessage = `👑 Xì Bàn! Bạn thắng lớn!`;
            playerWonOrPushed = true; // Sẽ xử lý payout riêng
          } else if (!playerFinalStatus.isBlackjack && botStatus.isBlackjack) {
            // Bot Xì Bàn, Player không
            finalMessage = `😭 Nhà cái Xì Bàn! Bạn thua.`;
            playerWonOrPushed = false;
          } else if (playerFinalStatus.isNguLinh && !botStatus.isNguLinh) {
            finalMessage = `✨ Ngũ Linh! Bạn thắng!`;
            playerWonOrPushed = true;
          } else if (!playerFinalStatus.isNguLinh && botStatus.isNguLinh) {
            finalMessage = `😭 Nhà cái Ngũ Linh! Bạn thua.`;
            playerWonOrPushed = false;
          } else if (playerFinalStatus.isBlackjack && botStatus.isBlackjack) {
            finalMessage = `✨ Cả hai cùng Xì Bàn! Hòa tiền.`;
            playerWonOrPushed = true; // Hòa là true (nhận lại cược)
          } else if (playerFinalStatus.value > botStatus.value) {
            finalMessage = `🎉 Bạn thắng với ${playerFinalStatus.readable}!`;
            playerWonOrPushed = true;
          } else if (playerFinalStatus.value < botStatus.value) {
            finalMessage = `😭 Bạn thua, nhà cái ${botStatus.readable} cao hơn.`;
            playerWonOrPushed = false;
          } else {
            // Hòa điểm
            finalMessage = `⚖️ Hòa điểm (${playerFinalStatus.readable})! Bạn được hoàn tiền cược.`;
            playerWonOrPushed = true; // Hòa là true (nhận lại cược)
          }

          // Xử lý tiền thắng/thua
          if (playerWonOrPushed !== null) {
            // Game đã có kết quả
            let earnings = 0;
            let netWinLoss = 0;

            if (playerWonOrPushed) {
              // Thắng hoặc hòa
              if (playerFinalStatus.isBlackjack && !botStatus.isBlackjack) {
                earnings = Math.floor(
                  gameData.betAmount * BLACKJACK_PAYOUT_MULTIPLIER,
                ); // Lời 1.5 lần
                user.balance += gameData.betAmount + earnings; // Cộng tiền cược gốc + tiền lời
                user.totalEarned += gameData.betAmount + earnings;
                netWinLoss = earnings;
              } else if (
                playerFinalStatus.value === botStatus.value ||
                (playerFinalStatus.isBlackjack && botStatus.isBlackjack)
              ) {
                // Hòa
                user.balance += gameData.betAmount; // Hoàn tiền
                user.totalSpent -= gameData.betAmount; // Giảm spent vì được hoàn
                netWinLoss = 0;
                finalMessage = `⚖️ Hòa điểm! Bạn được hoàn ${gameData.betAmount.toLocaleString()} VNĐ.`;
              } else {
                // Thắng bình thường
                earnings = Math.floor(
                  gameData.betAmount * NORMAL_WIN_MULTIPLIER,
                ); // Lời 1 lần
                user.balance += gameData.betAmount + earnings;
                user.totalEarned += gameData.betAmount + earnings;
                netWinLoss = earnings;
              }
            } else {
              // Thua
              netWinLoss = -gameData.betAmount;
              // Tiền đã bị trừ lúc bắt đầu game hoặc khi double down
            }

            const xpGainXidach = playerWonOrPushed
              ? getRandomInt(20, 40)
              : getRandomInt(5, 15);
            user.xp = (user.xp || 0) + xpGainXidach;
            finalMessage += `\nBạn ${playerWonOrPushed ? (netWinLoss > 0 ? `lời +${netWinLoss.toLocaleString()}` : "hoà vốn") : `mất ${Math.abs(netWinLoss).toLocaleString()}`} VNĐ. XP: +${xpGainXidach}.`;
            gameData.gameOver = true;
          }
        }

        // Cập nhật Embed và Buttons
        const updatedEmbed = createXidachEmbed(
          interaction,
          gameData,
          gameData.playerTurnEnded || gameData.gameOver,
        );
        let updatedButtons;

        if (gameData.gameOver) {
          updatedButtons = new ActionRowBuilder(); // Không có nút nào khi game kết thúc
          if (finalMessage) {
            // Thêm thông báo kết quả cuối cùng vào embed
            updatedEmbed.addFields({
              name: "--- KẾT QUẢ CUỐI CÙNG ---",
              value: finalMessage,
            });
          }
          activeBlackjackGames.delete(originalInteractionId); // Xóa game khỏi danh sách active
          user.cooldowns.games.set(GAME_ID_XIDACH, Date.now());
          user.markModified("cooldowns.games");
          await user.save(); // Lưu user data lần cuối
          Logger.info(
            `[Game/Xidach END] User ${gameData.playerId} game ended. Bet: ${gameData.betAmount}. Player won: ${playerWonOrPushed}. Final Message: ${finalMessage}`,
          );
        } else {
          updatedButtons = createXidachButtons(originalInteractionId, gameData);
        }

        // Lấy lại message gốc để edit
        const gameMessage = await interaction.channel.messages
          .fetch(gameData.messageId)
          .catch(() => null);
        if (gameMessage) {
          await gameMessage
            .edit({
              embeds: [updatedEmbed],
              components: gameData.gameOver ? [] : [updatedButtons],
            })
            .catch(Logger.error);
        } else {
          Logger.warn(
            `[Xidach Button] Could not fetch original game message ${gameData.messageId} to edit.`,
          );
          // Có thể gửi tin nhắn mới nếu tin nhắn gốc bị xóa
          // await interaction.followUp({ embeds: [updatedEmbed], components: gameData.gameOver ? [] : [updatedButtons], ephemeral: true });
        }
      } catch (error) {
        Logger.error(
          `[Xidach Button Handler] Error processing button ${interaction.customId} for user ${interaction.user.id}: ${error.message}`,
          { stack: error.stack },
        );
        // Không gửi followUp ở đây nữa vì có thể gây lỗi "unknown interaction" nếu interaction gốc đã được xử lý hoặc timeout
      }
    }
  });
};
