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
    freeRollCooldownHours: 24, // Cooldown cho free roll (giờ)
    rollCostVND: 50000, // Giá mỗi lượt roll bằng VNĐ
    pityThreshold: 90, // Số lượt roll để chắc chắn nhận được ít nhất đồ Rare trở lên
    guaranteedRarities: ["rare", "epic", "legendary", "mythic"], // Các độ hiếm được tính là "cao cấp" cho pity system
    goldenHour: {
      enabled: true,
      durationMinutes: 30,
      frequencyHours: { min: 4, max: 8 },
      boostMultiplier: {
        rare: 1.5,
        epic: 1.3,
        legendary: 1.2,
        mythic: 1.1,
      },
      // announcementChannelId: "ID_KENH_THONG_BAO_GIO_VANG", // << XÓA HOẶC COMMENT DÒNG NÀY
      announcementMessage:
        "🎉 **GIỜ VÀNG GACHA ĐÃ BẮT ĐẦU!** 🎉\nTrong **{duration} phút** tới, tỷ lệ roll ra xe/phụ tùng hiếm sẽ được tăng cường! Cơ hội không chờ một ai, hãy thử vận may của bạn với `/roll` ngay nào!",
      endMessage:
        "🔔 **GIỜ VÀNG GACHA ĐÃ KẾT THÚC!** 🔔\nTỷ lệ roll đã trở lại bình thường. Hẹn gặp lại các tay đua ở Giờ Vàng tiếp theo!",
    },
  },
};
