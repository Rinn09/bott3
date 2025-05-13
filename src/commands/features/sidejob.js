const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sidejob")
    .setDescription("Tương tác với hệ thống việc làm phụ (Side Jobs).")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Hiển thị danh sách các việc làm phụ có sẵn."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("apply")
        .setDescription("Ứng tuyển vào một việc làm phụ.")
        .addStringOption((option) =>
          option
            .setName("job_name")
            .setDescription("Tên của công việc bạn muốn ứng tuyển.")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("current")
        .setDescription("Xem thông tin việc làm phụ hiện tại của bạn."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("claim") // Đổi từ nhan_luong
        .setDescription("Nhận lương từ việc làm phụ hiện tại."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("resign") // Đổi từ nghi_viec
        .setDescription("Nghỉ việc làm phụ hiện tại."),
    ),

  async execute(interaction) {
    const userId = interaction.user.id; // Di chuyển khai báo lên trước
    const guildId = interaction.guild.id; // Di chuyển khai báo lên trước
    const actualUser = await User.findOne({ userId, guildId });
    const subcommand = interaction.options.getSubcommand();

    try {
      let user = await User.findOne({ userId, guildId });
      if (!user && !["list"].includes(subcommand)) {
        // Cho phép xem list jobs ngay cả khi chưa có data user
        user = await User.create({ userId, guildId });
      } else if (!user && ["list"].includes(subcommand)) {
        // Tạo user ảo để không lỗi khi lấy user.xp cho lệnh list
        user = { xp: 0, job: null }; // Không lưu vào DB
      }

      if (subcommand === "list") {
        // Logic từ cac_cong_viec.js
        await interaction.deferReply();
        const jobs = await Job.find({}).sort({ tier: 1, minXP: 1 }); // Sắp xếp theo tier rồi minXP

        if (!jobs.length) {
          return interaction.editReply(
            "❌ Hiện tại chưa có công việc phụ nào được tạo trong hệ thống.",
          );
        }

        const embed = new EmbedBuilder()
          .setTitle("💼 Danh sách việc làm phụ hiện có")
          .setColor(0x2ecc71)
          .setTimestamp()
          .setFooter({
            text: `XP hiện tại của bạn: ${user.xp.toLocaleString()}`,
          });

        let description = jobs
          .map((job) => {
            const hours = job.cooldown / (60 * 60 * 1000);
            const canApply = actualUser
              ? actualUser.xp >= job.minXP
              : user.xp >= job.minXP;

            return (
              `**${job.name.charAt(0).toUpperCase() + job.name.slice(1)}** (Tier ${job.tier})\n` +
              `💰 Lương: ${job.salary.toLocaleString()} VNĐ / ${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} giờ\n` +
              `📈 Yêu cầu: ${job.minXP.toLocaleString()} XP\n` +
              `${canApply ? "✅ Có thể ứng tuyển" : `🔒 Cần thêm ${(job.minXP - (actualUser ? actualUser.xp : user.xp)).toLocaleString()} XP`}\n`
            );
          })
          .join("\n");

        if (description.length > 4096) {
          description = description.substring(0, 4090) + "\n...";
        }
        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "apply") {
        // Logic từ apply.js
        await interaction.deferReply({ ephemeral: true });
        const jobNameInput = interaction.options
          .getString("job_name")
          .toLowerCase();
        const jobToApply = await Job.findOne({ name: jobNameInput });

        if (!jobToApply) {
          return interaction.editReply({
            content: `❌ Không tìm thấy công việc phụ nào có tên: "${interaction.options.getString("job_name")}".`,
          });
        }
        if (!user._id) {
          // User được tạo ảo cho 'list'
          user = await User.findOneAndUpdate(
            { userId, guildId },
            { $setOnInsert: { userId, guildId } },
            { upsert: true, new: true },
          );
        }

        if (user.job && user.job.name) {
          return interaction.editReply({
            content: `❌ Bạn đang làm công việc phụ **${user.job.name}**. Hãy dùng \`/sidejob resign\` trước khi xin việc mới.`,
          });
        }
        if (user.xp < jobToApply.minXP) {
          // Sử dụng minXP từ model Job
          return interaction.editReply({
            content: `❌ Bạn cần ít nhất ${jobToApply.minXP.toLocaleString()} XP để làm công việc này. (Hiện có: ${user.xp.toLocaleString()} XP)`,
          });
        }

        const now = new Date();
        user.job = {
          name: jobToApply.name,
          tier: jobToApply.tier,
          lastSalary: now,
          hiredAt: now,
        };
        await user.save();
        Logger.info(
          `[SideJob/Apply] User ${userId} applied for job ${jobToApply.name}`,
        );
        return interaction.editReply({
          content: `✅ Chúc mừng! Bạn đã được nhận vào làm **${jobToApply.name}** (Tier ${jobToApply.tier}) với mức lương ${jobToApply.salary.toLocaleString()} VNĐ!`,
        });
      } else if (subcommand === "current") {
        // Logic từ cong_viec_hien_tai.js
        await interaction.deferReply({ ephemeral: true });
        if (!user.job || !user.job.name) {
          return interaction.editReply({
            content: "Bạn hiện không có công việc phụ nào.",
          });
        }
        const jobDetails = await Job.findOne({ name: user.job.name }); // Lấy thông tin cooldown từ Job model

        const { name, tier, lastSalary, hiredAt } = user.job;
        const embed = new EmbedBuilder()
          .setTitle(
            `🛠️ Công việc phụ hiện tại của ${interaction.user.username}`,
          )
          .setColor("#00AFF0")
          .addFields(
            {
              name: "Tên công việc",
              value: name.charAt(0).toUpperCase() + name.slice(1),
              inline: true,
            },
            {
              name: "Tier",
              value: tier ? tier.toString() : "N/A",
              inline: true,
            },
          );
        if (hiredAt) {
          embed.addFields({
            name: "🗓️ Ngày nhận việc",
            value: `<t:${Math.floor(new Date(hiredAt).getTime() / 1000)}:R>`,
            inline: false,
          });
        }
        if (jobDetails && lastSalary) {
          const cooldownMs = jobDetails.cooldown;
          const nextClaimAvailable =
            new Date(lastSalary).getTime() + cooldownMs;
          if (Date.now() < nextClaimAvailable) {
            embed.addFields({
              name: "💰 Lần nhận lương tiếp theo",
              value: `Có thể nhận <t:${Math.floor(nextClaimAvailable / 1000)}:R>`,
              inline: false,
            });
          } else {
            embed.addFields({
              name: "💰 Trạng thái lương",
              value: "✅ Có thể nhận lương ngay!",
              inline: false,
            });
          }
        } else if (!lastSalary && jobDetails) {
          embed.addFields({
            name: "💰 Trạng thái lương",
            value: "✅ Có thể nhận lương ngay! (Lần đầu)",
            inline: false,
          });
        }

        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "claim") {
        // Logic từ nhan_luong.js
        await interaction.deferReply();
        if (!user.job || !user.job.name) {
          return interaction.editReply({
            content: "❌ Bạn hiện không có công việc phụ nào để nhận lương.",
          });
        }

        const jobDetails = await Job.findOne({ name: user.job.name });
        if (!jobDetails) {
          user.job = null; // Xóa job lỗi thời
          await user.save();
          return interaction.editReply({
            content:
              "⚠️ Công việc phụ của bạn không còn tồn tại trong hệ thống. Đã tự động cho bạn nghỉ việc.",
          });
        }

        const now = Date.now();
        const cooldownMs = jobDetails.cooldown;
        const lastSalaryTime = user.job.lastSalary
          ? new Date(user.job.lastSalary).getTime()
          : user.job.hiredAt
            ? new Date(user.job.hiredAt).getTime() - cooldownMs
            : 0; // Nếu chưa nhận lương, coi như đã qua cooldown

        const timePassedSinceLastSalary = now - lastSalaryTime;

        // Auto fire nếu AFK quá lâu (ví dụ: 2 lần cooldown)
        const maxAfkDelay = cooldownMs * 2;
        if (timePassedSinceLastSalary >= maxAfkDelay && user.job.lastSalary) {
          // Chỉ áp dụng nếu đã từng nhận lương
          const oldJobName = user.job.name;
          user.job = null;
          await user.save();
          Logger.info(
            `[SideJob/Claim] User ${userId} was fired from ${oldJobName} due to AFK (over ${maxAfkDelay / (60 * 60 * 1000)} hours).`,
          );
          return interaction.editReply({
            content: `⏰ Bạn đã bị sa thải khỏi việc làm phụ **${oldJobName}** do không nhận lương quá lâu (hơn ${Math.floor(maxAfkDelay / (60 * 60 * 1000))} giờ).`,
          });
        }

        if (timePassedSinceLastSalary < cooldownMs) {
          const remaining = cooldownMs - timePassedSinceLastSalary;
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((remaining % (1000 * 60)) / 1000);
          return interaction.editReply({
            content: `⏳ Bạn cần chờ thêm **${hours > 0 ? `${hours}h ` : ""}${mins > 0 ? `${mins}p ` : ""}${secs}s** để nhận lương từ việc làm phụ.`,
          });
        }

        user.balance += jobDetails.salary;
        user.totalEarned = (user.totalEarned || 0) + jobDetails.salary;
        user.job.lastSalary = new Date(now); // Cập nhật thời gian nhận lương
        await user.save();

        Logger.info(
          `[SideJob/Claim] User ${userId} claimed salary ${jobDetails.salary} from job ${jobDetails.name}`,
        );
        return interaction.editReply({
          content: `💸 Bạn đã nhận **${jobDetails.salary.toLocaleString()} VNĐ** từ công việc phụ **${jobDetails.name}**. Hẹn gặp lại sau!`,
        });
      } else if (subcommand === "resign") {
        // Logic từ nghi_viec.js
        await interaction.deferReply();
        if (!user.job || !user.job.name) {
          return interaction.editReply({
            content: "❌ Bạn hiện không có công việc phụ nào để nghỉ.",
          });
        }

        const oldJobName = user.job.name;
        user.job = null; // Set toàn bộ object job về null
        await user.save();
        Logger.info(
          `[SideJob/Resign] User ${userId} resigned from job ${oldJobName}`,
        );
        return interaction.editReply({
          content: `✅ Bạn đã nghỉ việc làm phụ **${oldJobName}**.`,
        });
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /sidejob ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      const errorMessage = "❌ Đã xảy ra lỗi khi xử lý lệnh việc làm phụ.";
      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in followUp for sidejob:", e));
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch((e) => Logger.error("Error in reply for sidejob:", e));
      }
    }
  },
};
