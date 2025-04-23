require('dotenv').config();
module.exports = {
  userId: process.env.CLIENT_ID, // ID của bot Discord
  nodes: [
    {
      name: "localhost",
      url: "node.lewdhutao.my.eu.org:80",  // Chỉ cần chuỗi "host:port" mà không có protocol
      auth: "youshallnotpass",     // Sử dụng key "auth" thay vì "password"
      secure: false,              // Nếu bạn sử dụng HTTPS, hãy đặt thành true
      retryAmount: 5,
      retryDelay: 3000,
      reconnectAttempts: 7,
    },
  ],
};