client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId);
      if (button) await button.execute(interaction);
    } else if (interaction.isStringSelectMenu()) {
      const menu = client.selectMenus.get(interaction.customId);
      if (menu) await menu.execute(interaction);
    }
  });
  