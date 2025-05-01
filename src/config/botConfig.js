module.exports = {
  intents: [
    'Guilds',
    'GuildVoiceStates',
    'GuildMessages',
    'GuildMessageReactions',
    'MessageContent',
    'GuildMembers',
    'DirectMessages',
    'GuildPresences'
  ],
  
  prefix: '!',
  defaultCooldown: 3000,
  debug: process.env.NODE_ENV === 'development',

  welcomeMessages: [
    "Chào mừng {user} đến với {server}!",
    "Hey {user}! Rất vui khi bạn đã tham gia {server} 🎉",
    "{user} vừa hạ cánh tại {server}!",
    "Nhiệt liệt chào đón {user} đến với đại gia đình {server} 💖",
    "Một thành viên mới đã xuất hiện: {user}! Cùng chào đón nào!"
  ],

  goodbyeMessages: [
    "Tạm biệt {user}, mong sớm gặp lại bạn tại {server} 😢",
    "{user} đã rời khỏi {server}. Chúc bạn may mắn!",
    "{user} rời đi trong im lặng... {server} sẽ nhớ bạn 😔",
    "Cám ơn {user} đã đồng hành cùng {server}. Hẹn gặp lại!",
    "{user} đã ra đi, nhưng những kỷ niệm vẫn còn 💔"
  ],

  welcomeImages: [
    "https://i.imgur.com/AfFp7pu.png",
    "https://i.imgur.com/6RL4U8f.png",
    "https://i.imgur.com/YhF9lEr.png"
  ],

  goodbyeImages: [
    "https://i.imgur.com/3ZUrjUP.png",
    "https://i.imgur.com/l4eE0Ow.png",
    "https://i.imgur.com/q6LttPi.png"
  ]
};