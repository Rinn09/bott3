# 🤖 Bot Discord Quản Lý & Minigame (Dự án cá nhân)

## 📌 Giới thiệu

Bot được thiết kế bằng **JavaScript (Node.js)** với thư viện **Discord.js v14**, kết hợp với **MongoDB** để lưu cấu hình server. Bot cung cấp chức năng:

- Gửi **chào mừng/tạm biệt** tự động
- Gửi **log khi member ra/vào server** hoặc voice channel
- Gửi **nút tương tác**: Xem nội quy, Chọn giới tính, Chọn game
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

| Lệnh                    | Mô tả                                 |
| ----------------------- | ------------------------------------- |
| `/setup-welcome #kênh`  | Cài kênh gửi tin nhắn chào mừng       |
| `/setup-goodbye #kênh`  | Cài kênh gửi tin nhắn tạm biệt        |
| `/setup-log #kênh`      | Cài kênh gửi log ra/vào server, voice |
| `/setup-autorole @Role` | Tự động gán Role khi user tham gia    |
| `/setup-rule #kênh`     | Cài kênh nội quy cho Welcome Embed    |

---

## 🤝 Tính năng Welcome

- Gửi **embed chào mừng** khi member tham gia
- Chèn **đường dẫn kênh nội quy**
- Gửi **3 nút**:
  - [📖 Xem nội quy]
  - [🧑 Chọn giới tính] → Mở Select Menu gán role Nam/Nữ
  - [🎮 Chọn game] → Gán role game (Valorant, Genshin, CS2...)

## 📤 Goodbye & Logging

- Tự động gửi embed khi member **rời server**
- Ghi log khi member **join/leave voice channel**
- Tất cả gửi vào kênh log đã cài

---

## 🛠 Cáu trúc MongoDB (models/GuildConfig.js)

```js
{
  guildId: String,
  welcomeChannelId: String,
  goodbyeChannelId: String,
  rulesChannelId: String,
  logChannelId: String,
  autoRoleId: String
}
```

---

## 📌 Ghi chú

- Hãy chắc chắn bot có quyền **Manage Roles**, **Send Messages**, **Embed Links**
- Role bot trong danh sách role phải **cao hơn** các role mà bot sẽ gán
- Các ID role game, giới tính đã được định sẵn trong code (có thể tuỳ chỉnh sau)

---

## 🚀 Phát triển sắp tới

- Hệ thống tiền tệ chung
- Sòng bạc cho các con nghiện!

---

> ✨ Code bởi: [Le Thanh Lam](https://github.com/Rinn09) - Mở rộng, học hỏi, và vui vẻ!
