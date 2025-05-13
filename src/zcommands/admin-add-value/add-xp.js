const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const User = require("../../models/User");
const { checkLevelUp } = require("../../utils/levelUtil");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-xp")
    .setDescription("Admin thêm XP cho user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Người nhận").setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Số XP").setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const guildId = interaction.guild.id;

    let user = await User.findOne({ userId: target.id, guildId });
    if (!user) user = await User.create({ userId: target.id, guildId });

    user.xp += amount;
    const result = checkLevelUp(user);
    await user.save();

    return interaction.reply(
      `✅ Đã thêm ${amount} XP cho **${target.tag}**.` +
        (result.leveledUp
          ? ` 🎉 **${target.tag}** đã lên ${result.levelUpCount} cấp tới cấp **${result.newLevel}** và nhận ${result.reward.toLocaleString()}đ!`
          : ""),
    );
  },
};
