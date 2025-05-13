const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-role-channel')
    .setDescription('Gửi tin nhắn chọn role giới tính & game vào 1 kênh')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Chọn kênh để gửi tin nhắn reaction role')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });
    const channel = interaction.options.getChannel('channel');

    // 📝 Tin nhắn chọn giới tính
    const genderMsg = await channel.send('Mày có cu không??');

    // 📝 Tin nhắn chọn game
    const gameMsg = await channel.send('Có chơi game không hay chơi đá? có thì chọn');

    // ✅ Thêm reaction mặc định (đã tồn tại trong server)
    await genderMsg.react('<:6004greatgatsbypepewink:1121035179234955354>'); // emoji cho nam
    await genderMsg.react('<:2767pepefrog:1121035207668154460>'); // emoji cho nữ
    
    await gameMsg.react('<:valorant:1366804078285291530>'); // emoji cho game
    await gameMsg.react('<:mc:1366804076385533983>');
    await gameMsg.react('<:Pubg:1366804070601588879>');
    await gameMsg.react('<:CS2:1366804063513084075>');
    await gameMsg.react('<:dst:1366804058937102396>');
    await gameMsg.react('<:genshin:1366803266444329051>');

    // 👉 Thêm emoji game sau nếu cần

    // ✅ Lưu messageId vào MongoDB
    let config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config) config = new GuildConfig({ guildId: interaction.guild.id });

    config.roleMessageIds = {
      gender: genderMsg.id,
      game: gameMsg.id
    };

    config.roleChannelId = channel.id;

    await config.save();

    await interaction.editReply({
      content: `✅ Đã gửi tin nhắn chọn role vào kênh ${channel}`,
    });
  }
};
