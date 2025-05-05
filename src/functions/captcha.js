const { CaptchaGenerator } = require('captcha-canvas');
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js'); // Thêm InteractionType
const Logger = require('../utils/logger'); // Thêm Logger

async function captcha(channel, author) { // Bỏ tham số text, luôn tạo random
  if (!channel) throw new Error('Channel is required for captcha generation.');
  if (!author) throw new Error('Author is required for captcha generation.');

  // Luôn tạo text captcha ngẫu nhiên
  let capText = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Đơn giản hóa ký tự
  for (let i = 0; i < 6; i++) { // Giảm độ dài xuống 6 ký tự
    capText += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  try {
      // Tạo captcha image
      const captchaInstance = new CaptchaGenerator()
        .setDimension(150, 450)
        .setCaptcha({ text: capText, size: 60, color: "grey" }) // Dùng size thay fontSize
        .setDecoy({ opacity: 0.5, size: 40 }) // Giảm size decoy
        .setTrace({ color: "grey", size: 5 }) // Dùng size thay vì color string đơn thuần
        .generateSync(); // Tạo captcha
      const captchaBuffer = Buffer.from(captchaInstance);
      const attachment = new AttachmentBuilder(captchaBuffer, { name: 'captcha.png' });

      // Tạo embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔍 Xác thực Captcha')
        .setDescription(`Vui lòng nhấp vào nút "Xác thực" và nhập lại ${capText.length} ký tự bạn thấy trong ảnh để hoàn tất.`)
        .setImage('attachment://captcha.png')
        .setFooter({ text: `Yêu cầu bởi ${author.tag} | Bạn có 2 phút` });

      // Tạo nút Verify
      const verifyButton = new ButtonBuilder()
        .setCustomId(`captcha_verify_${author.id}_${Date.now()}`) // ID duy nhất cho mỗi lần tạo
        .setLabel('Xác thực')
        .setStyle(ButtonStyle.Success); // Đổi style thành Success
      const row = new ActionRowBuilder().addComponents(verifyButton);

      // Gửi tin nhắn captcha (có thể để ephemeral nếu lệnh /captcha là ephemeral)
      const msg = await channel.send({ embeds: [embed], files: [attachment], components: [row] });

      // Trả về Promise đợi kết quả
      return new Promise((resolve) => {
        const filter = (i) => i.customId === verifyButton.data.custom_id && i.user.id === author.id;
        const collector = channel.createMessageComponentCollector({ filter, time: 120000 }); // 2 phút timeout

        collector.on('collect', async (interaction) => {
          if (interaction.type !== InteractionType.MessageComponent) return; // Chỉ xử lý button click

          try {
            // Phản hồi nhanh chóng trước khi show modal
            await interaction.deferUpdate();

            // Tạo Modal nhập captcha
            const modal = new ModalBuilder()
              .setTitle('Nhập Captcha')
              .setCustomId(`captcha_modal_${author.id}_${Date.now()}`); // ID duy nhất
            const answerInput = new TextInputBuilder()
              .setCustomId('captcha-answer')
              .setLabel(`Nhập ${capText.length} ký tự trong ảnh`)
              .setPlaceholder('Phân biệt chữ hoa/thường')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMinLength(capText.length)
              .setMaxLength(capText.length);
            const modalRow = new ActionRowBuilder().addComponents(answerInput);
            modal.addComponents(modalRow);

            await interaction.showModal(modal);

            // Chờ nhận submit từ Modal
            const modalSubmit = await interaction.awaitModalSubmit({
                filter: (i) => i.customId === modal.data.custom_id && i.user.id === author.id,
                time: 110000 // Timeout modal ngắn hơn collector 1 chút
             }).catch(err => {
                 Logger.warn(`[Captcha] Modal submit timeout or error for ${author.tag}: ${err.message}`);
                 // Không cần gửi gì thêm ở đây, collector sẽ xử lý timeout chung
                 return null; // Trả về null để biết là timeout/lỗi
             });

             if (!modalSubmit) { // Nếu modal timeout hoặc lỗi
                collector.stop('modal_timeout');
                return;
             }

            await modalSubmit.deferReply({ ephemeral: true });
            const answer = modalSubmit.fields.getTextInputValue('captcha-answer');
            if (answer === capText) {
              await modalSubmit.editReply({ content: '✅ Xác thực thành công!' });
              resolve(true); // Resolve thành công
              collector.stop('verified');
            } else {
              await modalSubmit.editReply({ content: '❌ Mã Captcha không đúng. Vui lòng thử lại lệnh.' });
              resolve(false); // Resolve thất bại
              collector.stop('incorrect');
            }
          } catch (modalError) {
             Logger.error(`[Captcha] Error during modal interaction for ${author.tag}: ${modalError.message}`, { stack: modalError.stack });
             resolve(false); // Resolve thất bại nếu có lỗi
             collector.stop('error');
          }
        });

        collector.on('end', async (collected, reason) => {
          // Xóa tin nhắn captcha sau khi kết thúc (thành công, thất bại, hết hạn)
          await msg.delete().catch(err => Logger.warn(`[Captcha] Could not delete captcha message: ${err.message}`));
          // Nếu chưa resolve và lý do là timeout, resolve false
          if (reason === 'time') {
              Logger.info(`[Captcha] Timed out for ${author.tag}`);
              resolve(false);
          }
          // Các trường hợp khác đã được resolve trong 'collect'
        });
      }); // Kết thúc Promise
  } catch (error) {
      Logger.error(`[Captcha] Failed to generate or send captcha: ${error.message}`, { stack: error.stack });
      return false; // Trả về false nếu có lỗi ngay từ đầu
  }
}
module.exports = captcha;