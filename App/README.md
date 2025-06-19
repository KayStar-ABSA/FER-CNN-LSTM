# Ứng dụng React Native với Expo

Đây là ứng dụng mẫu phát triển bằng [Expo](https://expo.dev) và React Native, sử dụng cấu trúc routing hiện đại, hỗ trợ đa nền tảng (Android, iOS, Web).

## Tính năng chính
- Giao diện mẫu với hai tab: **Home** và **Explore**
- Hỗ trợ chế độ sáng/tối tự động
- Tích hợp custom font, hình ảnh đa độ phân giải
- Hỗ trợ hiệu ứng động (animation) với `react-native-reanimated`
- Điều hướng (navigation) bằng file-based routing với `expo-router`
- Chạy được trên Android, iOS, và Web

## Cài đặt và khởi động

1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Khởi động ứng dụng:
   ```bash
   npx expo start -p android
   ```
3. Chọn nền tảng để chạy thử:
   - Thiết bị thật với [Expo Go](https://expo.dev/go)
   - Giả lập Android/iOS hoặc trình duyệt Web

## Cấu trúc thư mục chính

```
App/
├── app/                # Source code chính, cấu trúc routing theo thư mục
│   ├── (tabs)/         # Các màn hình dạng tab (Home, Explore)
│   ├── _layout.tsx     # Định nghĩa layout và navigation
│   └── +not-found.tsx  # Trang lỗi 404
├── assets/             # Hình ảnh, font chữ
├── components/         # Các component UI tái sử dụng
├── constants/          # Các hằng số cấu hình
├── hooks/              # Custom hooks
├── scripts/            # Script tiện ích (reset project, ...)
├── package.json        # Thông tin, scripts, dependencies
├── app.json            # Cấu hình Expo
└── README.md           # Tài liệu này
```

## Công nghệ sử dụng
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [expo-router](https://expo.github.io/router/docs)
- [react-native-reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/)
- [@react-navigation/native](https://reactnavigation.org/)

## Phát triển thêm
- Sửa đổi hoặc thêm màn hình mới trong thư mục `app/`
- Thay đổi giao diện, thêm component trong `components/`
- Tham khảo tài liệu chính thức của Expo và React Native để mở rộng tính năng

## Tài nguyên tham khảo
- [Tài liệu Expo](https://docs.expo.dev/)
- [Tài liệu React Native](https://reactnative.dev/docs/getting-started)
- [Hướng dẫn expo-router](https://expo.github.io/router/docs)

---

*Liên hệ hoặc đóng góp: vui lòng tạo issue hoặc pull request trên repository này.*
