# Email Verification Feature

## Overview
Đã thêm tính năng xác nhận email với mã 6 số khi đăng ký tài khoản mới. Tính năng này đảm bảo người dùng phải xác nhận email trước khi tài khoản được tạo.

## Features
- ✅ Gửi email với mã 6 số khi đăng ký
- ✅ Popup đẹp mắt để nhập mã, tương thích với theme hệ thống
- ✅ Đếm ngược thời gian hết hạn (10 phút)
- ✅ Tính năng gửi lại mã với cooldown 60 giây
- ✅ Giới hạn số lần thử (5 lần)
- ✅ Auto-focus và paste support cho input
- ✅ Responsive design
- ✅ Dark/Light theme support

## Setup Instructions

### 1. Email Configuration
Cập nhật file `.env` với thông tin email:

```env
# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Game BlockChain <your-email@gmail.com>
```

**Lưu ý:** Để sử dụng Gmail, bạn cần:
1. Bật 2-factor authentication
2. Tạo App Password tại Google Account Settings
3. Sử dụng App Password thay vì password thông thường

### 2. Database Migration
Chạy migrations để tạo bảng mới:
```bash
npx sequelize-cli db:migrate
```

### 3. Dependencies
Đã cài đặt:
- `nodemailer` - Gửi email
- Frontend components và CSS đã sẵn sàng

## How It Works

### Backend Flow
1. **POST /api/auth/send-verification**
   - Tạo mã 6 số ngẫu nhiên
   - Lưu vào bảng `email_verifications` với thời hạn 10 phút
   - Gửi email với template đẹp

2. **POST /api/auth/verify-email**
   - Kiểm tra mã có hợp lệ và chưa hết hạn
   - Giới hạn 5 lần thử
   - Đánh dấu email đã xác nhận

3. **POST /api/auth/signup** (Modified)
   - Kiểm tra email đã được xác nhận chưa
   - Chỉ tạo tài khoản sau khi email đã xác nhận

### Frontend Flow
1. User điền form đăng ký và submit
2. Hệ thống gửi mã xác nhận qua email
3. Popup hiện ra yêu cầu nhập mã 6 số
4. Sau khi xác nhận thành công, tài khoản được tạo
5. Tự động redirect đến trang chủ

## Database Schema

### email_verifications table
```sql
- id (INTEGER, PK, Auto Increment)
- email (VARCHAR(100), NOT NULL)
- code (VARCHAR(6), NOT NULL)
- expires_at (DATETIME, NOT NULL)
- verified (BOOLEAN, DEFAULT false)
- attempts (INTEGER, DEFAULT 0)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### users table (Added columns)
```sql
- email_verified (BOOLEAN, DEFAULT false)
- email_verified_at (DATETIME, NULL)
```

## API Endpoints

### Send Verification Email
```http
POST /api/auth/send-verification
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username"
}
```

### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

## Component Usage

### EmailVerificationPopup
```jsx
<EmailVerificationPopup
  isOpen={showEmailVerification}
  onClose={handleCloseVerification}
  onVerifySuccess={handleVerificationSuccess}
  email="user@example.com"
  username="Username"
  onResendCode={handleResendVerification}
/>
```

## Error Handling
- ❌ Email đã được sử dụng
- ❌ Mã xác nhận không hợp lệ
- ❌ Mã xác nhận đã hết hạn
- ❌ Vượt quá số lần thử
- ❌ Không thể gửi email

## Security Features
- Rate limiting với cooldown
- Mã xác nhận tự động hết hạn sau 10 phút
- Giới hạn số lần thử
- Xóa mã cũ khi tạo mã mới
- Validation chặt chẽ

## Styling
- Responsive design
- Dark/Light theme support
- Modern UI với animations
- Accessible (ARIA labels, keyboard navigation)

## Testing

### Test Email Verification Flow
1. Đăng ký với email thật
2. Kiểm tra email inbox
3. Nhập mã 6 số vào popup
4. Verify tài khoản được tạo thành công

### Test Error Cases
1. Nhập sai mã
2. Để mã hết hạn
3. Thử quá 5 lần
4. Gửi lại mã trước khi hết cooldown

## Customization

### Email Template
Chỉnh sửa template trong `src/utils/emailService.js`:
- HTML layout
- CSS styling
- Nội dung text

### Timing Settings
- Expiration time: 10 phút (có thể thay đổi)
- Resend cooldown: 60 giây
- Max attempts: 5 lần

### UI Theme
CSS variables trong `EmailVerification.css` để customize theme.