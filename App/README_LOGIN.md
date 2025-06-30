# Hệ thống Đăng nhập Mobile App

## Tổng quan

Hệ thống đăng nhập đã được tích hợp vào ứng dụng mobile với các tính năng sau:

### Tính năng chính:

1. **Trang đăng nhập** (`/app/login.tsx`)

   - Giao diện đẹp và thân thiện
   - Validation form
   - Hiển thị loading khi đăng nhập
   - Thông báo lỗi rõ ràng

2. **AuthContext** (`/contexts/AuthContext.tsx`)

   - Quản lý trạng thái đăng nhập toàn cục
   - Lưu trữ token và thông tin user
   - Cung cấp các hàm login/logout

3. **Route Protection**

   - Tự động chuyển hướng dựa trên trạng thái đăng nhập
   - Bảo vệ các trang yêu cầu đăng nhập

4. **Header với thông tin user**

   - Hiển thị tên người dùng
   - Nút đăng xuất nhanh

5. **Trang Profile** (`/app/(tabs)/profile.tsx`)
   - Hiển thị thông tin tài khoản
   - Nút đăng xuất an toàn

## Cách sử dụng:

### 1. Khởi động ứng dụng:

```bash
cd App
npm start
```

### 2. Tài khoản mặc định:

- **Username:** admin
- **Password:** 123

### 3. Luồng đăng nhập:

1. Mở ứng dụng → Tự động chuyển đến trang đăng nhập
2. Nhập username và password
3. Nhấn "Đăng nhập"
4. Sau khi thành công → Chuyển đến trang chính

### 4. Đăng xuất:

- Cách 1: Nhấn nút đăng xuất ở header
- Cách 2: Vào tab "Hồ sơ" → Nhấn "Đăng xuất"

## Cấu trúc file:

```
App/
├── app/
│   ├── login.tsx              # Trang đăng nhập
│   ├── _layout.tsx            # Layout chính với route protection
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab layout với header
│   │   ├── profile.tsx        # Trang hồ sơ
│   │   └── index.tsx          # Trang chính (đã cập nhật API calls)
│   └── contexts/
│       └── AuthContext.tsx    # Context quản lý auth
```

## API Integration:

### Backend URL:

- **Base URL:** `http://localhost:8000`
- **Login endpoint:** `POST /token`
- **Protected endpoints:** Yêu cầu Bearer token

### Headers cho API calls:

```javascript
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`,
}
```

## Tính năng bảo mật:

1. **Token-based Authentication**

   - JWT token được lưu trữ an toàn
   - Tự động gửi token trong mọi API call

2. **Route Protection**

   - Chặn truy cập vào trang chính khi chưa đăng nhập
   - Tự động chuyển hướng về trang đăng nhập

3. **Session Management**
   - Token được lưu trữ trong global state
   - Tự động kiểm tra trạng thái khi khởi động app

## Troubleshooting:

### Lỗi kết nối:

- Kiểm tra backend có đang chạy không
- Kiểm tra URL API trong `login.tsx`

### Lỗi đăng nhập:

- Kiểm tra username/password
- Kiểm tra console log để xem lỗi chi tiết

### Lỗi token:

- Đăng xuất và đăng nhập lại
- Kiểm tra token có hợp lệ không

## Cải tiến có thể thêm:

1. **AsyncStorage/SecureStore**

   - Lưu token vào bộ nhớ an toàn
   - Tự động đăng nhập khi khởi động app

2. **Refresh Token**

   - Tự động làm mới token khi hết hạn

3. **Biometric Authentication**

   - Đăng nhập bằng vân tay/face ID

4. **Remember Me**

   - Tùy chọn ghi nhớ đăng nhập

5. **Forgot Password**
   - Chức năng quên mật khẩu
