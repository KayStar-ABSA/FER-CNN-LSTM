# FER-CNN-LSTM Admin Web (Frontend)

Đây là giao diện web quản trị và người dùng cho hệ thống nhận diện cảm xúc FER-CNN-LSTM.

## Chức năng chính
- Đăng nhập, phân quyền user/admin
- Dashboard thống kê cảm xúc cá nhân (ngày, tuần, tháng, năm)
- Dashboard admin: thống kê tổng hợp, xem danh sách user
- Trang quay camera, gửi ảnh lên backend để nhận diện cảm xúc

## Cấu trúc thư mục
- `src/pages/LoginPage.tsx`: Trang đăng nhập
- `src/pages/UserDashboard.tsx`: Dashboard người dùng
- `src/pages/AdminDashboard.tsx`: Dashboard admin
- `src/pages/CameraPage.tsx`: Trang quay camera
- `src/App.tsx`: Định tuyến các trang

## Hướng dẫn chạy
1. Cài đặt dependencies:
   ```bash
   cd Web/frontend
   npm install --legacy-peer-deps
   ```
2. Chạy ứng dụng:
   ```bash
   npm start
   ```
   Ứng dụng sẽ chạy ở [http://localhost:3000](http://localhost:3000)

## Kết nối backend
- Mặc định frontend gọi API backend tại `http://localhost:8000`
- Đảm bảo backend FastAPI đã chạy ở cổng 8000

## Ghi chú
- Để sử dụng tính năng camera, trình duyệt cần cho phép truy cập webcam.
- Đăng nhập bằng tài khoản đã đăng ký trên backend.
- Nếu là admin sẽ vào dashboard admin, người dùng thường sẽ vào dashboard cá nhân.
