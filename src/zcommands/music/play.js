const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát nhạc từ YouTube')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL YouTube')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('search')
        .setDescription('Tìm kiếm video YouTube')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const url = interaction.options.getString('url');
    const search = interaction.options.getString('search');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('Lỗi')
          .setDescription('Bạn cần vào voice channel!')
          .setColor(0xFF0000)]
      });
    }

    console.log('Checking Lavalink status...');
    console.log('Shoukaku exists:', !!client.lavalinkHandler.shoukaku);
    console.log('Nodes size:', client.lavalinkHandler.shoukaku?.nodes?.size || 0);
    if (client.lavalinkHandler.shoukaku?.nodes?.size > 0) {
      const nodesArray = Array.from(client.lavalinkHandler.shoukaku.nodes.values());
      console.log('Nodes info:', nodesArray.map(n => ({
        name: n.options?.name,
        state: n.state,
        connected: !!n.connected,
        available: !!n.available
      })));
    }

    const node = client.lavalinkHandler.getNode();
    if (!node || !node.connected || !node.available) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('Lỗi')
          .setDescription('Lavalink chưa sẵn sàng! Vui lòng thử lại sau.')
          .setColor(0xFF0000)]
      });
    }

    const query = url || `ytsearch:${search}`;
    const res = await node.rest.resolve(query);

    if (!res || !res.tracks || res.tracks.length === 0) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('Không tìm thấy bài hát!')
          .setColor(0xFF0000)]
      });
    }

    const player = node.createPlayer({
      guildId: interaction.guild.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: interaction.channel.id,
      selfDeaf: true,
    });

    if (url || res.loadType === "TRACK_LOADED") {
      const track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing) player.play();

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('Đã thêm vào hàng chờ')
          .setDescription(`[${track.info.title}](${track.info.uri})`)
          .setColor(0x00FF00)]
      });
    }

    // Nếu là kết quả tìm kiếm
    const tracks = res.tracks.slice(0, 5);
    const buttons = tracks.map((t, i) =>
      new ButtonBuilder()
        .setCustomId(`select_${i}`)
        .setLabel(`${i + 1}`)
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle('Chọn bài hát:')
      .setDescription(tracks.map((t, i) => `${i + 1}. [${t.info.title}](${t.info.uri})`).join('\n'))
      .setColor(0x00FF00);

    const row = new ActionRowBuilder().addComponents(buttons);

    await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('select_'),
      time: 15000
    });

    collector.on('collect', async i => {
      const index = parseInt(i.customId.split('_')[1], 10);
      const track = tracks[index];

      player.queue.add(track);
      await i.update({
        embeds: [new EmbedBuilder()
          .setTitle('Đã thêm')
          .setDescription(`[${track.info.title}](${track.info.uri})`)
          .setColor(0x00FF00)],
        components: []
      });

      if (!player.playing) player.play();
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('Hết thời gian')
            .setDescription('Bạn không chọn bài nào.')
            .setColor(0xFF0000)],
          components: []
        });
      }
    });
  }
};
