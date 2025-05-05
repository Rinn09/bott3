const User = require('../models/User');
const AntiCaps = require('../models/anticaps');
const { EmbedBuilder } = require('discord.js');
const { checkLevelUp } = require('../utils/levelUtil');

// Sử dụng một Map để lưu cooldown XP cho người dùng
const xpCooldowns = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Bỏ qua tin nhắn từ bot hoặc trong DM
    if (message.author.bot || !message.guild) return;
    
    // ----------------- AntiCaps Check (sử dụng cache) -----------------
    try {
      const config = anticapsCache.getConfig(message.guild.id, message.channel.id);

      if (config) {
        const isAllowed = config.allowedUsers.has(message.author.id);

        if (!isAllowed) {
          const content = message.content;
          if (content.length >= 5) { // Chỉ kiểm tra tin nhắn dài hơn 5 ký tự
             const uppercaseChars = content.replace(/[^A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, "").length;
             const relevantLength = content.replace(/\s/g, "").length; // Không tính khoảng trắng

             if (relevantLength > 0 && (uppercaseChars / relevantLength) > 0.7) { // Tăng ngưỡng lên 70% chữ cái in hoa
               await message.delete().catch(err => Logger.warn(`[AntiCaps] Failed to delete message: ${err.message}`));
               const replyMsg = await message.channel.send({
                   content: `${message.author}, vui lòng không viết IN HOA quá nhiều trong kênh này.`,
               });
               // Tự động xóa tin nhắn cảnh báo sau 5 giây
               setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
               return; // Dừng xử lý XP nếu tin nhắn bị xóa
             }
          }
        }
      }
    } catch (err) {
      Logger.error(`[AntiCaps Check Error] ${err.message}`, { stack: err.stack });
      // Vẫn tiếp tục xử lý XP dù có lỗi check anticaps
    }

    // ----------------- XP & Level Up -----------------
    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    const last = xpCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    if (now - last < 20 * 1000) return; // cooldown 20 giây
    xpCooldowns.set(cooldownKey, now);
  
    const xpGain = Math.floor(Math.random() * 3) + 1; // Random từ 1 đến 3 XP
  
    let user = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
    if (!user) {
      // Đảm bảo khởi tạo trường xp nếu chưa có (ví dụ: xp: 0)
      user = await User.create({ userId: message.author.id, guildId: message.guild.id, xp: 0 });
    }
  
    user.xp += xpGain;
    const levelUp = checkLevelUp(user);
    await user.save();
  
    if (levelUp.leveledUp) {
      message.channel.send(`🎉 <@${user.userId}> đã lên cấp **${levelUp.newLevel}** và nhận **${levelUp.reward.toLocaleString()} VNĐ**!`);
    }
  }
};