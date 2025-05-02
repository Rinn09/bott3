
# 📚 Kế hoạch Lệnh Chức Năng Bổ Sung – Giai đoạn 2 (Final Extension)

## 1. Quản lý Role:
- `/addrole @user [role]` → Gán vai trò cho thành viên
- `/removerole @user [role]` → Xoá vai trò của thành viên
- `/roleinfo [role]` → Thông tin về vai trò (thành viên, quyền)
- `/createrole [name] [color] [permissions]` → Tạo vai trò mới
- `/deleterole [role]` → Xoá vai trò theo tên hoặc chọn từ list

## 2. Tiện ích Server:
- `/avatar [user?]` → Hiển thị avatar cá nhân hoặc của người khác
- `/ping` → Đo ping bot
- `/search [query]` → Tìm kiếm Google (hoặc Wiki)
- `/translate [lang] [text]` → Dịch văn bản sang ngôn ngữ đích (dùng API)

## 3. Trợ giúp / Hướng dẫn người dùng:
- `/help` → Tự động nhóm lệnh theo danh mục, hiển thị chi tiết:
    • Tên lệnh, mô tả
    • Permission yêu cầu (nếu có)
    • Ví dụ sử dụng
    • Tự động ẩn các lệnh admin nếu user không phải admin

## ⏳ Thứ tự triển khai gợi ý:
1. Tiện ích đơn giản (`/ping`, `/avatar`)
2. Lệnh role (`/addrole`, `/removerole`, `/roleinfo`)
3. Lệnh nâng cao (`/createrole`, `/deleterole`)
4. Dịch & Tìm kiếm (`translate`, `search`)
5. Lệnh `/help` dạng thông minh

