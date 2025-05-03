# 🤖 Bot Discord Quản Lý & Minigame

## 📌 Giới thiệu

Bot Discord Quản Lý & Minigame được xây dựng bằng **Node.js** và **Discord.js v14** kết hợp với **MongoDB**. Bot cung cấp một loạt các tính năng hỗ trợ quản trị, giải trí và tương tác cho server như gửi thông báo chào mừng/tạm biệt, quản lý tiền tệ, XP, hệ thống công việc, xác thực captcha, reaction role và nhiều tính năng khác.

## ⚙ Cài đặt

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Cài đặt các thư viện cần thiết:**
   ```bash
   npm install
   ```

3. **Tạo file `.env`** tại thư mục gốc với nội dung mẫu sau (chỉnh sửa TOKEN, MONGO_URI, CLIENT_ID,... theo cấu hình của bạn):
   ```env
   TOKEN=YOUR_BOT_TOKEN
   MONGO_URI=YOUR_MONGODB_URI
   CLIENT_ID=YOUR_CLIENT_ID
   GUILD_ID=YOUR_GUILD_ID
   NODE_ENV=development
   OWNER_ID=YOUR_OWNER_ID
   GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
   GOOGLE_CSE_ID=YOUR_GOOGLE_CSE_ID
   GOOGLE_APPLICATION_CREDENTIALS=./path-to-your-google.json
   ```

4. **Khởi động bot:**
   ```bash
   npm run dev
   ```
   hoặc
   ```bash
   npm start
   ```

## 📌 Tính năng chính

### 1. Hệ thống Prefix & Command Handler
- **Prefix Custom & Fake Interaction:** Sử dụng prefix (mặc định `!`) cho các lệnh text, hỗ trợ alias (ví dụ: `ping (p)`, `so_du (sd)`, `work (wk)`,...).
- **Command Handler:** Tự động load và đăng ký các lệnh từ thư mục `src/commands`.

### 2. Lệnh Quản Trị (Admin)
| 1   | /ban                 | Ban một thành viên khỏi server.                                                                | 
| 2   | /kick                | Đuổi một thành viên khỏi server.                                                              | 
| 3   | /mute                | Tắt tiếng (text/voice) cho thành viên.                                                         | 
| 4   | /unban               | Gỡ ban một thành viên khỏi server.                                                            | 
| 5   | /change-prefix       | Thay đổi prefix của bot cho server (cập nhật vào MongoDB và cache).                           | 
| 6   | /set-noti            | Cài đặt kênh thông báo nhận lương cho người dùng.                                              | 
| 7   | /anticaps            | Cấu hình chống spam tin nhắn chứa quá nhiều chữ IN HOA.                                       | 
| 8   | /captcha             | Xác thực người dùng qua captcha và gán role nếu thành công.                                   | 
| 9   | /list-bans           | Hiển thị danh sách người dùng bị ban.                                                        | 
| 10  | /refresh             | Làm mới (refresh) và đăng ký lại các lệnh với Discord API.                                     | 
| 11  | /reset-user          | Reset toàn bộ dữ liệu của người dùng (tiền, XP, level, …).                                     | 
| 12  | /setup-welcome       | Cài đặt kênh gửi tin nhắn chào mừng.                                                            | 
| 13  | /setup-goodbye       | Cài đặt kênh gửi tin nhắn tạm biệt.                                                             | 
| 14  | /setup-log           | Cài đặt kênh gửi log các sự kiện hoạt động server.                                             | 
| 15  | /setup-rule          | Cài đặt kênh nội quy để hiển thị trong tin nhắn chào mừng.                                     | 
| 16  | /setup-autorole      | Cài đặt role tự động gán cho thành viên mới.                                                   | 
| 17  | /setup-role-channel  | Gửi tin nhắn reaction role để người dùng chọn role (ví dụ: chọn giới tính, game).              | 
| 18  | /status              | Hiển thị tình trạng cấu hình Bot (các kênh, role tự động, log, v.v.).                         | 
| 19  | /disablecommand      | Vô hiệu hóa một lệnh theo kênh hoặc toàn server.                                               | 
| 20  | /lock                | Khoá kênh hiện tại cho @everyone.                                                              | 
| 21  | /unlock              | Mở khoá kênh hiện tại cho @everyone.                                                           | 
### 3. Hệ thống Tiền Tệ
| 23  | /daily               | Nhận thưởng hàng ngày (cooldown 24h).                                                          | 
| 24  | /work                | Làm việc kiếm tiền với hiệu ứng ngẫu nhiên (bonus, lost, drop, double, triple, jackpot).        | 
| 25  | /bank                | Gửi tiền vào hoặc rút tiền từ ngân hàng.                                                       | 
| 26  | /top-money           | Hiển thị bảng xếp hạng người giàu nhất (tổng tiền = ví + ngân hàng).                           | 
| 27  | /chuyen_tien         | Chuyển tiền cho người dùng khác.                                                              | 

### 4. Hệ thống Công Việc (Job System)
| 28  | /add-job             | Admin tạo một công việc mới với thông số: tên, tier, lương, cooldown, XP yêu cầu, …             | 
| 29  | /nhan_viec           | Người dùng ứng tuyển vào công việc hiện có.                                                  | Job 
| 30  | /cong_viec_hien_tai   | Hiển thị thông tin công việc hiện tại của người dùng.                                         | 
| 31  | /nhan_luong          | Nhận lương từ công việc sau khi hết cooldown.                                                  | 
| 32  | /nghi_viec           | Từ bỏ công việc hiện tại.                                                                      | 
| 33  | /remove-job          | Admin xóa bỏ một công việc khỏi hệ thống.                                                     | Job 
| 34  | /jobs                | Hiển thị danh sách tất cả các công việc đang có.                                               | 

### 5. Các Lệnh Tiện ích & Thông tin
| 35  | /ping                | Kiểm tra độ trễ của bot.                                                                        | 
| 36  | /avatar              | Hiển thị avatar của người dùng hoặc thành viên được tag.                                      | 
| 37  | /user-info           | Hiển thị thông tin chi tiết của thành viên.                                                  | 
| 38  | /server-info         | Hiển thị thông tin server (số thành viên, khu vực, v.v.).                                      | 
| 39  | /help                | Hiển thị danh sách lệnh và hướng dẫn sử dụng chi tiết.                                        | 
| 40  | /unmute              | Bỏ mute thành viên (text hoặc voice).                                                         |

### 6. Hệ Thống Cấp độ (Level System) & XP
| 41  | /level               | Hiển thị cấp độ và kinh nghiệm hiện tại của người dùng.                                      | 
| 42  | /rank                | Hiển thị bảng xếp hạng cấp độ của server.                                                      | 
| 43  | /add-xp              | Admin cộng XP cho người dùng.                                                                  | 
| 44  | /level-rewards       | Hiển thị phần thưởng và lợi ích theo cấp độ.                                                   | 

### 7. Các Tính Năng Hỗ Trợ Khác
- **Reaction Roles:** Cho phép người dùng chọn role theo emoji (ví dụ: chọn giới tính, game).
- **Welcome/Goodbye & Logging:** Gửi embed chào mừng/tạm biệt khi thành viên join/leave, log các sự kiện quan trọng vào kênh log đã cấu hình.
- **Salary Reminder:** Trong chế độ làm việc, hệ thống nhắc nhở người dùng nhận lương theo cooldown vào kênh đã cài đặt.
- **AntiCaps:** Xóa tin nhắn chứa quá nhiều chữ in hoa không được phép và gửi cảnh báo.

## 📂 Cấu trúc Dự Án
```
c:\bott3
├── src
│   ├── commands
│   │   ├── admin
│   │   │   ├── captcha.js
│   │   │   ├── change-prefix.js
│   │   │   ├── set-noti.js
│   │   │   └── status.js
│   │   ├── job-system
│   │   │   ├── add-job.js
│   │   │   ├── apply.js
│   │   │   ├── current-job.js
│   │   │   ├── nhan_luong.js
│   │   │   ├── nghi_viec.js
│   │   │   └── remove-job.js
│   │   ├── monetary_system
│   │   │   ├── bank.js
│   │   │   ├── daily.js
│   │   │   ├── so_du.js
│   │   │   ├── top-money.js
│   │   │   └── work.js
│   │   └── utility
│   │       ├── avatar.js
│   │       ├── help.js
│   │       ├── ping.js
│   │       └── user-info.js
│   ├── events
│   │   ├── messageCreate.js
│   │   ├── messageReactionAdd.js
│   │   ├── messageReactionRemove.js
│   │   └── statsUpdater.js
│   ├── handlers
│   │   ├── commandHandler.js
│   │   ├── eventHandler.js
│   │   └── prefixHandler.js
│   ├── functions
│   │   └── captcha.js
│   ├── models
│   │   ├── GuildConfig.js
│   │   ├── Job.js
│   │   ├── User.js
│   │   └── anticaps.js
│   ├── config
│   │   └── botConfig.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## 🚀 Phát triển sắp tới

- Tích hợp thêm minigame dân gian (bầu cua, xì dách, bài cào).
- Xây dựng WebUI dashboard để quản lý bot.
- Tối ưu hệ thống caching và database.
- Mở rộng các lệnh tiện ích và hệ thống tự động hóa quản lý server.

## 📌 Ghi chú

- Bot cần có đủ quyền: **Manage Roles**, **Send Messages**, **Embed Links**, **Add Reactions**.
- Role của bot phải cao hơn các role mà bot sẽ gán.
- Emoji dùng trong reaction role phải có sẵn trong server và bot có quyền sử dụng.
- Các lệnh sử dụng slash command và lệnh text (prefix) đều được tích hợp sẵn hệ thống fake interaction.

---

> ✨ Code bởi: [Le Thanh Lam](https://github.com/Rinn09). Mọi đóng góp, ý kiến và cải tiến đều được hoan nghênh!