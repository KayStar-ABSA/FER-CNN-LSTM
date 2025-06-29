# FER-CNN-LSTM Admin Backend (FastAPI)

Đây là backend API cho hệ thống quản trị và thống kê cảm xúc FER-CNN-LSTM.

## Yêu cầu
- Python 3.8+
- PostgreSQL

## Cài đặt
1. Tạo virtual environment và cài đặt package:
   ```bash
   cd Web/backend
   python -m venv venv
   source venv/Scripts/activate  # Windows
   python -m pip install --upgrade pip
   # hoặc
   source venv/bin/activate  # Linux/Mac
   pip install psycopg2-binary --only-binary :all:
   pip install -r requirements.txt

   pip install python-dotenv psycopg2-binary
   ```
2. Tạo database PostgreSQL:
   - Tạo database tên `fer_cnn_lstm` (hoặc đổi lại trong `database.py`)
   - Tạo user/password phù hợp (mặc định: user `postgres`, password `password`)
   - Có thể chỉnh thông tin kết nối trong file `database.py` qua biến môi trường hoặc sửa trực tiếp.

## Chạy server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Các API chính
- `POST /register` — Đăng ký tài khoản
- `POST /token` — Đăng nhập, nhận JWT token
- `POST /emotion` — Lưu kết quả cảm xúc
- `GET /stats/{period}` — Thống kê cảm xúc cá nhân (ngày/tuần/tháng/năm)
- `GET /admin/stats/{period}` — Thống kê tổng hợp (admin)
- `GET /admin/users` — Lấy danh sách user (admin)
- `POST /predict` — Nhận diện cảm xúc từ ảnh (base64)

## Ghi chú
- Đảm bảo backend chạy ở cổng 8000 để frontend kết nối mặc định.
- Để tích hợp model nhận diện thật, cập nhật hàm `/predict` trong `main.py`. 