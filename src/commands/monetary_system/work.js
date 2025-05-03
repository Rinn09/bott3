const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

const workMessages = [
  "Bạn vừa giao hàng cho một khách hàng vui tính!",
  "Bạn vừa hoàn thành xong một ca làm mệt mỏi.",
  "Bạn đi làm từ sáng đến tối... nhưng lương vẫn bèo.",
  "Bạn cố gắng hết sức... và được trả công xứng đáng.",
  "Bạn đã giúp một cụ già qua đường và được thưởng tiền!"
];

const events = [
  { type: "bonus", chance: 0.1, message: "Bạn nhặt được {amount} VNĐ trên đường!", min: 1000, max: 20000 },
  { type: "lost", chance: 0.05, message: "Bạn bị cướp mất {amount} VNĐ!", min: 10000, max: 50000 },
  { type: "drop", chance: 0.07, message: "Bạn làm rơi ví và mất {amount} VNĐ!", min: 1000, max: 20000 },
  { type: "double", chance: 0.05, message: "Bạn được tăng ca và nhận gấp đôi tiền công!" },
  { type: "triple", chance: 0.02, message: "Bạn siêu may mắn! Nhận gấp ba lần tiền công!" },
  { type: "jackpot", chance: 0.003, message: "Bạn trúng số giải 8 sau khi mua vé số và nhận được {amount} VNĐ!", min: 100000, max: 150000 }
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chooseRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Làm việc để kiếm tiền'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let user = await User.findOne({ userId, guildId });
    if (!user) {
      user = await User.create({ userId, guildId, balance: 0, bank: 0, xp: 0, level: 1 });
    }

    const cooldown = 60 * 60 * 1000 + user.level * 15000; // 1h + 15s * level
    const now = Date.now();
    if (user.cooldowns?.work && now - user.cooldowns.work < cooldown) {
      const remaining = cooldown - (now - user.cooldowns.work);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      return interaction.reply({ content: `⏳ Bạn phải đợi ${minutes} phút ${seconds} giây để làm việc tiếp.`, ephemeral: true });
    }

    // Tiền cơ bản
    let amount = getRandomInt(1000, 20000);
    let multiplier = 1;
    let eventMessage = null;

    for (const event of events) {
      if (Math.random() < event.chance) {
        switch (event.type) {
          case "bonus":
            const bonus = getRandomInt(event.min, event.max);
            amount += bonus;
            eventMessage = event.message.replace("{amount}", bonus);
            break;
          case "lost":
          case "drop":
            const loss = getRandomInt(event.min, event.max);
            amount -= loss;
            if (amount < 0) amount = 0;
            eventMessage = event.message.replace("{amount}", loss);
            break;
          case "double":
            multiplier = 2;
            eventMessage = event.message;
            break;
          case "triple":
            multiplier = 3;
            eventMessage = event.message;
            break;
          case "jackpot":
            const jackpot = getRandomInt(event.min, event.max);
            amount += jackpot;
            eventMessage = event.message.replace("{amount}", jackpot);
            break;
        }
        break; // chỉ 1 event mỗi lần
      }
    }

    amount *= multiplier;
    const message = chooseRandom(workMessages);
    user.balance += amount;
    user.totalEarned = (user.totalEarned || 0) + amount;
    user.cooldowns.work = now;
    await user.save();

    const embed = new EmbedBuilder()
      .setTitle("💼 Bạn đã làm việc!")
      .setDescription(`${message}\n\n💰 Bạn nhận được **${amount.toLocaleString()} VNĐ**!`)
      .setColor(0x00B56A)
      .setFooter({ text: eventMessage || "Hãy chăm chỉ mỗi ngày!" });

    return interaction.reply({ embeds: [embed] });
  }
};
