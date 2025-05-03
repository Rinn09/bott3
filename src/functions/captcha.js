const { CaptchaGenerator } = require('captcha-canvas');
const { 
  AttachmentBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

async function captcha(text, channel, author) {
  if (!text) throw new Error('Text is required for captcha generation.');
  if (!channel) throw new Error('Channel is required for captcha generation.');
  if (!author) throw new Error('Author is required for captcha generation.');

  // Tạo text captcha ngẫu nhiên nếu "random"
  let capText = "";
  if (text.toLowerCase() === "random") {
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 10; i++) {
      capText += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
  } else {
    capText = text;
  }

  // Tạo captcha image bằng captcha-canvas
  const captchaImg = new CaptchaGenerator({})
    .setDimension(150, 450)
    .setCaptcha({ text: capText, fontSize: 60, color: '#000000', background: '#ffffff' })
    .setDecoy({ opacity: 0.5 })
    .setTrace({ color: '#000000' })
    .generateSync();
  const captchaBuffer = Buffer.from(captchaImg, 'base64');
  const attachment = new AttachmentBuilder(captchaBuffer, { name: 'captcha.png' });

  // Tạo embed captcha
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Captcha Verification')
    .setDescription('Vui lòng nhập văn bản xuất hiện bên dưới để xác thực.')
    .setImage('attachment://captcha.png')
    .setFooter({ text: 'Captcha Verification' });

  // Tạo nút Verify và gửi tin nhắn
  const verifyButton = new ButtonBuilder()
    .setCustomId('captcha-verify')
    .setLabel('Verify')
    .setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder().addComponents(verifyButton);
  const msg = await channel.send({ embeds: [embed], files: [attachment], components: [row] });

  // Trả về Promise đợi kết quả từ collectors
  return new Promise((resolve, reject) => {
    // Collector cho nút
    const collector = msg.createMessageComponentCollector({ time: 600000, componentType: 'BUTTON' });
    collector.on('collect', async (interaction) => {
      if (interaction.customId !== 'captcha-verify') return;
      if (interaction.user.id !== author.id) {
        await interaction.reply({ content: 'Captcha này không dành cho bạn.', ephemeral: true });
        return;
      }
      
      // Xác nhận interaction để tránh "This interaction failed"
      await interaction.deferUpdate();
      
      // Tạo Modal nhập captcha
      const modal = new ModalBuilder()
        .setTitle('SUBMIT CAPTCHA')
        .setCustomId('captcha-modal');
      const answerInput = new TextInputBuilder()
        .setCustomId('captcha-answer')
        .setLabel('Nhập văn bản xác thực')
        .setPlaceholder('Nhập văn bản bên trên')
        .setStyle(TextInputStyle.Short);
      const modalRow = new ActionRowBuilder().addComponents(answerInput);
      modal.addComponents(modalRow);
      
      await interaction.showModal(modal);
      
      // Chờ nhận submit từ Modal
      try {
        const modalSubmit = await interaction.awaitModalSubmit({ time: 600000 });
        const answer = modalSubmit.fields.getTextInputValue('captcha-answer');
        if (answer === capText) {
          await modalSubmit.reply({ content: 'Captcha verified successfully!', ephemeral: true });
          resolve(true);
          collector.stop();
          await msg.delete().catch(() => {});
        } else {
          await modalSubmit.reply({ content: 'Incorrect captcha. Please try again.', ephemeral: true });
          resolve(false);
          collector.stop();
        }
      } catch (err) {
        reject(err);
      }
    });
    collector.on('end', collected => {
      if (collected.size === 0) resolve(false);
    });
  });
}

module.exports = captcha;