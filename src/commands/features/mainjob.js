const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");
const User = require("../../models/User");
const MainJob = require("../../models/MainJob");
const Logger = require("../../utils/logger");
const {
  handleJobLevelUp,
  getRequiredXPForLevel,
  calculateSalaryForJobLevel,
} = require("../../utils/jobUtil");
const taskHandler = require("../../handlers/taskHandler");
const mongoose = require("mongoose"); // Cần cho bo-nghe

// Constants (nếu có, ví dụ cooldown nghỉ việc)
const QUIT_JOB_COOLDOWN_HOURS = 12; // Ví dụ: 12 giờ cooldown nghỉ việc
const QUIT_JOB_COOLDOWN_MS = QUIT_JOB_COOLDOWN_HOURS * 60 * 60 * 1000;

// Helper function (nếu có, ví dụ formatDuration từ view-main-job)
function formatDuration(ms) {
  if (ms <= 0) return "Sẵn sàng";
  let durationString = "";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  ms %= 24 * 60 * 60 * 1000;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  ms %= 60 * 60 * 1000;
  const minutes = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds = Math.floor(ms / 1000);

  if (days > 0) durationString += `${days} ngày `;
  if (hours > 0) durationString += `${hours} giờ `;
  if (minutes > 0) durationString += `${minutes} phút `;
  if (seconds > 0 || durationString === "") durationString += `${seconds} giây`;
  return durationString.trim() || "Ngay bây giờ";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mainjob")
    .setDescription("Quản lý và tương tác với hệ thống Nghề nghiệp chính.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription(
          "Hiển thị danh sách các nghề chính có sẵn trong server.",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("select")
        .setDescription("Chọn một nghề chính để bắt đầu sự nghiệp."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription(
          "Xem thông tin và trạng thái nghề chính hiện tại của bạn.",
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("quit")
        .setDescription(
          `Nghỉ việc nghề chính hiện tại (có ${QUIT_JOB_COOLDOWN_HOURS} giờ cooldown).`,
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rewards")
        .setDescription(
          "Xem thông tin về phần thưởng khi thăng cấp nghề chính.",
        ),
    )
    .addSubcommand(
      (
        subcommand, // Subcommand mới cho các task
      ) =>
        subcommand
          .setName("task")
          .setDescription("Thực hiện một nhiệm vụ của nghề chính hiện tại.")
          .addStringOption((option) =>
            option
              .setName("task_action")
              .setDescription(
                "Tên hoặc ID của nhiệm vụ muốn thực hiện (ví dụ: tuoi-cay, thu-hoach).",
              )
              .setRequired(true),
          ),
    ),

  async autocomplete(interaction) {
    // Thêm hàm autocomplete
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];

    if (focusedOption.name === "task_action") {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const userData = await User.findOne({ userId, guildId });

      if (userData && userData.mainJob && userData.mainJob.name) {
        const jobDefinition = await MainJob.findOne({
          name: userData.mainJob.name.toLowerCase(),
        });
        if (jobDefinition && jobDefinition.tasks) {
          choices = jobDefinition.tasks.map((task) => ({
            name: `${task.name} (${task.taskId})`, // Hiển thị cả tên và ID
            value: task.taskId, // Giá trị là taskId
          }));
        }
      }
    }
    // Lọc choices dựa trên input của người dùng (nếu cần)
    const filtered = choices
      .filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      )
      .slice(0, 25);
    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const client = interaction.client; // Lấy client instance

    // await interaction.deferReply(); // Defer ở đầu nếu nhiều subcommands cần thời gian

    try {
      let userData = await User.findOne({ userId, guildId });
      if (!userData && !["list", "rewards"].includes(subcommand)) {
        // Cho phép xem list, rewards ngay cả khi chưa có data
        userData = await User.create({ userId, guildId }); // Tạo user nếu chưa có cho các lệnh khác
      } else if (!userData && ["list", "rewards"].includes(subcommand)) {
        // Không cần tạo user cho các lệnh này nếu họ chưa có
      }

      if (subcommand === "task") {
        await interaction.deferReply(); // Defer cho task
        const taskActionInput = interaction.options.getString("task_action");

        if (!userData || !userData.mainJob || !userData.mainJob.name) {
          return interaction.editReply(
            "❌ Bạn chưa có nghề chính để thực hiện nhiệm vụ. Sử dụng `/mainjob select`.",
          );
        }

        const jobDefinition = await MainJob.findOne({
          name: userData.mainJob.name.toLowerCase(),
        });
        if (
          !jobDefinition ||
          !jobDefinition.tasks ||
          jobDefinition.tasks.length === 0
        ) {
          return interaction.editReply(
            `❌ Nghề **${userData.mainJob.name}** của bạn hiện không có nhiệm vụ nào khả dụng.`,
          );
        }

        // Tìm task dựa trên taskActionInput (đây là taskId do autocomplete)
        const taskDefinitionToExecute = jobDefinition.tasks.find(
          (t) => t.taskId.toLowerCase() === taskActionInput.toLowerCase(),
        );

        if (!taskDefinitionToExecute) {
          return interaction.editReply(
            `❌ Không tìm thấy nhiệm vụ với ID \`${taskActionInput}\` cho nghề **${jobDefinition.name}**. Sử dụng autocomplete hoặc \`/mainjob view\` để xem ID chính xác.`,
          );
        }

        // Gọi Task Handler
        await taskHandler.executeMainJobTask(
          interaction,
          userData,
          jobDefinition,
          taskDefinitionToExecute,
        );
      }

      if (subcommand === "list") {
        // <<<----- LOGIC TỪ src/commands/main-job-system/jobs-list.js ----->>>
        await interaction.deferReply();
        const jobs = await MainJob.find({});
        if (!jobs.length) {
          return interaction.editReply({
            content: "❌ Hiện chưa có nghề chính nào trong hệ thống.",
            ephemeral: true,
          });
        }
        const embed = new EmbedBuilder()
          .setTitle("📋 Danh sách các nghề chính có thể chọn")
          .setColor("#00C897")
          .setDescription(
            "Dưới đây là các nghề nghiệp chính bạn có thể theo đuổi. Sử dụng `/mainjob select` để bắt đầu!",
          );

        for (const job of jobs) {
          const baseSalary = job.salaryByLevel?.get("1") || "Không xác định";
          const taskList =
            job.tasks
              ?.map((task) => `• ${task.name} (\`task.taskId}\`)`)
              .join("\n") || "Chưa có nhiệm vụ cụ thể.";
          embed.addFields({
            name: `👷 ${job.name.charAt(0).toUpperCase() + job.name.slice(1)}`,
            value:
              `📜 *${job.description || "Không có mô tả."}*\n` +
              `💰 Lương khởi điểm (cấp 1): ${baseSalary.toLocaleString ? baseSalary.toLocaleString() : baseSalary} VNĐ\n` +
              `🔧 Nhiệm vụ chính:\n${taskList}`,
            inline: false,
          });
        }
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "select") {
        // <<<----- LOGIC TỪ src/commands/main-job-system/main-job.js ----->>>
        await interaction.deferReply({ ephemeral: true }); // Select nên ephemeral ban đầu
        const jobs = await MainJob.find({});
        if (!jobs.length) {
          return interaction.editReply({
            content: "❌ Hiện chưa có nghề nào trong hệ thống để chọn.",
          });
        }
        if (!userData)
          userData = await User.findOneAndUpdate(
            { userId, guildId },
            { $setOnInsert: { userId, guildId } },
            { upsert: true, new: true },
          );

        if (userData.mainJob && userData.mainJob.name) {
          return interaction.editReply({
            content: `❌ Bạn đang làm nghề **${userData.mainJob.name}** rồi. Hãy dùng \`/mainjob quit\` trước khi chọn nghề mới.`,
          });
        }

        const jobOptions = jobs.map((job) => ({
          label: job.name.charAt(0).toUpperCase() + job.name.slice(1),
          value: job.name.toLowerCase(), // Value là tên nghề chữ thường để query
          description:
            job.description?.substring(0, 100) ||
            `Bắt đầu sự nghiệp ${job.name}.`,
        }));

        if (jobOptions.length === 0) {
          return interaction.editReply({
            content:
              "❌ Không có nghề nào phù hợp để hiển thị trong danh sách chọn.",
          });
        }
        // Nếu số lượng nghề nhiều hơn 25, cần phân trang select menu hoặc cách khác
        if (jobOptions.length > 25) {
          // Logic phân trang cho select menu (phức tạp hơn, tạm thời giới hạn hoặc báo lỗi)
          Logger.warn(
            `[MainJob/Select] Number of jobs (${jobOptions.length}) exceeds select menu limit (25).`,
          );
          return interaction.editReply({
            content:
              "❌ Số lượng nghề nghiệp quá nhiều để hiển thị trong một menu. Vui lòng liên hệ admin.",
          });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`mainjob_select_menu_${interaction.id}`)
          .setPlaceholder("Chọn nghề bạn muốn theo đuổi...")
          .addOptions(jobOptions);
        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
          .setTitle("🌟 Chọn Nghề Nghiệp Chính Của Bạn")
          .setDescription(
            "Hãy chọn một con đường sự nghiệp từ danh sách bên dưới. Mỗi nghề sẽ có những nhiệm vụ và mức lương khác nhau.",
          )
          .setColor(0x00ae86);

        const selectMessage = await interaction.editReply({
          embeds: [embed],
          components: [actionRow],
          ephemeral: true,
        });

        const filter = (i) =>
          i.customId === `mainjob_select_menu_${interaction.id}` &&
          i.user.id === userId;
        try {
          const collectedInteraction =
            await selectMessage.awaitMessageComponent({
              filter,
              componentType: ComponentType.StringSelect,
              time: 120000,
            }); // 2 phút

          await collectedInteraction.deferUpdate(); // Xác nhận tương tác select menu
          const selectedJobName = collectedInteraction.values[0];
          const jobData = await MainJob.findOne({ name: selectedJobName });

          if (!jobData) {
            return collectedInteraction.editReply({
              content: `❌ Nghề **${selectedJobName}** không tồn tại hoặc có lỗi.`,
              components: [],
            });
          }

          // Lấy lại userData mới nhất trước khi save
          userData = await User.findOne({ userId, guildId });
          if (!userData) {
            // Nên check lại
            return collectedInteraction.editReply({
              content: "❌ Lỗi không tìm thấy dữ liệu người dùng của bạn.",
              components: [],
            });
          }
          if (userData.mainJob && userData.mainJob.name) {
            // Kiểm tra lại một lần nữa
            return collectedInteraction.editReply({
              content: "❌ Bạn đã có nghề rồi!",
              components: [],
            });
          }

          userData.mainJob = {
            name: jobData.name, // Lưu tên nghề chữ thường
            level: 1,
            xp: 0,
            hiredAt: new Date(),
            taskCooldowns: new Map(),
            lastQuit: null, // Reset lastQuit khi nhận việc mới
          };
          await userData.save();
          Logger.info(
            `[MainJob/Select] User ${userId} selected main job: ${jobData.name}`,
          );
          await collectedInteraction.editReply({
            content: `✅ Chúc mừng! Bạn đã chính thức trở thành **${jobData.name.charAt(0).toUpperCase() + jobData.name.slice(1)}**. Hãy bắt đầu làm nhiệm vụ với \`/mainjob task\`!`,
            components: [],
          });
        } catch (error) {
          // Lỗi từ awaitMessageComponent (thường là timeout)
          Logger.warn(
            `[MainJob/Select] Select menu for user ${userId} timed out or error: ${error.message}`,
          );
          await interaction
            .editReply({
              content:
                "⌛ Bạn đã không chọn nghề trong thời gian cho phép. Lệnh đã bị hủy.",
              components: [],
              embeds: [],
            })
            .catch(() => {});
        }
      } else if (subcommand === "view") {
        // <<<----- LOGIC TỪ src/commands/main-job-system/view-main-job.js ----->>>
        await interaction.deferReply();
        if (!userData || !userData.mainJob || !userData.mainJob.name) {
          return interaction.editReply(
            "❌ Bạn chưa có nghề chính. Hãy dùng `/mainjob select` để chọn một nghề!",
          );
        }

        const jobName = userData.mainJob.name;
        const jobLevel = userData.mainJob.level || 1;
        const jobXP = userData.mainJob.xp || 0;

        const jobDefinition = await MainJob.findOne({
          name: jobName.toLowerCase(),
        }); // Query bằng chữ thường
        if (!jobDefinition) {
          Logger.error(
            `[MainJob/View] Could not find job definition for: ${jobName}`,
          );
          return interaction.editReply(
            `❌ Không tìm thấy thông tin chi tiết cho nghề ${jobName}. Có thể nghề này đã bị xóa. Vui lòng thử \`/mainjob quit\`.`,
          );
        }

        const xpRequired = getRequiredXPForLevel(jobLevel);
        const currentSalary = await calculateSalaryForJobLevel(
          jobName,
          jobLevel,
        );

        const embed = new EmbedBuilder()
          .setTitle(
            `📘 Thông tin nghề nghiệp: ${jobDefinition.name.charAt(0).toUpperCase() + jobDefinition.name.slice(1)}`,
          )
          .setColor("Blue")
          .setThumbnail(interaction.user.displayAvatarURL())
          .addFields(
            { name: "📈 Cấp độ nghề", value: `${jobLevel}`, inline: true },
            {
              name: "💼 Lương Hiện Tại (cho nhiệm vụ chính)",
              value: `${currentSalary.toLocaleString()} VNĐ`,
              inline: true,
            },
            {
              name: "✨ Kinh nghiệm nghề",
              value: `${jobXP.toLocaleString()}/${xpRequired.toLocaleString()}`,
              inline: true,
            },
            {
              name: "🗓️ Ngày nhận việc",
              value: userData.mainJob.hiredAt
                ? `<t:${Math.floor(new Date(userData.mainJob.hiredAt).getTime() / 1000)}:R>`
                : "Không rõ",
              inline: false,
            },
          );

        let taskStatusDescription = "";
        const now = Date.now();
        if (jobDefinition.tasks && jobDefinition.tasks.length > 0) {
          taskStatusDescription += "**🕒 Trạng thái các nhiệm vụ khả dụng:**\n";
          jobDefinition.tasks.forEach((task) => {
            const lastUsedTimestamp =
              userData.mainJob.taskCooldowns?.get(task.taskId) || 0;
            const taskCooldownDuration = task.cooldown || 0; // ms
            const remainingCooldownMs = Math.max(
              0,
              taskCooldownDuration - (now - lastUsedTimestamp),
            );
            const status =
              remainingCooldownMs === 0
                ? "✅ Sẵn sàng"
                : `⏳ ${formatDuration(remainingCooldownMs)}`;
            taskStatusDescription += `• **${task.name}** (\`${task.taskId}\`): ${status}\n`;
          });
        } else {
          taskStatusDescription =
            "*Nghề này hiện chưa có nhiệm vụ nào được định nghĩa.*";
        }
        embed.addFields({
          name: "🔨 Nhiệm vụ",
          value: taskStatusDescription,
          inline: false,
        });
        if (
          userData.mainJob.lastQuit &&
          Date.now() - new Date(userData.mainJob.lastQuit).getTime() <
            QUIT_JOB_COOLDOWN_MS
        ) {
          const remainingQuitCooldown =
            QUIT_JOB_COOLDOWN_MS -
            (Date.now() - new Date(userData.mainJob.lastQuit).getTime());
          embed.setFooter({
            text: `Bạn đang trong thời gian chờ ${formatDuration(remainingQuitCooldown)} để có thể chọn nghề mới.`,
          });
        }

        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "quit") {
        // <<<----- LOGIC TỪ src/commands/main-job-system/bo-nghe.js ----->>>
        await interaction.deferReply({ ephemeral: false }); // Cho phép công khai
        if (!userData || !userData.mainJob || !userData.mainJob.name) {
          return interaction.editReply({
            content: "❌ Bạn hiện không có nghề chính nào để nghỉ.",
          });
        }

        const now = Date.now();
        const lastQuitTime = userData.mainJob.lastQuit
          ? new Date(userData.mainJob.lastQuit).getTime()
          : 0;

        if (now - lastQuitTime < QUIT_JOB_COOLDOWN_MS) {
          const remaining = QUIT_JOB_COOLDOWN_MS - (now - lastQuitTime);
          return interaction.editReply({
            content: `⏳ Bạn vừa mới nghỉ việc! Cần chờ thêm **${formatDuration(remaining)}** trước khi có thể nghỉ việc tiếp (hoặc chọn nghề mới).`,
          });
        }

        const confirmId = `mainjob_quit_confirm_${interaction.id}`;
        const cancelId = `mainjob_quit_cancel_${interaction.id}`;
        const embed = new EmbedBuilder()
          .setTitle("❓ Xác nhận nghỉ việc Nghề Chính")
          .setDescription(
            `Bạn có chắc chắn muốn nghỉ nghề **${userData.mainJob.name.charAt(0).toUpperCase() + userData.mainJob.name.slice(1)}** không?\n\nSau khi nghỉ, bạn sẽ phải chờ **${QUIT_JOB_COOLDOWN_HOURS} giờ** mới có thể chọn một nghề chính mới. Tất cả tiến trình (level, XP) của nghề này sẽ được giữ lại nếu bạn quay lại làm nghề này sau.`,
          )
          .setColor("Yellow");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel("Xác nhận Nghỉ Việc")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(cancelId)
            .setLabel("Hủy Bỏ")
            .setStyle(ButtonStyle.Secondary),
        );

        const quitMessage = await interaction.editReply({
          embeds: [embed],
          components: [row],
        });

        const filter = (i) =>
          i.customId.startsWith("mainjob_quit_") &&
          i.user.id === userId &&
          i.message.id === quitMessage.id;
        try {
          const collectedInteraction = await quitMessage.awaitMessageComponent({
            filter,
            componentType: ComponentType.Button,
            time: 60000,
          });

          if (collectedInteraction.customId === cancelId) {
            return collectedInteraction.update({
              content: "✅ Thao tác nghỉ việc đã được hủy.",
              embeds: [],
              components: [],
            });
          }

          if (collectedInteraction.customId === confirmId) {
            await collectedInteraction.deferUpdate();
            const oldJobName = userData.mainJob.name;
            // Thay vì xóa toàn bộ mainJob, chỉ set name = null và cập nhật lastQuit
            // userData.mainJob = null; // <- KHÔNG NÊN LÀM VẬY NẾU MUỐN GIỮ LẠI LEVEL/XP
            userData.mainJob.name = null; // Đánh dấu là không có nghề
            userData.mainJob.lastQuit = new Date(now);
            // Giữ nguyên level, xp, taskCooldowns, hiredAt để có thể quay lại
            await userData.save();

            Logger.info(
              `[MainJob/Quit] User ${userId} quit main job: ${oldJobName}`,
            );
            await collectedInteraction.editReply({
              content: `✅ Bạn đã nghỉ việc **${oldJobName.charAt(0).toUpperCase() + oldJobName.slice(1)}**. Chúc bạn sớm tìm được con đường mới! Bạn có thể chọn lại nghề sau ${QUIT_JOB_COOLDOWN_HOURS} giờ.`,
              embeds: [],
              components: [],
            });
          }
        } catch (error) {
          Logger.warn(
            `[MainJob/Quit] Quit confirmation for user ${userId} timed out or error: ${error.message}`,
          );
          await interaction
            .editReply({
              content: "❌ Bạn đã không xác nhận nghỉ việc. Lệnh đã bị hủy.",
              embeds: [],
              components: [],
            })
            .catch(() => {});
        }
      } else if (subcommand === "rewards") {
        // <<<----- LOGIC TỪ src/commands/main-job-system/main-job-level-rewards.js ----->>>
        await interaction.deferReply();
        const embed = new EmbedBuilder()
          .setTitle("🏆 Phần Thưởng & Lợi Ích Khi Thăng Cấp Nghề Chính")
          .setColor("Gold")
          .setDescription(
            "Khi bạn làm việc và tăng cấp cho nghề chính của mình, bạn sẽ nhận được nhiều lợi ích đáng giá!",
          )
          .addFields(
            {
              name: "💰 Lương Cao Hơn",
              value:
                "Mức lương cơ bản cho các nhiệm vụ chính (ví dụ: nhiệm vụ thu hoạch của Nông Dân, dạy học của Giáo Viên) sẽ tăng theo cấp độ nghề của bạn. Cấp càng cao, thu nhập càng ổn định!",
              inline: false,
            },
            {
              name: "✨ Mở Khóa Nhiệm Vụ/Tính Năng Mới",
              value:
                "Một số nghề có thể có các nhiệm vụ hoặc tính năng đặc biệt chỉ mở khóa khi bạn đạt đến một cấp độ nhất định. Ví dụ: Nông dân cấp cao có thể trồng được các loại cây hiếm hơn, Kỹ sư cấp cao có thể chế tạo các vật phẩm phức tạp hơn.",
              inline: false,
            },
            {
              name: "🎁 Phần Thưởng Một Lần (Tùy Chỉnh)",
              value:
                "Admin có thể thiết lập phần thưởng một lần (tiền VNĐ, vật phẩm đặc biệt, điểm Castrol, vé Gacha...) khi bạn đạt các cột mốc cấp độ quan trọng trong nghề (ví dụ: cấp 5, 10, 20...).",
              inline: false,
            },
            {
              name: "📛 Danh Hiệu & Role (Tùy Chỉnh)",
              value:
                "Đạt được các cấp độ cao trong nghề có thể mang lại cho bạn những danh hiệu hoặc role đặc biệt trên server, thể hiện sự chuyên nghiệp và cống hiến của bạn.",
              inline: false,
            },
            {
              name: "📉 Giảm Thời Gian Chờ (Cooldown)",
              value:
                "Một số vật phẩm hoặc kỹ năng đặc biệt (nếu có) có thể giúp bạn giảm thời gian chờ giữa các lần thực hiện nhiệm vụ nghề nghiệp.",
              inline: false,
            },
          )
          .setFooter({
            text: "Chi tiết phần thưởng và lợi ích cụ thể sẽ phụ thuộc vào từng nghề và cài đặt của server.",
          })
          .setTimestamp(); // Added missing .setTimestamp() call from original code
        await interaction.editReply({ embeds: [embed] }); // Added missing );
      } // Closing brace for 'rewards' subcommand block was missing, now implicitly added by structure below
    } catch (error) {
      // Re-inserting the catch block
      Logger.error(`Lỗi lệnh /mainjob ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      const errorMessage = "❌ Đã xảy ra lỗi khi xử lý lệnh Nghề nghiệp chính.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for mainjob:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for mainjob:", e));
      }
    }
  },
};
