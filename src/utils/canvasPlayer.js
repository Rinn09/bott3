// src/utils/canvasPlayer.js
const { createCanvas, loadImage } = require("canvas");
const path = require("path"); // Để load font nếu cần

function formatDuration(ms) {
  if (!ms || !isFinite(ms) || ms <= 0) return "00:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0)
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function createPlayerCard(trackInfo, currentPosition, isPaused = false) {
  const canvasWidth = 600;
  const canvasHeight = 180;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 1. Vẽ nền (ví dụ: màu gradient hoặc ảnh mờ)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#2c3e50");
  gradient.addColorStop(1, "#34495e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Tải và vẽ ảnh thumbnail (nếu có)
  const artworkSize = 140;
  const artworkX = 20;
  const artworkY = (canvasHeight - artworkSize) / 2;
  try {
    if (trackInfo.artworkUrl) {
      const artwork = await loadImage(trackInfo.artworkUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        artworkX + artworkSize / 2,
        artworkY + artworkSize / 2,
        artworkSize / 2,
        0,
        Math.PI * 2,
        true,
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(artwork, artworkX, artworkY, artworkSize, artworkSize);
      ctx.restore();
    } else {
      // Ảnh placeholder nếu không có artwork
      ctx.fillStyle = "#7f8c8d";
      ctx.beginPath();
      ctx.arc(
        artworkX + artworkSize / 2,
        artworkY + artworkSize / 2,
        artworkSize / 2,
        0,
        Math.PI * 2,
        true,
      );
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "🎵",
        artworkX + artworkSize / 2,
        artworkY + artworkSize / 2,
      );
    }
  } catch (e) {
    Logger.warn(
      `[Canvas] Failed to load artwork for ${trackInfo.title}: ${e.message}`,
    );
    // Vẽ placeholder nếu lỗi tải ảnh
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(artworkX, artworkY, artworkSize, artworkSize);
  }

  // 3. Vẽ thông tin bài hát
  const textX = artworkX + artworkSize + 20;
  const textY = 40;
  ctx.fillStyle = "white";

  // Tên bài hát (giới hạn độ dài)
  ctx.font = "bold 24px Arial"; // Font to hơn cho title
  let title = trackInfo.title;
  const maxTitleWidth = canvasWidth - textX - 20;
  if (ctx.measureText(title).width > maxTitleWidth) {
    while (
      ctx.measureText(title + "...").width > maxTitleWidth &&
      title.length > 0
    ) {
      title = title.slice(0, -1);
    }
    title += "...";
  }
  ctx.fillText(title, textX, textY);

  // Tác giả
  ctx.font = "18px Arial";
  ctx.fillStyle = "#bdc3c7"; // Màu xám nhạt hơn cho artist
  ctx.fillText(trackInfo.author, textX, textY + 30);

  // 4. Vẽ thanh tiến trình
  const progressBarWidth = canvasWidth - textX - 20;
  const progressBarHeight = 12;
  const progressBarY = textY + 30 + 25;
  const cornerRadius = 6;

  // Nền thanh tiến trình
  ctx.fillStyle = "#566573"; // Màu nền tối hơn chút
  ctx.beginPath();
  ctx.moveTo(textX + cornerRadius, progressBarY);
  ctx.lineTo(textX + progressBarWidth - cornerRadius, progressBarY);
  ctx.arcTo(
    textX + progressBarWidth,
    progressBarY,
    textX + progressBarWidth,
    progressBarY + cornerRadius,
    cornerRadius,
  );
  ctx.lineTo(
    textX + progressBarWidth,
    progressBarY + progressBarHeight - cornerRadius,
  );
  ctx.arcTo(
    textX + progressBarWidth,
    progressBarY + progressBarHeight,
    textX + progressBarWidth - cornerRadius,
    progressBarY + progressBarHeight,
    cornerRadius,
  );
  ctx.lineTo(textX + cornerRadius, progressBarY + progressBarHeight);
  ctx.arcTo(
    textX,
    progressBarY + progressBarHeight,
    textX,
    progressBarY + progressBarHeight - cornerRadius,
    cornerRadius,
  );
  ctx.lineTo(textX, progressBarY + cornerRadius);
  ctx.arcTo(
    textX,
    progressBarY,
    textX + cornerRadius,
    progressBarY,
    cornerRadius,
  );
  ctx.closePath();
  ctx.fill();

  // Phần đã phát của thanh tiến trình
  if (trackInfo.length > 0 && currentPosition > 0) {
    const progress = Math.min(currentPosition / trackInfo.length, 1);
    const currentProgressWidth = progressBarWidth * progress;
    ctx.fillStyle = isPaused ? "#f39c12" : "#2ecc71"; // Màu cam nếu paused, xanh lá nếu đang phát

    ctx.beginPath();
    ctx.moveTo(textX + cornerRadius, progressBarY);
    ctx.lineTo(textX + currentProgressWidth - cornerRadius, progressBarY);
    ctx.arcTo(
      textX + currentProgressWidth,
      progressBarY,
      textX + currentProgressWidth,
      progressBarY + cornerRadius,
      cornerRadius,
    );
    ctx.lineTo(
      textX + currentProgressWidth,
      progressBarY + progressBarHeight - cornerRadius,
    );
    ctx.arcTo(
      textX + currentProgressWidth,
      progressBarY + progressBarHeight,
      textX + currentProgressWidth - cornerRadius,
      progressBarY + progressBarHeight,
      cornerRadius,
    );
    ctx.lineTo(textX + cornerRadius, progressBarY + progressBarHeight);
    ctx.arcTo(
      textX,
      progressBarY + progressBarHeight,
      textX,
      progressBarY + progressBarHeight - cornerRadius,
      cornerRadius,
    );
    ctx.lineTo(textX, progressBarY + cornerRadius);
    ctx.arcTo(
      textX,
      progressBarY,
      textX + cornerRadius,
      progressBarY,
      cornerRadius,
    );
    ctx.closePath();
    ctx.fill();
  }

  // 5. Vẽ thời gian
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText(
    formatDuration(currentPosition),
    textX,
    progressBarY + progressBarHeight + 20,
  );
  ctx.textAlign = "right";
  ctx.fillText(
    formatDuration(trackInfo.length),
    textX + progressBarWidth,
    progressBarY + progressBarHeight + 20,
  );

  return canvas.toBuffer("image/png");
}

module.exports = { createPlayerCard, formatDuration };
