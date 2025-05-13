// src/commands/admin/admin-sidejob.js
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Job = require("../../models/Job"); // Model cho "Side Job"
const Logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin-sidejob")
    .setDescription("[Admin] Quản lý hệ thống việc làm phụ (Side Jobs).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Tạo một việc làm phụ mới.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Tên công việc (ví dụ: Giao báo, Phục vụ bàn).")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("tier")
            .setDescription("Cấp bậc của công việc (ví dụ: 1, 2, 3).")
            .setRequired(true)
            .setMinValue(1),
        )
        .addIntegerOption((option) =>
          option
            .setName("salary")
            .setDescription("Mức lương (VNĐ) cho mỗi lần làm.")
            .setRequired(true)
            .setMinValue(0),
        )
        .addIntegerOption((option) =>
          option
            .setName("cooldown_hours")
            .setDescription(
              "Thời gian chờ (tính bằng giờ) giữa các lần làm việc.",
            )
            .setRequired(true)
            .setMinValue(0),
        )
        .addIntegerOption((option) =>
          option
            .setName("min_xp")
            .setDescription(
              "Số XP tối thiểu người dùng cần có để nhận việc (mặc định 0).",
            )
            .setRequired(false)
            .setMinValue(0),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Xóa một việc làm phụ khỏi hệ thống.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription(
              "Tên công việc muốn xóa (nhập chính xác tên đã tạo).",
            )
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Không cần deferReply ở đây vì các lệnh con đều trả lời nhanh
    // await interaction.deferReply({ ephemeral: false });

    try {
      if (subcommand === "add") {
        const name = interaction.options.getString("name");
        const tier = interaction.options.getInteger("tier");
        const salary = interaction.options.getInteger("salary");
        const cooldownHours = interaction.options.getInteger("cooldown_hours");
        const minXP = interaction.options.getInteger("min_xp") || 0;

        const jobNameLower = name.toLowerCase();
        const existingJob = await Job.findOne({ name: jobNameLower });
        if (existingJob) {
          return interaction.reply({
            content: `❌ Một công việc phụ với tên "${name}" đã tồn tại!`,
            ephemeral: true,
          });
        }

        const cooldownMs = cooldownHours * 60 * 60 * 1000;

        const newJob = new Job({
          name: jobNameLower, // Lưu tên công việc bằng chữ thường để dễ query và tránh trùng lặp do viết hoa/thường
          tier,
          salary,
          cooldown: cooldownMs,
          minXP, // Sửa lại cho đúng tên field trong model Job (nếu là minXP) hoặc xpRequired (nếu là xpRequired)
          // Dựa trên file add-job.js gốc, bạn dùng minXP.
        });

        await newJob.save();

        Logger.info(
          `[Admin-SideJob/Add] Admin ${interaction.user.tag} created side job: ${name} (Tier: ${tier}, Salary: ${salary}, Cooldown: ${cooldownHours}h, MinXP: ${minXP})`,
        );
        return interaction.reply({
          content: `✅ Đã tạo việc làm phụ **${name}** thành công!\n• Tier: ${tier}\n• Lương: ${salary.toLocaleString()} VNĐ\n• Cooldown: ${cooldownHours} giờ\n• XP tối thiểu: ${minXP}`,
          ephemeral: false, // Để false cho admin dễ thấy kết quả
        });
      } else if (subcommand === "remove") {
        const nameToRemove = interaction.options
          .getString("name")
          .toLowerCase();
        const jobToDelete = await Job.findOne({ name: nameToRemove });

        if (!jobToDelete) {
          return interaction.reply({
            content: `❌ Công việc phụ với tên "${interaction.options.getString("name")}" không tồn tại để xóa!`,
            ephemeral: true,
          });
        }

        await jobToDelete.deleteOne();
        await User.updateMany(
          { "job.name": nameToRemove, guildId: interaction.guild.id },
          { $set: { job: null } }, // Hoặc bạn có thể set job.name thành một giá trị đặc biệt để xử lý sau
        );
        Logger.info(
          `[Admin-SideJob/Remove] Cleared job field for users who had the removed job: ${nameToRemove}`,
        );

        Logger.info(
          `[Admin-SideJob/Remove] Admin ${interaction.user.tag} removed side job: ${nameToRemove}`,
        );
        return interaction.reply({
          content: `✅ Công việc phụ **${jobToDelete.name}** đã được xóa thành công khỏi hệ thống!`, // Sử dụng jobToDelete.name để hiển thị đúng tên (đã toLowerCase)
          ephemeral: false,
        });
      }
    } catch (error) {
      Logger.error(`Lỗi lệnh /admin-sidejob ${subcommand}: ${error.message}`, {
        stack: error.stack,
      });
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Đã xảy ra lỗi khi quản lý việc làm phụ.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ Đã xảy ra lỗi khi quản lý việc làm phụ.",
          ephemeral: true,
        });
      }
    }
  },
};
