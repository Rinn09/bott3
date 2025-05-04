const mongoose = require('mongoose');
const MainJob = require('../../models/MainJob');
require('dotenv').config();


const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {})
  .then(() => {
    console.log('Kết nối MongoDB thành công. Bắt đầu seed dữ liệu...');
    createFarmerJob().then(() => {
      console.log('Seed dữ liệu hoàn tất.');
      mongoose.disconnect();
    });
  })
  .catch(err => {
    console.error('Lỗi kết nối MongoDB:', err);
  });

async function createFarmerJob() {
  await MainJob.findOneAndUpdate(
    { name: 'Nông dân' },
    {
      name: 'Nông dân',
      description: 'Chăm sóc và thu hoạch mùa màng.',
      tasks: [
        { name: 'Thu hoạch 10 nông sản', command: '/thu-hoach', xp: 10, reward: 100 },
        { name: 'Tưới cây', command: '/tuoi-cay', xp: 5, reward: 50 }
      ],
      salaryByLevel: {
        1: 100,
        2: 200,
        3: 400,
        4: 700,
        5: 1000
      }
    },
    { upsert: true }
  );

  console.log('Đã tạo/ cập nhật nghề chính: Nông dân');
}
