const ShopItem = require('../../models/ShopItem'); // Đường dẫn tới model
const mongoose = require('mongoose');

require('dotenv').config(); // Để sử dụng biến môi trường
async function seedItems() {
    await ShopItem.findOneAndUpdate(
        { itemId: 'phan-bon' },
        {
            itemId: 'phan-bon',
            name: 'Phân bón',
            description: 'Giúp cây trồng phát triển nhanh hơn, giảm thời gian chờ thu hoạch.',
            buyPrice: 10000,
            sellPrice: 1000,
            consumable: true,
            requiredJob: 'nông dân', // Ví dụ: chỉ nông dân mua được
            effects: {
                cooldownReduction: {
                    targetTaskId: 'thuHoach', // Ảnh hưởng task 'thuHoach'
                    reductionTime: 30 * 60 * 1000 // Giảm 30 phút (30 * 60 * 1000 ms)
                }
            }
        },
        { upsert: true, new: true }
    );
    console.log('✅ Đã tạo/cập nhật vật phẩm: Phân bón');

    await ShopItem.findOneAndUpdate(
        { itemId: 'hat-giong' }, // Đặt ID khác nếu có nhiều loại hạt giống
        {
            itemId: 'hat-giong',
            name: 'Hạt giống',
            description: 'Loại hạt giống đặc biệt, rút ngắn thời gian chờ gieo hạt tiếp theo.',
            buyPrice: 3000,
            sellPrice: 500,
            consumable: true,
            requiredJob: 'nông dân', // Ví dụ: chỉ nông dân mua được
            effects: {
                cooldownReduction: {
                    targetTaskId: 'gieoHat', // Ảnh hưởng task 'gieoHat'
                    reductionTime: 30 * 60 * 1000 // Giảm 1 giờ
                }
            }
        },
        { upsert: true, new: true }
    );
    console.log('✅ Đã tạo/cập nhật vật phẩm: Hạt giống');

    await ShopItem.findOneAndUpdate(
            { itemId: 'luoi-liem' },
            {
                itemId: 'luoi-liem',
                name: 'Lưỡi liềm',
                description: 'Một công cụ hữu ích để thu hoạch cây trồng.',
                buyPrice: 15000,
                sellPrice: 3000,
                consumable: true,
                requiredJob: 'nông dân', // Ví dụ: chỉ nông dân mua được
                effects: {
                    cooldownReduction: {
                        targetTaskId: 'catCo', // Ảnh hưởng task 'thuHoach'
                        reductionTime: 40 * 60 * 1000 // Giảm 1 giờ
                    }
                }
            },
            { upsert: true, new: true }
        );
    console.log('✅ Đã tạo/cập nhật vật phẩm: Lưỡi liềm');

    await ShopItem.findOneAndUpdate(
        { itemId: 'kinh-lup' },
        {
            itemId: 'kinh-lup',
            name: 'kính lúp',
            description: 'Một công cụ giúp bạn kiểm định và kiểm tra sản phẩm.',
            buyPrice: 10000,
            sellPrice: 0,
            consumable: true,
            requiredJob: ['công nhân', 'kỹ sư'], // Ví dụ: chỉ công nhân, kỹ sư mua được
            effects: {
                cooldownReduction: {
                    targetTaskId: ['kiemDinh', 'kiemTra'], // Ảnh hưởng task 'kiemDinh', 'kiemTra'
                    reductionTime: 60 * 60 * 1000 // Giảm 1 giờ
                }
            }
        },
        { upsert: true, new: true }
    );
    console.log('✅ Đã tạo/cập nhật vật phẩm: Kính lúp');

    await ShopItem.findOneAndUpdate(
            { itemId: 'toolkit' },
            {
                itemId: 'toolkit',
                name: 'Bộ dụng cụ',
                description: 'Bộ dụng cụ hữu ích cho việc lắp ráp thiết bị.',
                buyPrice: 7000,
                sellPrice: 1500,
                consumable: true,
                requiredJob: 'công nhân', // Ví dụ: chỉ kỹ sư mua được
                effects: {
                    cooldownReduction: {
                        targetTaskId: 'lapRap', // Ảnh hưởng task 'kiemTra'
                        reductionTime: 30 * 60 * 1000 // Giảm 30 phút
                    }
                }
            },
            { upsert: true, new: true }
        );
    console.log('✅ Đã tạo/cập nhật vật phẩm: Bộ dụng cụ');

    await ShopItem.findOneAndUpdate(
        { itemId: 'laptop' },
        {
            itemId: 'laptop',
            name: 'Laptop',
            description: 'Laptop giúp bạn làm việc hiệu quả hơn.',
            buyPrice: 150000,
            sellPrice: 5000,
            consumable: false,
            requiredJob: ['kỹ sư', 'giáo viên'], // Ví dụ: chỉ kỹ sư mua được
            effects: {
                cooldownReduction: {
                    targetTaskId: ['lapRap', 'thietKe', 'soanGiaoAn'], // Ảnh hưởng task 'kiemTra'
                    reductionTime: 90 * 60 * 1000 // Giảm 1 giờ
                }
            }
        },
        { upsert: true, new: true }
    );

    console.log('✅ Đã tạo/cập nhật vật phẩm: Laptop');
}

mongoose.connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log('✅ Kết nối MongoDB thành công. Bắt đầu seed dữ liệu...');
    seedItems().then(() => {
      console.log('🌾 Seed dữ liệu cửa hàng hoàn tất.');
      mongoose.disconnect();
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err);
  });

  //node src/database/seeds/seedShopItems.js