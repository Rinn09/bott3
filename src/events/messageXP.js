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
    
    // ----------------- AntiCaps Check -----------------
    try {
      const data = await AntiCaps.findOne({ 
        guildId: message.guild.id, 
        channelId: message.channel.id 
      });
  
      if (data) {
        // Kiểm tra xem author có nằm trong danh sách user được phép không
        let allowed = false;
        for (const userId of data.allowedUsers) {
          const u = await message.client.users.fetch(userId.toString()).catch(() => {});
          if (u && u.id === message.author.id) {
            allowed = true;
            break;
          }
        }
        // Nếu không được phép, kiểm tra tỉ lệ chữ in hoa
        if (!allowed) {
          const upcaseChars = message.content.split('').filter(char => char >= 'A' && char <= 'Z').length;
          if (message.content.length > 5 && upcaseChars / message.content.length > 0.5) {
            const embed = new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription(`❌ Bạn không được phép gửi tin nhắn quá nhiều chữ in hoa trong kênh này.`)
              .setTimestamp()
              .setFooter({ text: 'AntiCaps' });
            await message.channel.send({ embeds: [embed] });
            // Chờ 3 giây rồi xóa tin nhắn
            await new Promise(resolve => setTimeout(resolve, 3000));
            await message.delete().catch(() => {});
            return;
          }
        }
      }
    } catch (err) {
      console.error('AntiCaps error:', err);
      // Khi có lỗi xảy ra trong phần AntiCaps, ta vẫn tiếp tục xử lý XP
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