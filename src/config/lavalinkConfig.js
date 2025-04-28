require('dotenv').config();
module.exports = {
  userId: process.env.CLIENT_ID, 
  nodes: [
    {
      name: "localhost",
      url: "127.0.0.1:2333",  
      auth: "hahaha2702",    
      secure: false,          
      retryAmount: 5,
      retryDelay: 3000,
      reconnectAttempts: 7,
    },
  ],
};