from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.models import AnalysisSession, EmotionResult

def create_session(db: Session, user_id: int, camera_resolution: str = None, 
                   analysis_interval: float = None):
    """Tạo phiên phân tích mới"""
    db_session = AnalysisSession(
        user_id=user_id,
        camera_resolution=camera_resolution,
        analysis_interval=analysis_interval
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def update_session(db: Session, session_id: int, total_analyses: int = None,
                   successful_detections: int = None, failed_detections: int = None,
                   detection_rate: float = None, emotions_summary: dict = None,
                   average_engagement: float = None, session_end: datetime = None,
                   avg_processing_time: float = None, avg_fps: float = None,
                   total_cache_hits: int = None, cache_hit_rate: float = None):
    """Cập nhật thống kê phiên phân tích"""
    db_session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if db_session:
        if total_analyses is not None:
            db_session.total_analyses = total_analyses
        if successful_detections is not None:
            db_session.successful_detections = successful_detections
        if failed_detections is not None:
            db_session.failed_detections = failed_detections
        if detection_rate is not None:
            db_session.detection_rate = detection_rate
        if emotions_summary is not None:
            db_session.emotions_summary = emotions_summary
        if average_engagement is not None:
            db_session.average_engagement = average_engagement
        if session_end is not None:
            db_session.session_end = session_end
        if avg_processing_time is not None:
            db_session.avg_processing_time = avg_processing_time
        if avg_fps is not None:
            db_session.avg_fps = avg_fps
        if total_cache_hits is not None:
            db_session.total_cache_hits = total_cache_hits
        if cache_hit_rate is not None:
            db_session.cache_hit_rate = cache_hit_rate
        
        db.commit()
        db.refresh(db_session)
    return db_session

def get_user_sessions(db: Session, user_id: int, limit: int = 10):
    """Lấy danh sách phiên phân tích của user"""
    return db.query(AnalysisSession).filter(
        AnalysisSession.user_id == user_id
    ).order_by(AnalysisSession.session_start.desc()).limit(limit).all()

def get_session_by_id(db: Session, session_id: int):
    """Lấy phiên phân tích theo id"""
    return db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()

def get_active_session_by_user_id(db: Session, user_id: int):
    """Lấy phiên phân tích đang hoạt động của user"""
    return db.query(AnalysisSession).filter(
        AnalysisSession.user_id == user_id,
        AnalysisSession.session_end == None
    ).first()

def end_session(db: Session, session_id: int):
    """Kết thúc phiên phân tích"""
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if session:
        session.session_end = datetime.utcnow()
        db.commit()
        return True
    return False 