import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth_router, emotion_router, session_router, stats_router, admin_router
import logging
from datetime import datetime

# Cấu hình logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Tạo database tables
Base.metadata.create_all(bind=engine)

# Tạo FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(emotion_router, prefix=settings.API_V1_STR)
app.include_router(session_router, prefix=settings.API_V1_STR)
app.include_router(stats_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FER CNN-LSTM API",
        "version": settings.VERSION,
        "docs": "/docs",
        "author": "Phạm Tấn Thuận",
        "github": "https://github.com/KayStar645"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "FER CNN-LSTM API",
        "version": settings.VERSION
    }

@app.get("/info")
def get_system_info():
    """Lấy thông tin hệ thống"""
    return {
        "app_name": "FER-CNN-LSTM",
        "version": "1.0.0",
        "environment": "development" if settings.DEBUG else "production",
        "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "sqlite",
        "supported_image_formats": settings.SUPPORTED_IMAGE_FORMATS,
        "max_image_size_mb": settings.MAX_IMAGE_SIZE // (1024 * 1024)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 