const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Tìm kiếm nhanh trên Google')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Từ khóa cần tìm')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: cx,
          q: query,
          num: 3,
          safe: 'active',
        },
      });

      const items = response.data.items;

      if (!items || items.length === 0) {
        return interaction.reply({ content: '❌ Không tìm thấy kết quả nào.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔎 Kết quả tìm kiếm cho: "${query}"`)
        .setColor('#4285F4');

      items.forEach((item, index) => {
        embed.addFields({
          name: `${index + 1}. ${item.title}`,
          value: `${item.snippet}\n[Link](${item.link})`,
        });
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      await interaction.reply({ content: '❌ Đã xảy ra lỗi khi tìm kiếm.', ephemeral: true });
    }
  },
};
