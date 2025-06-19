# API Dự đoán Cảm Xúc từ Ảnh

Thư mục này chứa mã nguồn API Python sử dụng Flask, cho phép nhận ảnh khuôn mặt và trả về kết quả dự đoán cảm xúc. API này phù hợp để tích hợp với ứng dụng mobile hoặc các hệ thống khác.

## Chức năng chính
- Nhận ảnh khuôn mặt qua HTTP POST
- Dự đoán cảm xúc chủ đạo và xác suất từng cảm xúc bằng mô hình học sâu (Keras)
- Trả về kết quả dưới dạng JSON

## Cài đặt
1. Cài đặt các thư viện cần thiết:
   ```bash
   pip install flask keras opencv-python numpy
   ```
2. Đảm bảo đã có 2 file model trong thư mục `demo/` (ở cùng cấp với thư mục `api/`):
   - `facial_expression_model_structure.json`
   - `facial_expression_model_weights.h5`

## Cách chạy API
```bash
python emotion_api.py
```
- Mặc định API sẽ chạy ở địa chỉ: `http://localhost:5000`

## Gọi API từ client/mobile
- Endpoint: `POST /predict`
- Dữ liệu gửi lên: dạng `form-data`, key là `image`, value là file ảnh (jpg/png)

### Ví dụ dùng curl:
```bash
curl -X POST http://localhost:5000/predict -F "image=@/duong_dan/anh.jpg"
```

### Kết quả trả về mẫu:
```json
{
  "dominant_emotion": "happy",
  "emotions": {
    "angry": 0.12,
    "disgust": 0.01,
    "fear": 0.05,
    "happy": 98.23,
    "sad": 0.10,
    "surprise": 0.30,
    "neutral": 1.19
  }
}
```

## Cấu trúc thư mục
```
api/
├── emotion_api.py   # Mã nguồn Flask API
└── README.md        # Tài liệu này
```

## Lưu ý
- Model được nạp từ thư mục `../demo/`. Đảm bảo các file model luôn đồng bộ với mã nguồn.
- API chỉ xử lý ảnh đầu vào là khuôn mặt. Nếu ảnh không phải khuôn mặt, kết quả có thể không chính xác.
- Có thể mở rộng để nhận diện nhiều khuôn mặt hoặc tích hợp thêm các chức năng khác.

---

*Mọi thắc mắc hoặc đóng góp, vui lòng liên hệ hoặc tạo issue trên repository.* 