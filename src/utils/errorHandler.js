const Logger = require('./logger');

module.exports = (client) => {
  process.on('unhandledRejection', (error) => {
    const errorMessage = error?.message || 'Unknown rejection';
    const errorStack = error?.stack || 'No stack trace available';
    Logger.error(`Unhandled promise rejection: ${errorMessage}`, { stack: errorStack });
  });

  process.on('uncaughtException', (error) => {
    const errorMessage = error?.message || 'Unknown error';
    const errorStack = error?.stack || 'No stack trace available';
    Logger.error(`Uncaught exception: ${errorMessage}`, { stack: errorStack });
    
    // Nếu xuất hiện lỗi nghiêm trọng, đóng client và thoát
    if (client) {
      client.destroy();
    }
    process.exit(1);
  });

  client.on('error', (error) => {
    const errorMessage = error?.message || 'Unknown client error';
    const errorStack = error?.stack || 'No stack trace available';
    Logger.error(`Client error: ${errorMessage}`, { stack: errorStack });
  });
};