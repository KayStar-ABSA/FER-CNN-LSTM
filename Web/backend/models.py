from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
import database
import datetime

class User(database.Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    emotion_results = relationship("EmotionResult", back_populates="user")

class EmotionResult(database.Base):
    __tablename__ = "emotion_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    emotion = Column(String, nullable=False)
    score = Column(Float, nullable=True)
    
    # Thông tin chi tiết về phân tích
    faces_detected = Column(Integer, default=0)
    dominant_emotion = Column(String, nullable=True)
    dominant_emotion_vn = Column(String, nullable=True)
    dominant_emotion_score = Column(Float, nullable=True)
    engagement = Column(String, nullable=True)
    
    # Lưu tất cả emotions scores
    emotions_scores = Column(JSON, nullable=True)  # {"happy": 0.8, "sad": 0.1, ...}
    emotions_scores_vn = Column(JSON, nullable=True)  # {"vui": 0.8, "buồn": 0.1, ...}
    
    # Thông tin về ảnh
    image_quality = Column(Float, nullable=True)  # Chất lượng ảnh (0-1)
    face_position = Column(JSON, nullable=True)  # {"x": 100, "y": 100, "width": 200, "height": 200}
    
    # Metadata
    analysis_duration = Column(Float, nullable=True)  # Thời gian phân tích (ms)
    confidence_level = Column(Float, nullable=True)  # Độ tin cậy tổng thể
    
    user = relationship("User", back_populates="emotion_results")

class AnalysisSession(database.Base):
    __tablename__ = "analysis_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_start = Column(DateTime, default=datetime.datetime.utcnow)
    session_end = Column(DateTime, nullable=True)
    
    # Thống kê phiên
    total_analyses = Column(Integer, default=0)
    successful_detections = Column(Integer, default=0)
    failed_detections = Column(Integer, default=0)
    detection_rate = Column(Float, default=0.0)
    
    # Thống kê cảm xúc trong phiên
    emotions_summary = Column(JSON, nullable=True)  # {"happy": 10, "sad": 5, ...}
    average_engagement = Column(Float, nullable=True)
    
    # Thông tin kỹ thuật
    camera_resolution = Column(String, nullable=True)  # "1280x720"
    analysis_interval = Column(Float, nullable=True)  # Khoảng thời gian giữa các phân tích (giây)
    
    user = relationship("User") 