from sqlalchemy.orm import Session
from app.models.models import SystemLog
from typing import Optional
from datetime import datetime

class SystemLogService:
    """Service quản lý log hệ thống"""
    
    @staticmethod
    def create_log(db: Session, level: str, message: str, user_id: Optional[int] = None, 
                   ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> SystemLog:
        """Tạo log mới"""
        log = SystemLog(
            level=level,
            message=message,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    
    @staticmethod
    def log_info(db: Session, message: str, user_id: Optional[int] = None, 
                 ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> SystemLog:
        """Tạo log INFO"""
        return SystemLogService.create_log(db, "INFO", message, user_id, ip_address, user_agent)
    
    @staticmethod
    def log_warning(db: Session, message: str, user_id: Optional[int] = None, 
                    ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> SystemLog:
        """Tạo log WARNING"""
        return SystemLogService.create_log(db, "WARNING", message, user_id, ip_address, user_agent)
    
    @staticmethod
    def log_error(db: Session, message: str, user_id: Optional[int] = None, 
                  ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> SystemLog:
        """Tạo log ERROR"""
        return SystemLogService.create_log(db, "ERROR", message, user_id, ip_address, user_agent)
    
    @staticmethod
    def log_emotion_analysis(db: Session, user_id: int, faces_detected: int, 
                            emotion: str, processing_time: float, ip_address: Optional[str] = None) -> SystemLog:
        """Log kết quả phân tích cảm xúc"""
        message = f"User {user_id} - Phân tích cảm xúc: {emotion}, {faces_detected} khuôn mặt, {processing_time}ms"
        return SystemLogService.log_info(db, message, user_id, ip_address)
    
    @staticmethod
    def log_session_start(db: Session, user_id: int, session_id: int, 
                          camera_resolution: str, ip_address: Optional[str] = None) -> SystemLog:
        """Log bắt đầu session"""
        message = f"User {user_id} - Bắt đầu session {session_id}, camera: {camera_resolution}"
        return SystemLogService.log_info(db, message, user_id, ip_address)
    
    @staticmethod
    def log_session_end(db: Session, user_id: int, session_id: int, 
                        duration: float, total_analyses: int, ip_address: Optional[str] = None) -> SystemLog:
        """Log kết thúc session"""
        message = f"User {user_id} - Kết thúc session {session_id}, thời gian: {duration}s, phân tích: {total_analyses}"
        return SystemLogService.log_info(db, message, user_id, ip_address) 