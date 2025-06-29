# FER CNN-LSTM API

API phân tích cảm xúc khuôn mặt sử dụng mô hình CNN-LSTM

## Tác giả

**Phạm Tấn Thuận**  
GitHub: [@KayStar645](https://github.com/KayStar645)  
Tổ chức: [@KayStar-ABSA](https://github.com/KayStar-ABSA)

## Tính năng

- Phân tích cảm xúc khuôn mặt từ ảnh
- Quản lý phiên phân tích thời gian thực
- Thống kê và báo cáo chi tiết
- Hệ thống xác thực và phân quyền
- API RESTful với tài liệu tự động
- Hỗ trợ PostgreSQL

## Cấu trúc dự án

```
Web/backend/
├── app/
│   ├── core/                 # Cấu hình cốt lõi
│   │   ├── config.py        # Cấu hình ứng dụng
│   │   ├── database.py      # Cấu hình database
│   │   ├── auth.py          # Xác thực JWT
│   │   └── enums.py         # Enum definitions
│   ├── models/              # Database models
│   │   └── models.py        # SQLAlchemy models
│   ├── crud/                # Database operations
│   │   ├── user_crud.py     # User CRUD operations
│   │   ├── emotion_crud.py  # Emotion CRUD operations
│   │   ├── session_crud.py  # Session CRUD operations
│   │   └── __init__.py      # CRUD exports
│   ├── services/            # Business logic
│   │   ├── emotion_service.py  # Emotion analysis service
│   │   ├── user_service.py     # User management service
│   │   ├── session_service.py  # Session management service
│   │   ├── stats_service.py    # Statistics service
│   │   ├── admin_service.py    # Admin service
│   │   └── __init__.py         # Service exports
│   ├── routers/             # API endpoints
│   │   ├── auth_router.py      # Authentication endpoints
│   │   ├── emotion_router.py   # Emotion analysis endpoints
│   │   ├── session_router.py   # Session management endpoints
│   │   ├── stats_router.py     # Statistics endpoints
│   │   ├── admin_router.py     # Admin endpoints
│   │   └── __init__.py         # Router exports
│   └── seed/                # Database seeding
│       └── seed_data.py     # Seed data script
├── models/                  # ML model files
│   ├── facial_expression_model_structure.json
│   ├── facial_expression_model_weights.h5
│   └── haarcascade_frontalface_default.xml
├── migrations/              # Database migrations
├── scripts/                 # Utility scripts
├── main.py                  # FastAPI application
├── requirements.txt         # Python dependencies
├── alembic.ini             # Alembic configuration
└── README.md               # This file
```

## Yêu cầu hệ thống

- Python 3.8+
- PostgreSQL 12+
- 4GB RAM (tối thiểu)
- 2GB disk space

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/KayStar-ABSA/FER-CNN-LSTM.git
cd FER-CNN-LSTM/Web/backend
```

### 2. Tạo virtual environment

```bash
python -m venv venv

source venv/bin/activate  # Linux/Mac
# hoặc
source venv/Scripts/activate     # Windows
```

### 3. Cài đặt dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Cấu hình database

Tạo file `.env` trong thư mục backend:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/fer_cnn_lstm

# Security
SECRET_KEY=your-secret-key-here

# Model paths (tùy chọn)
MODEL_STRUCTURE_PATH=models/facial_expression_model_structure.json
MODEL_WEIGHTS_PATH=models/facial_expression_model_weights.h5
CASCADE_PATH=models/haarcascade_frontalface_default.xml
```

### 5. Tạo database PostgreSQL

```sql
CREATE DATABASE fer_cnn_lstm;
CREATE USER fer_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fer_cnn_lstm TO fer_user;
```

### 6. Chạy migrations

```bash
# Khởi tạo Alembic
alembic init migrations

# Tạo migration
mkdir -p migrations/versions
alembic revision --autogenerate -m "Initial migration"

# Chạy migration
alembic upgrade head
```

### 7. Tạo admin user

```bash
python -m app.seed.seed_data

alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Chạy ứng dụng

### Development mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Sau khi chạy ứng dụng, truy cập:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Endpoints chính

### Authentication
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký
- `GET /api/v1/auth/me` - Thông tin user hiện tại
- `POST /api/v1/auth/change-password` - Đổi mật khẩu

### Emotion Analysis
- `POST /api/v1/emotion/analyze` - Phân tích cảm xúc từ ảnh
- `GET /api/v1/emotion/stats` - Thống kê cảm xúc
- `GET /api/v1/emotion/history` - Lịch sử phân tích
- `GET /api/v1/emotion/performance` - Thống kê hiệu suất

### Sessions
- `POST /api/v1/sessions/start` - Bắt đầu phiên phân tích
- `POST /api/v1/sessions/{id}/update-stats` - Cập nhật thống kê phiên
- `GET /api/v1/sessions/my-sessions` - Danh sách phiên của user
- `POST /api/v1/sessions/end` - Kết thúc phiên hiện tại

### Statistics
- `GET /api/v1/stats/emotion` - Thống kê cảm xúc chi tiết
- `GET /api/v1/stats/performance` - Thống kê hiệu suất
- `GET /api/v1/stats/comparison` - So sánh thống kê
- `GET /api/v1/stats/export` - Xuất thống kê

### Admin (yêu cầu quyền admin)
- `GET /api/v1/admin/overview` - Tổng quan hệ thống
- `GET /api/v1/admin/users` - Quản lý users
- `PUT /api/v1/admin/users/{id}/admin` - Cập nhật vai trò admin
- `DELETE /api/v1/admin/users/{id}` - Xóa user
- `GET /api/v1/admin/statistics` - Thống kê hệ thống

## Database Migrations

### Tạo migration mới

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Chạy migrations

```bash
alembic upgrade head
```

### Rollback migration

```bash
alembic downgrade -1
```

## Seed Data

Tạo dữ liệu mẫu:

```bash
python -m app.seed.seed_data
```

Admin user mặc định:
- Username: `admin`
- Password: `123456`

## Deployment

### Docker

Tạo `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```env
# Production
DATABASE_URL=postgresql://user:pass@db:5432/fer_cnn_lstm
SECRET_KEY=your-production-secret-key
LOG_LEVEL=WARNING
```

## Troubleshooting

### Lỗi database connection

```bash
# Kiểm tra PostgreSQL service
sudo systemctl status postgresql

# Kiểm tra connection
psql -h localhost -U username -d fer_cnn_lstm
```

### Lỗi model loading

```bash
# Kiểm tra model files
ls -la models/

# Kiểm tra permissions
chmod 644 models/*
```

### Lỗi dependencies

```bash
# Cập nhật pip
pip install --upgrade pip

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License - xem file LICENSE để biết thêm chi tiết.

## Liên hệ

- **Tác giả**: Phạm Tấn Thuận
- **Email**: [your-email@example.com]
- **GitHub**: [@KayStar645](https://github.com/KayStar645)
- **Tổ chức**: [@KayStar-ABSA](https://github.com/KayStar-ABSA) 