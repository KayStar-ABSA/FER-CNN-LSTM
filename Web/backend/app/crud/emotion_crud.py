from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.models import EmotionResult, AnalysisSession

def create_emotion_result(db: Session, user_id: int, emotion: str, score: float = None, 
                         faces_detected: int = 0, dominant_emotion: str = None, 
                         dominant_emotion_vn: str = None, dominant_emotion_score: float = None,
                         engagement: str = None, emotions_scores: dict = None, 
                         emotions_scores_vn: dict = None, image_quality: float = None,
                         face_position: dict = None, analysis_duration: float = None,
                         confidence_level: float = None,
                         processing_time: float = None, avg_fps: float = None, image_size: str = None, cache_hits: int = None):
    """Tạo kết quả phân tích cảm xúc với thông tin chi tiết"""
    db_result = EmotionResult(
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
        confidence_level=confidence_level,
        processing_time=processing_time,
        avg_fps=avg_fps,
        image_size=image_size,
        cache_hits=cache_hits
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def update_emotion_result(db: Session, result_id: int, **kwargs):
    """Cập nhật emotion result"""
    db_result = db.query(EmotionResult).filter(EmotionResult.id == result_id).first()
    if db_result:
        for key, value in kwargs.items():
            if hasattr(db_result, key):
                setattr(db_result, key, value)
        db.commit()
        db.refresh(db_result)
    return db_result

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
    
    q = db.query(EmotionResult.emotion, func.count(EmotionResult.id)).filter(
        EmotionResult.user_id == user_id,
        EmotionResult.faces_detected > 0,
        EmotionResult.emotion != 'no_face_detected'  # Loại trừ những lần không phát hiện khuôn mặt
    )
    if start:
        q = q.filter(EmotionResult.timestamp >= start)
    q = q.group_by(EmotionResult.emotion)
    return dict(q.all())

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
    
    q = db.query(EmotionResult.emotion, func.count(EmotionResult.id)).filter(
        EmotionResult.faces_detected > 0,
        EmotionResult.emotion != 'no_face_detected'  # Loại trừ những lần không phát hiện khuôn mặt
    )
    if start:
        q = q.filter(EmotionResult.timestamp >= start)
    q = q.group_by(EmotionResult.emotion)
    return dict(q.all())

def get_emotion_history(db: Session, user_id: int, limit: int = 100):
    """Lấy lịch sử phân tích cảm xúc"""
    results = db.query(EmotionResult).filter(
        EmotionResult.user_id == user_id,
        EmotionResult.faces_detected > 0,
        EmotionResult.emotion != 'no_face_detected'  # Loại trừ những lần không phát hiện khuôn mặt
    ).order_by(EmotionResult.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": result.id,
            "emotion": result.emotion,
            "score": result.score,
            "timestamp": result.timestamp,
            "image_quality": result.image_quality,
            "processing_time": result.processing_time
        }
        for result in results
    ]

def get_real_performance_stats(db: Session, user_id: int, period: str = 'day'):
    """Lấy thống kê hiệu suất thực từ database"""
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
    
    # Lấy thống kê từ EmotionResult
    emotion_query = db.query(EmotionResult).filter(EmotionResult.user_id == user_id)
    if start:
        emotion_query = emotion_query.filter(EmotionResult.timestamp >= start)
    
    emotion_results = emotion_query.all()
    
    # Lấy thống kê từ AnalysisSession
    session_query = db.query(AnalysisSession).filter(AnalysisSession.user_id == user_id)
    if start:
        session_query = session_query.filter(AnalysisSession.session_start >= start)
    
    sessions = session_query.all()
    
    # Tính toán thống kê thực
    total_analyses = len(emotion_results)
    successful_detections = len([r for r in emotion_results if r.faces_detected > 0])
    failed_detections = total_analyses - successful_detections
    detection_rate = (successful_detections / total_analyses * 100) if total_analyses > 0 else 0
    
    # Tính chất lượng ảnh trung bình (chỉ từ những lần thành công)
    successful_results = [r for r in emotion_results if r.faces_detected > 0]
    image_qualities = [r.image_quality for r in successful_results if r.image_quality is not None]
    average_image_quality = (sum(image_qualities) / len(image_qualities) * 100) if image_qualities else 0
    
    # Tính độ tương tác trung bình (chỉ từ những lần thành công)
    scores = [r.score for r in successful_results if r.score is not None and r.score > 0]
    average_emotion_score = (sum(scores) / len(scores) * 100) if scores else 0
    
    # Tính FPS trung bình từ sessions
    fps_values = [s.avg_fps for s in sessions if s.avg_fps is not None]
    average_fps = sum(fps_values) / len(fps_values) if fps_values else 0
    
    # Tính thời gian xử lý trung bình (từ tất cả các lần phân tích)
    processing_times = [r.processing_time for r in emotion_results if r.processing_time is not None]
    average_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
    
    return {
        'total_analyses': total_analyses,
        'successful_detections': successful_detections,
        'failed_detections': failed_detections,
        'detection_rate': detection_rate,
        'average_image_quality': average_image_quality,
        'average_emotion_score': average_emotion_score,
        'average_fps': average_fps,
        'average_processing_time': average_processing_time,
        'total_sessions': len(sessions)
    } 