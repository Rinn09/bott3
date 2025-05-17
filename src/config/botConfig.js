module.exports = {
  intents: [
    "Guilds",
    "GuildVoiceStates",
    "GuildMessages",
    "GuildMessageReactions",
    "MessageContent",
    "GuildMembers",
    "DirectMessages",
    "GuildPresences",
  ],

  prefix: "!",
  defaultCooldown: 3000,
  debug: process.env.NODE_ENV === "development",

  welcomeMessages: [
    "Chào mừng {user} đến với {server}!",
    "Hey {user}! Rất vui khi bạn đã tham gia {server} 🎉",
    "{user} vừa hạ cánh tại {server}!",
    "Nhiệt liệt chào đón {user} đến với đại gia đình {server} 💖",
    "Một thành viên mới đã xuất hiện: {user}! Cùng chào đón nào!",
  ],

  goodbyeMessages: [
    "Tạm biệt {user}, mong sớm gặp lại bạn tại {server} 😢",
    "{user} đã rời khỏi {server}. Chúc bạn may mắn!",
    "{user} rời đi trong im lặng... {server} sẽ nhớ bạn 😔",
    "Cám ơn {user} đã đồng hành cùng {server}. Hẹn gặp lại!",
    "{user} đã ra đi, nhưng những kỷ niệm vẫn còn 💔",
  ],

  welcomeImages: [
    "https://i.imgur.com/AfFp7pu.png",
    "https://i.imgur.com/6RL4U8f.png",
    "https://i.imgur.com/YhF9lEr.png",
  ],

  goodbyeImages: [
    "https://i.imgur.com/3ZUrjUP.png",
    "https://i.imgur.com/l4eE0Ow.png",
    "https://i.imgur.com/q6LttPi.png",
  ],
  gacha: {
    luckyUpgradeChance: 0.05, // 5% tỷ lệ đột phá
    luckyUpgradeEffects: [
      // Các loại đột phá có thể xảy ra
      {
        type: "stat_boost",
        stat: "speed",
        minBoost: 1,
        maxBoost: 5,
        weight: 40,
      },
      {
        type: "stat_boost",
        stat: "acceleration",
        minBoost: 0.1,
        maxBoost: 0.5,
        weight: 30,
        isFloat: true,
      },
      {
        type: "stat_boost",
        stat: "handling",
        minBoost: 1,
        maxBoost: 3,
        weight: 20,
      },
      { type: "durability_repair", percentage: 0.1, weight: 10 },
    ],
    freeRollCooldownHours: 8,
    pityThreshold: 90,
    guaranteedRarities: ["rare", "epic", "legendary", "mythic"],
    goldenHour: {
      enabled: true,
      durationMinutes: 30,
      frequencyHours: { min: 4, max: 24 },
      boostMultiplier: {
        common: 0.5,
        uncommon: 0.75,
        rare: 2,
        epic: 1.8,
        legendary: 1.3,
        mythic: 1.2,
      },
      announcementMessage:
        "🎉 **GIỜ VÀNG GACHA ĐÃ BẮT ĐẦU!** 🎉\nTrong **{duration} phút** tới, tỷ lệ roll ra xe/phụ tùng hiếm sẽ được tăng cường! Cơ hội không chờ một ai, hãy thử vận may của bạn với `/roll` ngay nào!",
      endMessage:
        "🔔 **GIỜ VÀNG GACHA ĐÃ KẾT THÚC!** 🔔\nTỷ lệ roll đã trở lại bình thường. Hẹn gặp lại các tay đua ở Giờ Vàng tiếp theo!",
    },
  },
};
