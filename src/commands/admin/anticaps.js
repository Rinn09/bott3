const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AntiCaps = require('../../models/anticaps');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anticaps')
        .setDescription('Cài đặt tính năng chống chữ in hoa.')
        .addSubcommand(command => command
            .setName('setup')
            .setDescription('Cài đặt tính năng chống chữ in hoa.')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('Chọn kênh để gửi thông báo.')
                .addChannelTypes(0, 5)
                .setRequired(true))
            .addStringOption(option => option
                .setName('allowed-ids')
                .setDescription('Danh sách ID người dùng được phép gửi tin nhắn in hoa.')
                .setRequired(false))
        )
        .addSubcommand(command => command
            .setName('disable')
            .setDescription('Tắt tính năng chống chữ in hoa.')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('Chọn kênh tắt tính năng chống chữ in hoa.')
                .addChannelTypes(0, 5)
                .setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            const { options } = interaction;
            const subcommand = options.getSubcommand();

            const channel = options.getChannel('channel');
            const data = await AntiCaps.findOne({ guildId: interaction.guild.id, channelId: channel.id });

            async function sendMessage(channel, message) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(message)
                    .setTimestamp()
                    .setFooter({ text: 'AntiCaps' });

                await interaction.reply({ embeds: [embed] });
            }

            switch (subcommand) {
                case 'setup':
                    if (data) {
                        return sendMessage(channel, `Tính năng chống chữ in hoa đã được cài đặt trong kênh ${channel}.`);
                    } else {
                        const allowedRaw = options.getString('allowed-ids');
                        let allowedArray = [];
                        if (allowedRaw) {
                            allowedArray = allowedRaw.split(',').map(id => id.trim());
                        }

                        await AntiCaps.create({
                            guildId: interaction.guild.id,
                            channelId: channel.id,
                            allowedUsers: allowedArray
                        });

                        await sendMessage(channel, `Tính năng chống chữ in hoa đã được cài đặt trong kênh ${channel}.`);
                    }
                    break;
                case 'disable':
                    if (!data) {
                        return sendMessage(channel, `Tính năng chống chữ in hoa chưa được cài đặt trong kênh ${channel}.`);
                    } else {
                        await AntiCaps.deleteOne({ guildId: interaction.guild.id, channelId: channel.id });
                        await sendMessage(channel, `Tính năng chống chữ in hoa đã được tắt trong kênh ${channel}.`);
                    }
                    break;
            }
        }
}