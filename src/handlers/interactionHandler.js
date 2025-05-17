const fs = require("fs");
const path = require("path");
const User = require("../models/User"); // Đảm bảo import User model
const Logger = require("../utils/logger");
const { dealCards, formatHandEmojis } = require("../utils/deckUtils");
const mongoose = require("mongoose");
const {
  activeBlackjackGames,
  getHandDetails,
  createXidachEmbed,
  createXidachButtons,
  calculateBlackjackHandValue,
  PAYOUT_XIBAN,
  PAYOUT_XIDACH,
  PAYOUT_NGULINH,
  PAYOUT_NORMAL,
  GAME_ID_XIDACH,
} = require("../commands/games/xidach");

module.exports = (client) => {
  client.buttons = new Map();

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
      const [prefix, action, originalInteractionId] =
        interaction.customId.split("_");
      const gameData = activeBlackjackGames.get(originalInteractionId);

      if (
        !gameData ||
        gameData.playerId !== interaction.user.id ||
        gameData.gameOver
      ) {
        return interaction
          .reply({
            content: "Ván Xì Dách này không hợp lệ hoặc đã kết thúc.",
            ephemeral: true,
          })
          .catch(() => {});
      }

      await interaction.deferUpdate();
      const session = await mongoose.startSession(); // Transaction mới cho mỗi button action

      try {
        await session.startTransaction();
        // Lấy lại user document trong session mới bằng userDocId đã lưu
        let user = await User.findById(gameData.userDocId).session(session);
        if (!user) {
          throw new Error(
            "Không tìm thấy dữ liệu người chơi trong DB cho ván bài này.",
          );
        }
        // Gán lại user vào gameData để đảm bảo các thay đổi balance được áp dụng trên user document trong session
        gameData.user = user;

        let finalResultMessage = "";
        let playerActionTaken = false;
        let xpGainXidach = 0; // Khai báo ở đây

        // ... (logic xử lý action 'hit', 'stand', 'double' như cũ)
        // QUAN TRỌNG: Khi double down, phải save user trong transaction
        if (action === "double") {
          const playerCurrentDetails = getHandDetails(gameData.playerHand);
          if (
            playerCurrentDetails.numCards === 2 &&
            !gameData.doubledDown &&
            gameData.user.balance >= gameData.betAmount
          ) {
            gameData.user.balance -= gameData.betAmount;
            gameData.user.totalSpent += gameData.betAmount;
            gameData.betAmount *= 2;
            gameData.doubledDown = true;
            // await gameData.user.save({ session }); // Lưu lại balance sau khi trừ tiền double

            const newCard = dealCards(gameData.deck, 1);
            // ...
            playerActionTaken = true;
          }
        } else if (action === "hit") {
          /* ... */ playerActionTaken = true;
        } else if (action === "stand") {
          /* ... */ playerActionTaken = true;
        }

        if (!playerActionTaken && !gameData.gameOver) {
          await session.abortTransaction();
          session.endSession();
          return;
        }

        const playerFinalDetails = getHandDetails(gameData.playerHand);

        if (
          playerFinalDetails.isBust ||
          playerFinalDetails.numCards === 5 ||
          action === "stand" ||
          (action === "double" && gameData.playerTurnEnded)
        ) {
          gameData.playerTurnEnded = true;
        }

        if (gameData.playerTurnEnded && !gameData.gameOver) {
          // --- Lượt của Nhà Cái (Bot) ---
          // ... (logic bot chơi như cũ) ...
          let botDetails = getHandDetails(gameData.botHand); // Cập nhật botDetails sau khi bot chơi xong
          gameData.botState = botDetails; // Cập nhật botState

          // --- So sánh kết quả (CẬP NHẬT THEO LUẬT MỚI) ---
          let playerWon = false;
          let push = false;
          let winningsCoefficient = 0; // Hệ số nhân tiền LỜI

          if (playerFinalDetails.isBust) {
            finalResultMessage = `😭 Bạn Quắc (${playerFinalDetails.readable})! Nhà cái thắng.`;
          } else if (botDetails.isBust) {
            finalResultMessage = `🎉 Nhà cái Quắc (${botDetails.readable})! Bạn thắng!`;
            winningsCoefficient = PAYOUT_NORMAL; // Thắng thường
            playerWon = true;
          } else if (playerFinalDetails.isXiBan) {
            // Player Xì Bàn (AA)
            if (botDetails.isXiBan) {
              finalResultMessage = "✨ Cả hai cùng Xì Bàn! Hòa tiền.";
              push = true;
            } else {
              finalResultMessage = `🏆 XÌ BÀN (AA)! Bạn thắng cực lớn!`;
              winningsCoefficient = PAYOUT_XIBAN; // Thắng x2 tiền cược
              playerWon = true;
            }
          } else if (botDetails.isXiBan) {
            // Bot Xì Bàn, Player không Xì Bàn
            finalResultMessage = `😭 Nhà cái có Xì Bàn! Bạn thua.`;
          } else if (playerFinalDetails.isXiZach) {
            // Player Xì Dách (A + 10/J/Q/K)
            if (botDetails.isXiBan) {
              // Bot Xì Bàn > Player Xì Dách
              finalResultMessage = `😭 Nhà cái Xì Bàn! Bạn thua.`;
            } else if (botDetails.isXiZach) {
              finalResultMessage = "✨ Cả hai cùng Xì Dách! Hòa tiền.";
              push = true;
            } else {
              finalResultMessage = `🎉 Xì Dách! Bạn thắng!`;
              winningsCoefficient = PAYOUT_XIDACH; // Thắng x1.5 tiền cược
              playerWon = true;
            }
          } else if (botDetails.isXiZach) {
            // Bot Xì Dách, Player không (Xì Bàn/Xì Dách)
            finalResultMessage = `😭 Nhà cái có Xì Dách! Bạn thua.`;
          } else if (playerFinalDetails.isNguLinh) {
            if (botDetails.isNguLinh) {
              // Cả 2 Ngũ Linh
              if (playerFinalDetails.value < botDetails.value) {
                // Xì Dách Ngũ Linh nhỏ điểm hơn thắng
                finalResultMessage = `✨ Ngũ Linh của bạn (${playerFinalDetails.readable}) thắng Ngũ Linh nhà cái (${botDetails.readable})!`;
                winningsCoefficient = PAYOUT_NGULINH;
                playerWon = true;
              } else if (playerFinalDetails.value > botDetails.value) {
                finalResultMessage = `😭 Ngũ Linh nhà cái (${botDetails.readable}) thắng Ngũ Linh của bạn (${playerFinalDetails.readable})!`;
              } else {
                finalResultMessage = `✨ Cả hai cùng Ngũ Linh và bằng điểm! Hòa tiền.`;
                push = true;
              }
            } else {
              // Player Ngũ Linh, Bot không
              finalResultMessage = `✨ Ngũ Linh! Bạn thắng!`;
              winningsCoefficient = PAYOUT_NGULINH;
              playerWon = true;
            }
          } else if (botDetails.isNguLinh) {
            finalResultMessage = `😭 Nhà cái Ngũ Linh! Bạn thua.`;
          } else if (playerFinalDetails.value > botDetails.value) {
            finalResultMessage = `🎉 Bạn thắng với ${playerFinalDetails.readable}!`;
            winningsCoefficient = PAYOUT_NORMAL;
            playerWon = true;
          } else if (playerFinalDetails.value < botDetails.value) {
            finalResultMessage = `😭 Bạn thua, nhà cái ${botDetails.readable} cao hơn.`;
          } else {
            // Hòa điểm thường
            finalResultMessage = `⚖️ Hòa điểm (${playerFinalDetails.readable})! Bạn được hoàn tiền cược.`;
            push = true;
          }

          // Xử lý tiền thắng/thua
          let netWinLoss = 0;
          if (playerWon) {
            const moneyWon = Math.floor(
              gameData.betAmount * winningsCoefficient,
            );
            const totalReceived = gameData.betAmount + moneyWon; // Hoàn cược + tiền lời
            user.balance += totalReceived;
            user.totalEarned = (user.totalEarned || 0) + totalReceived;
            netWinLoss = moneyWon;
            finalResultMessage += `\nBạn lời **+${netWinLoss.toLocaleString()} VNĐ**.`;
          } else if (push) {
            user.balance += gameData.betAmount; // Hoàn tiền cược
            user.totalSpent -= gameData.betAmount; // Giảm spent vì được hoàn
            netWinLoss = 0;
            finalResultMessage += `\nBạn được hoàn ${gameData.betAmount.toLocaleString()} VNĐ.`;
          } else {
            // Thua
            netWinLoss = -gameData.betAmount;
            // Tiền đã bị trừ ở đầu hoặc lúc double down
            finalResultMessage += `\nBạn mất ${Math.abs(netWinLoss).toLocaleString()} VNĐ.`;
          }

          xpGainXidach = playerWon
            ? getRandomInt(20, 45)
            : push
              ? getRandomInt(5, 15)
              : getRandomInt(5, 10);
          user.xp = (user.xp || 0) + xpGainXidach;
          finalResultMessage += ` XP: +${xpGainXidach}.`;
          gameData.gameOver = true;
        }

        // Cập nhật Embed và Buttons
        const updatedEmbed = createXidachEmbed(
          interaction,
          gameData,
          gameData.playerTurnEnded || gameData.gameOver,
          gameData.gameOver ? finalResultMessage : null,
        );
        const updatedButtons = gameData.gameOver
          ? new ActionRowBuilder()
          : createXidachButtons(originalInteractionId, gameData);

        const originalMessage = await interaction.channel.messages
          .fetch(gameData.messageId)
          .catch(() => null);
        if (originalMessage) {
          await originalMessage.edit({
            embeds: [updatedEmbed],
            components: gameData.gameOver ? [] : [updatedButtons],
          });
        }

        if (gameData.gameOver) {
          activeBlackjackGames.delete(originalInteractionId);
          user.cooldowns.games.set(GAME_ID_XIDACH, Date.now());
          user.markModified("cooldowns.games");
          await user.save({ session }); // LƯU USER TRONG SESSION
          Logger.info(
            `[Game/Xidach Button END] User ${gameData.playerId} game ended. Result: ${finalResultMessage}`,
          );
        }
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        Logger.error(
          `[Xidach Button Handler] Error processing button ${interaction.customId} for user ${interaction.user.id}: ${error.message}`,
          { stack: error.stack },
        );
        const gameMessageOnError = await interaction.channel.messages
          .fetch(gameData?.messageId)
          .catch(() => null);
        if (gameMessageOnError) {
          await gameMessageOnError
            .edit({
              content: "Có lỗi xảy ra khi xử lý. Vui lòng thử lại sau.",
              components: [],
              embeds: [],
            })
            .catch(Logger.error);
        }
        if (gameData) activeBlackjackGames.delete(originalInteractionId);
      } finally {
        session.endSession();
      }
    }
  });
};
