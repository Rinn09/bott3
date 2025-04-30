const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.buttons = new Map();
  client.selectMenus = new Map();

  // Load Buttons
  const buttonPath = path.join(__dirname, '../interactions/buttons');
  fs.readdirSync(buttonPath).forEach(file => {
    const button = require(`${buttonPath}/${file}`);
    client.buttons.set(button.customId, button);
  });

  // Load Select Menus
  const selectPath = path.join(__dirname, '../interactions/selects');
  fs.readdirSync(selectPath).forEach(file => {
    const menu = require(`${selectPath}/${file}`);
    client.selectMenus.set(menu.customId, menu);
  });

  // Event
  client.on('interactionCreate', async (interaction) => {
    console.log(`[INTERACTION] ${interaction.customId} | ${interaction.user.tag}`);
    try {
      if (interaction.isButton()) {
        console.log('Button Clicked:', interaction.customId);
        const handler = client.buttons.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      }

      if (interaction.isStringSelectMenu()) {
        const handler = client.selectMenus.get(interaction.customId);
        if (handler) await handler.execute(interaction);
      }
    } catch (err) {
      console.error('[Interaction Error]', err);
      if (interaction.deferred || interaction.replied) {
        interaction.followUp({ content: '❌ Đã xảy ra lỗi.', ephemeral: true });
      } else {
        interaction.reply({ content: '❌ Đã xảy ra lỗi.', ephemeral: true });
      }
    }
  });
};
