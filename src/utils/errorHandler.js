module.exports = (client) => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  client.on('error', (error) => {
    console.error('Client Error:', error);
  });
};