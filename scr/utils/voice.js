const { load } = require('@discordjs/voice');

module.exports = async () => {
  try {
    await load({
      opus: '@discordjs/opus',
      sodium: 'sodium-native'
    });
    console.log('Voice dependencies loaded successfully');
  } catch (error) {
    console.error('Failed to load voice dependencies:', error);
  }
};