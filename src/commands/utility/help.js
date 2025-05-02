const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Trợ giúp chi tiết về các lệnh bot')
    .addStringOption(option =>
      option.setName('lệnh')
        .setDescription('Tên lệnh cụ thể để xem hướng dẫn')),

  async execute(interaction) {
    const query = interaction.options.getString('lệnh');
    const basePath = path.join(__dirname, '..');

    if (query) {
      // Tìm kiếm lệnh cụ thể
      for (const folder of fs.readdirSync(basePath)) {
        const folderPath = path.join(basePath, folder);
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of files) {
          const cmd = require(path.join(folderPath, file));
          if (cmd.data && cmd.data.name === query) {
            const embed = new EmbedBuilder()
              .setTitle(`📘 Lệnh: /${cmd.data.name}`)
              .setDescription(cmd.data.description || 'Không có mô tả.')
              .addFields(
                { name: '📂 Danh mục', value: folder },
                ...(cmd.data.options?.map(opt => ({
                  name: `🔹 ${opt.name}`,
                  value: `> ${opt.description}${opt.required ? ' (bắt buộc)' : ''}`
                })) || [])
              )
              .setColor('#00bfff');

            return interaction.reply({ embeds: [embed] });
          }
        }
      }

      return interaction.reply({ content: '❌ Không tìm thấy lệnh bạn yêu cầu.' });
    }

    // Nếu không có tên lệnh cụ thể, hiển thị danh sách rút gọn
    const categories = [];
    for (const folder of fs.readdirSync(basePath)) {
      const folderPath = path.join(basePath, folder);
      const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

      const commands = [];
      for (const file of files) {
        const cmd = require(path.join(folderPath, file));
        if (cmd.data) {
          commands.push(`• \`/${cmd.data.name}\`: ${cmd.data.description}`);
        }
      }

      if (commands.length) {
        categories.push({ name: `📂 ${folder.toUpperCase()}`, value: commands.join('\n') });
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('📖 Danh sách các lệnh')
      .setDescription('Dùng `/help [lệnh]` để xem chi tiết lệnh cụ thể.')
      .addFields(categories)
      .setColor('#00ffcc');

    return interaction.reply({ embeds: [embed] });
  }
};
