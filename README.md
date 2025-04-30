# 🤖 Bot Discord Quản Lý & Minigame (Dự án cá nhân)

## 📌 Giới thiệu

Bot được thiết kế bằng **JavaScript (Node.js)** với thư viện **Discord.js v14**, kết hợp với **MongoDB** để lưu cấu hình server. Bot cung cấp chức năng:

- Gửi **chào mừng/tạm biệt** tự động
- Gửi **log khi member ra/vào server** hoặc voice channel
- Gửi **reaction role tự động**: chọn giới tính và game bằng emoji
- Lệnh admin dễ cài đặt

## ⚙ Cài đặt

### 1. Cài thư viện
```bash
npm install
```

### 2. Tạo file `.env`
```env
TOKEN=YOUR_BOT_TOKEN
MONGO_URI=YOUR_MONGODB_URI
NODE_ENV=development
```

### 3. Khởi động bot
```bash
node src/index.js
```

---

## 🧩 Các lệnh cài đặt (Admin)
> Yêu cầu role admin trong server

| Lệnh                        | Mô tả                                                  |
|-----------------------------|---------------------------------------------------------|
| `/setup-welcome #kênh`     | Cài kênh gửi tin nhắn chào mừng                         |
| `/setup-goodbye #kênh`     | Cài kênh gửi tin nhắn tạm biệt                          |
| `/setup-log #kênh`         | Cài kênh gửi log ra/vào server, voice                   |
| `/setup-autorole @Role`    | Tự động gán Role khi user tham gia                      |
| `/setup-rule #kênh`        | Cài kênh nội quy cho Welcome Embed                      |
| `/setup-role-channel #kênh`| Gửi tin nhắn phản ứng chọn giới tính và game vào kênh   |

---

## 🤝 Tính năng Welcome

- Gửi **embed chào mừng** khi member tham gia
- Chèn **đường dẫn kênh nội quy**
- Gửi **3 nút**:
  - [📖 Xem nội quy]
  - [🧑 Chọn giới tính] → chuyển sang hệ thống reaction role
  - [🎮 Chọn game] → chuyển sang hệ thống reaction role

## 🧷 Reaction Role (thay thế hệ thống button)

- Sử dụng `/setup-role-channel` để bot gửi 2 tin nhắn:
  - "Bạn là nam hay nữ?" → phản ứng bằng emoji `:6004greatgatsbypepewink:` (Nam), `:2767pepefrog:` (Nữ)
  - "Bạn chơi game gì?" → phản ứng bằng emoji tương ứng (Minecraft, PUBG, CS2...)
- Khi thành viên nhấn emoji, bot sẽ gán role tương ứng

## 📤 Goodbye & Logging

- Tự động gửi embed khi member **rời server**
- Ghi log khi member **join/leave voice channel**
- Tất cả gửi vào kênh log đã cài

---

## 🛠 Cấu trúc MongoDB (models/GuildConfig.js)
```js
{
  guildId: String,
  welcomeChannelId: String,
  goodbyeChannelId: String,
  rulesChannelId: String,
  logChannelId: String,
  autoRoleId: String,
  roleMessageIds: {
    gender: String,
    game: String
  }
}
```

---

## 📌 Ghi chú

- Hãy chắc chắn bot có quyền **Manage Roles**, **Send Messages**, **Embed Links**, **Add Reactions**
- Role bot trong danh sách role phải **cao hơn** các role mà bot sẽ gán
- Các emoji được sử dụng phải nằm trong server và có quyền sử dụng

---

## 🚀 Phát triển sắp tới

- Hệ thống tiền tệ chung
- Minigame dân gian (bầu cua, xì dách, bài cào)
- Giao diện WebUI dashboard

---

> ✨ Code bởi: [Le Thanh Lam](https://github.com/Rinn09) - Mở rộng, học hỏi, và vui vẻ!