const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Kiểm tra độ trễ của bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Ping...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = interaction.client.ws.ping;

    await interaction.editReply(`🏓 Pong! Độ trễ: \`${latency}ms\` • Discord API: \`${apiPing}ms\``);
  }
};
