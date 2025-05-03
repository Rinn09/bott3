const AntiCaps = require('../models/anticaps');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (message.author.bot) return;
        const data = await AntiCaps.findOne({ 
            guildId: message.guild.id, 
            channelId: message.channel.id 
        });
        if (!data) return;

        var check = false;
        var interaction = null;
        await data.allowedUsers.forEach(async (user) => {
            const u = await client.users.fetch(user.toString()).catch(() => {});
            if (u) {
                if (u.id === message.author.id) {
                    check = true;
                    interaction = u;
                }
            }
            interaction++;
        });
        while (interaction < data.allowedUsers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (check) return;
        const upcaseChars = await message.content.split('').filter(char => char >= 'A' && char <= 'Z').length;

        if (message.content.length > 0 && upcaseChars / message.content.length > 0.5 && message.content.length > 5) { 
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`❌ Bạn không được phép gửi tin nhắn có nhiều chữ in hoa trong kênh này.`)
                .setTimestamp()
                .setFooter({ text: 'AntiCaps' });
            await message.channel.send({ embeds: [embed] });
            await new Promise(resolve => setTimeout(resolve, 3000));
            await message.delete();
        }
    }
}