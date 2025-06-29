from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import SessionStatus
from datetime import datetime

class User(Base):
    """Model người dùng"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, comment="ID người dùng")
    username = Column(String(50), unique=True, index=True, nullable=False, comment="Tên đăng nhập")
    password_hash = Column(String(255), nullable=False, comment="Mật khẩu đã mã hóa")
    is_admin = Column(Boolean, default=False, comment="Có phải admin không")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="Thời gian tạo")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="Thời gian cập nhật")
    
    # Relationships
    emotion_results = relationship("EmotionResult", back_populates="user", cascade="all, delete-orphan")
    analysis_sessions = relationship("AnalysisSession", back_populates="user", cascade="all, delete-orphan")
    system_logs = relationship("SystemLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', is_admin={self.is_admin})>"

class EmotionResult(Base):
    """Model kết quả phân tích cảm xúc"""
    __tablename__ = "emotion_results"
    
    id = Column(Integer, primary_key=True, index=True, comment="ID kết quả")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="ID người dùng")
    emotion = Column(String(20), nullable=False, comment="Cảm xúc chính")
    score = Column(Float, comment="Điểm số cảm xúc")
    faces_detected = Column(Integer, default=0, comment="Số khuôn mặt phát hiện được")
    dominant_emotion = Column(String(20), comment="Cảm xúc chiếm ưu thế")
    dominant_emotion_vn = Column(String(50), comment="Cảm xúc chiếm ưu thế (tiếng Việt)")
    dominant_emotion_score = Column(Float, comment="Điểm số cảm xúc chiếm ưu thế")
    engagement = Column(String(20), comment="Mức độ tương tác")
    emotions_scores = Column(JSON, comment="Điểm số tất cả cảm xúc")
    emotions_scores_vn = Column(JSON, comment="Điểm số tất cả cảm xúc (tiếng Việt)")
    image_quality = Column(Float, comment="Chất lượng ảnh")
    face_position = Column(JSON, comment="Vị trí khuôn mặt")
    analysis_duration = Column(Float, comment="Thời gian phân tích")
    confidence_level = Column(Float, comment="Mức độ tin cậy")
    processing_time = Column(Float, comment="Thời gian xử lý")
    avg_fps = Column(Float, comment="FPS trung bình")
    image_size = Column(String(20), comment="Kích thước ảnh")
    cache_hits = Column(Integer, default=0, comment="Số lần cache hit")
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), comment="Thời gian tạo")
    
    # Relationships
    user = relationship("User", back_populates="emotion_results")
    
    def __repr__(self):
        return f"<EmotionResult(id={self.id}, user_id={self.user_id}, emotion='{self.emotion}', score={self.score})>"

class AnalysisSession(Base):
    """Model phiên phân tích"""
    __tablename__ = "analysis_sessions"
    
    id = Column(Integer, primary_key=True, index=True, comment="ID phiên phân tích")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="ID người dùng")
    session_start = Column(DateTime(timezone=True), server_default=func.now(), comment="Thời gian bắt đầu")
    session_end = Column(DateTime(timezone=True), nullable=True, comment="Thời gian kết thúc")
    status = Column(String(20), default=SessionStatus.ACTIVE.value, comment="Trạng thái phiên")
    camera_resolution = Column(String(20), comment="Độ phân giải camera")
    analysis_interval = Column(Float, comment="Khoảng thời gian phân tích")
    total_analyses = Column(Integer, default=0, comment="Tổng số lần phân tích")
    successful_detections = Column(Integer, default=0, comment="Số lần phát hiện thành công")
    failed_detections = Column(Integer, default=0, comment="Số lần phát hiện thất bại")
    detection_rate = Column(Float, default=0.0, comment="Tỷ lệ phát hiện")
    emotions_summary = Column(JSON, comment="Tổng hợp cảm xúc")
    average_engagement = Column(Float, default=0.0, comment="Mức độ tương tác trung bình")
    avg_processing_time = Column(Float, default=0.0, comment="Thời gian xử lý trung bình")
    avg_fps = Column(Float, default=0.0, comment="FPS trung bình")
    total_cache_hits = Column(Integer, default=0, comment="Tổng số cache hits")
    cache_hit_rate = Column(Float, default=0.0, comment="Tỷ lệ cache hit")
    
    # Relationships
    user = relationship("User", back_populates="analysis_sessions")
    
    def __repr__(self):
        return f"<AnalysisSession(id={self.id}, user_id={self.user_id}, status='{self.status}')>"

class SystemLog(Base):
    """Model log hệ thống"""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True, comment="ID log")
    level = Column(String(20), nullable=False, comment="Mức độ log")
    message = Column(Text, nullable=False, comment="Nội dung log")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="ID người dùng (nếu có)")
    ip_address = Column(String(45), comment="Địa chỉ IP")
    user_agent = Column(Text, comment="User agent")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="Thời gian tạo")
    
    # Relationships
    user = relationship("User", back_populates="system_logs")
    
    def __repr__(self):
        return f"<SystemLog(id={self.id}, level='{self.level}', message='{self.message[:50]}...')>" 