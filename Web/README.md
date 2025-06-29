# FER-CNN-LSTM Web Application

Hệ thống phân tích cảm xúc qua camera sử dụng mô hình CNN-LSTM với giao diện web.

## Tính năng chính

### 1. Phân tích cảm xúc real-time
- Sử dụng camera để chụp ảnh và phân tích cảm xúc
- Hỗ trợ phát hiện nhiều khuôn mặt cùng lúc
- Phân tích 7 loại cảm xúc: Vui vẻ, Buồn bã, Tức giận, Ngạc nhiên, Bình thường, Sợ hãi, Ghê tởm
- Đánh giá mức độ tham gia: Rất tích cực, Tích cực, Không tích cực

### 2. Chế độ stream
- Phân tích liên tục mỗi 2 giây
- Hiển thị kết quả real-time
- Lưu trữ dữ liệu vào database

### 3. Thống kê chi tiết
- Biểu đồ phân bố cảm xúc
- Thống kê mức độ tham gia
- Dữ liệu theo ngày/tuần/tháng

## Cài đặt và chạy

### Backend (Python/FastAPI)

1. Cài đặt dependencies:
```bash
cd Web/backend
pip install -r requirements.txt
```

2. Đảm bảo các file model đã được copy vào thư mục `models/`:
- `facial_expression_model_structure.json`
- `facial_expression_model_weights.h5`

3. Chạy server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (React/TypeScript)

1. Cài đặt dependencies:
```bash
cd Web/frontend
npm install
```

2. Chạy development server:
```bash
npm start
```

## API Endpoints

### Phân tích cảm xúc
- `POST /analyze-emotion` - Phân tích ảnh và lưu kết quả
- `POST /analyze-emotion-stream` - Phân tích frame video (stream)

### Thống kê
- `GET /stats/{period}` - Lấy thống kê theo ngày/tuần/tháng
- `GET /admin/stats/{period}` - Thống kê tổng hợp (admin)

### Quản lý người dùng
- `POST /register` - Đăng ký
- `POST /token` - Đăng nhập
- `GET /admin/users` - Danh sách người dùng (admin)

## Cách sử dụng

### 1. Đăng nhập
- Truy cập `http://localhost:3000`
- Đăng nhập với tài khoản mặc định: `admin/123`

### 2. Sử dụng camera
- Vào menu "Camera"
- Bật camera
- Chọn "Chụp & Phân tích" hoặc "Bật stream"
- Xem kết quả phân tích chi tiết

### 3. Xem thống kê
- Vào menu "Thống kê cảm xúc"
- Chọn khoảng thời gian
- Xem biểu đồ và dữ liệu chi tiết

## Cấu trúc dữ liệu

### Kết quả phân tích cảm xúc
```json
{
  "faces_detected": 1,
  "results": [
    {
      "face_position": {"x": 100, "y": 100, "width": 200, "height": 200},
      "emotions": {"happy": 85.2, "sad": 5.1, ...},
      "dominant_emotion": "happy",
      "dominant_emotion_vn": "Vui vẻ",
      "dominant_emotion_score": 85.2,
      "engagement": "Rất tích cực",
      "emotions_vn": {"Vui vẻ": 85.2, "Buồn bã": 5.1, ...}
    }
  ],
  "success": true
}
```

## Mô hình AI

- **Kiến trúc**: CNN-LSTM (Convolutional Neural Network + Long Short-Term Memory)
- **Input**: Ảnh khuôn mặt 48x48 grayscale
- **Output**: 7 cảm xúc với điểm số từ 0-100%
- **Phát hiện khuôn mặt**: Haar Cascade Classifier

## Công nghệ sử dụng

### Backend
- FastAPI (Python)
- SQLAlchemy (ORM)
- OpenCV (xử lý ảnh)
- TensorFlow/Keras (AI model)
- JWT (authentication)

### Frontend
- React 18
- TypeScript
- Ant Design (UI)
- React Router (routing)

## Troubleshooting

### Lỗi camera
- Đảm bảo trình duyệt hỗ trợ WebRTC
- Cho phép quyền truy cập camera
- Kiểm tra camera có hoạt động không

### Lỗi model
- Kiểm tra file model đã được copy đúng chưa
- Đảm bảo TensorFlow đã được cài đặt
- Kiểm tra log backend để debug

### Lỗi database
- Kiểm tra kết nối database
- Đảm bảo schema đã được tạo
- Kiểm tra quyền truy cập

## Phát triển thêm

### Thêm cảm xúc mới
1. Cập nhật `EMOTIONS` trong `emotion_service.py`
2. Thêm translation trong `EMOTION_TRANSLATIONS`
3. Retrain model với dữ liệu mới

### Tùy chỉnh giao diện
1. Chỉnh sửa components trong `src/components/`
2. Cập nhật styles và themes
3. Thêm animations và transitions

### Tối ưu hiệu suất
1. Sử dụng Web Workers cho xử lý ảnh
2. Implement caching cho model
3. Tối ưu database queries 