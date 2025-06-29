from sqlalchemy.orm import Session
import models
import auth
from datetime import datetime, timedelta
from sqlalchemy import func, case
import json

def create_user(db: Session, username: str, password: str, is_admin: bool = False):
    hashed_password = auth.get_password_hash(password)
    db_user = models.User(username=username, password_hash=hashed_password, is_admin=is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_emotion_result(db: Session, user_id: int, emotion: str, score: float = None, 
                         faces_detected: int = 0, dominant_emotion: str = None, 
                         dominant_emotion_vn: str = None, dominant_emotion_score: float = None,
                         engagement: str = None, emotions_scores: dict = None, 
                         emotions_scores_vn: dict = None, image_quality: float = None,
                         face_position: dict = None, analysis_duration: float = None,
                         confidence_level: float = None):
    """Tạo kết quả phân tích cảm xúc với thông tin chi tiết"""
    db_result = models.EmotionResult(
        user_id=user_id,
        emotion=emotion,
        score=score,
        faces_detected=faces_detected,
        dominant_emotion=dominant_emotion,
        dominant_emotion_vn=dominant_emotion_vn,
        dominant_emotion_score=dominant_emotion_score,
        engagement=engagement,
        emotions_scores=emotions_scores,
        emotions_scores_vn=emotions_scores_vn,
        image_quality=image_quality,
        face_position=face_position,
        analysis_duration=analysis_duration,
        confidence_level=confidence_level
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def create_analysis_session(db: Session, user_id: int, camera_resolution: str = None, 
                           analysis_interval: float = None):
    """Tạo phiên phân tích mới"""
    db_session = models.AnalysisSession(
        user_id=user_id,
        camera_resolution=camera_resolution,
        analysis_interval=analysis_interval
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def update_analysis_session(db: Session, session_id: int, total_analyses: int = None,
                           successful_detections: int = None, failed_detections: int = None,
                           detection_rate: float = None, emotions_summary: dict = None,
                           average_engagement: float = None, session_end: datetime = None):
    """Cập nhật thống kê phiên phân tích"""
    db_session = db.query(models.AnalysisSession).filter(models.AnalysisSession.id == session_id).first()
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
        
        db.commit()
        db.refresh(db_session)
    return db_session

def get_emotion_stats(db: Session, user_id: int, period: str = 'day'):
    """Lấy thống kê cảm xúc theo thời gian"""
    now = datetime.utcnow()
    if period == 'day':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = None
    
    q = db.query(models.EmotionResult.dominant_emotion, func.count(models.EmotionResult.id)).filter(
        models.EmotionResult.user_id == user_id,
        models.EmotionResult.faces_detected > 0  # Chỉ tính những lần phát hiện thành công
    )
    if start:
        q = q.filter(models.EmotionResult.timestamp >= start)
    q = q.group_by(models.EmotionResult.dominant_emotion)
    return dict(q.all())

def get_detection_stats(db: Session, user_id: int, period: str = 'day'):
    """Lấy thống kê tỷ lệ phát hiện khuôn mặt"""
    now = datetime.utcnow()
    if period == 'day':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = None
    
    # Sử dụng cách đơn giản hơn để tránh lỗi case
    q = db.query(
        func.count(models.EmotionResult.id).label('total'),
        func.avg(models.EmotionResult.image_quality).label('avg_quality')
    ).filter(models.EmotionResult.user_id == user_id)
    
    if start:
        q = q.filter(models.EmotionResult.timestamp >= start)
    
    result = q.first()
    
    # Tính riêng successful detections
    successful_q = db.query(func.count(models.EmotionResult.id)).filter(
        models.EmotionResult.user_id == user_id,
        models.EmotionResult.faces_detected > 0
    )
    if start:
        successful_q = successful_q.filter(models.EmotionResult.timestamp >= start)
    
    successful_count = successful_q.scalar() or 0
    
    if result and result.total > 0:
        return {
            'total_analyses': result.total,
            'successful_detections': successful_count,
            'failed_detections': result.total - successful_count,
            'detection_rate': (successful_count / result.total) * 100 if result.total else 0,
            'average_image_quality': result.avg_quality or 0
        }
    return {
        'total_analyses': 0,
        'successful_detections': 0,
        'failed_detections': 0,
        'detection_rate': 0,
        'average_image_quality': 0
    }

def get_engagement_stats(db: Session, user_id: int, period: str = 'day'):
    """Lấy thống kê mức độ tương tác"""
    now = datetime.utcnow()
    if period == 'day':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = None
    
    q = db.query(
        func.avg(models.EmotionResult.dominant_emotion_score).label('avg_score'),
        func.count(models.EmotionResult.id).label('total_emotions')
    ).filter(
        models.EmotionResult.user_id == user_id,
        models.EmotionResult.faces_detected > 0,
        models.EmotionResult.dominant_emotion_score.isnot(None)
    )
    
    if start:
        q = q.filter(models.EmotionResult.timestamp >= start)
    
    result = q.first()
    return {
        'average_emotion_score': result.avg_score or 0,
        'total_emotions_analyzed': result.total_emotions or 0
    }

def get_all_users(db: Session):
    return db.query(models.User).all()

def get_all_emotion_stats(db: Session, period: str = 'day'):
    """Lấy thống kê tổng hợp cho admin"""
    now = datetime.utcnow()
    if period == 'day':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = None
    
    q = db.query(models.EmotionResult.dominant_emotion, func.count(models.EmotionResult.id)).filter(
        models.EmotionResult.faces_detected > 0
    )
    if start:
        q = q.filter(models.EmotionResult.timestamp >= start)
    q = q.group_by(models.EmotionResult.dominant_emotion)
    return dict(q.all())

def get_user_sessions(db: Session, user_id: int, limit: int = 10):
    """Lấy danh sách phiên phân tích của user"""
    return db.query(models.AnalysisSession).filter(
        models.AnalysisSession.user_id == user_id
    ).order_by(models.AnalysisSession.session_start.desc()).limit(limit).all()

def get_session_stats(db: Session, session_id: int):
    """Lấy thống kê hiện tại của session"""
    session = db.query(models.AnalysisSession).filter(models.AnalysisSession.id == session_id).first()
    if session:
        return {
            'total_analyses': session.total_analyses or 0,
            'successful_detections': session.successful_detections or 0,
            'failed_detections': session.failed_detections or 0,
            'detection_rate': session.detection_rate or 0
        }
    return None

def get_session_emotions_summary(db: Session, session_id: int):
    """Lấy tổng hợp cảm xúc của session"""
    # Lấy tất cả emotion results của session này (dựa trên thời gian)
    session = db.query(models.AnalysisSession).filter(models.AnalysisSession.id == session_id).first()
    if not session:
        return {}
    
    # Lấy các emotion results trong khoảng thời gian của session
    results = db.query(models.EmotionResult).filter(
        models.EmotionResult.user_id == session.user_id,
        models.EmotionResult.timestamp >= session.session_start,
        models.EmotionResult.timestamp <= (session.session_end or datetime.utcnow()),
        models.EmotionResult.faces_detected > 0
    ).all()
    
    # Tổng hợp cảm xúc
    emotions_summary = {}
    for result in results:
        emotion = result.dominant_emotion
        if emotion:
            emotions_summary[emotion] = emotions_summary.get(emotion, 0) + 1
    
    return emotions_summary

def get_session_average_engagement(db: Session, session_id: int):
    """Lấy độ tương tác trung bình của session"""
    session = db.query(models.AnalysisSession).filter(models.AnalysisSession.id == session_id).first()
    if not session:
        return 0
    
    # Lấy các emotion results trong khoảng thời gian của session
    result = db.query(func.avg(models.EmotionResult.dominant_emotion_score)).filter(
        models.EmotionResult.user_id == session.user_id,
        models.EmotionResult.timestamp >= session.session_start,
        models.EmotionResult.timestamp <= (session.session_end or datetime.utcnow()),
        models.EmotionResult.faces_detected > 0,
        models.EmotionResult.dominant_emotion_score.isnot(None)
    ).scalar()
    
    return result or 0 