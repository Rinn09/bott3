module.exports = {
    customId: 'gender-select',
    async execute(interaction) {
      const roleId = interaction.values[0]; // lấy ID role từ value được chọn
      const role = interaction.guild.roles.cache.get(roleId);
  
      if (!role) {
        return interaction.reply({ content: '❌ Không tìm thấy role!', ephemeral: true });
      }
  
      try {
        await interaction.member.roles.add(role);
        await interaction.reply({ content: `✅ Đã gán giới tính **${role.name}** cho bạn!`, ephemeral: true });
      } catch (error) {
        console.error('Lỗi khi gán role:', error);
        await interaction.reply({ content: '❌ Có lỗi xảy ra khi gán role.', ephemeral: true });
      }
    }
  };
  