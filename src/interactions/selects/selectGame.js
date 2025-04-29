module.exports = {
    customId: 'game-select',
    async execute(interaction) {
      const roleId = interaction.values[0];
      const role = interaction.guild.roles.cache.get(roleId);
  
      if (!role) {
        return interaction.reply({ content: '❌ Không tìm thấy role!', flags: 64 });
      }
  
      try {
        await interaction.member.roles.add(role);
        await interaction.reply({ content: `✅ Đã thêm game **${role.name}** vào profile của bạn!`, flags: 64 });
      } catch (error) {
        console.error('Lỗi khi gán role:', error);
        await interaction.reply({ content: '❌ Có lỗi xảy ra khi gán role.', flags: 64 });
      }
    }
  };
  