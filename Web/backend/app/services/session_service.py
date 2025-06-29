from sqlalchemy.orm import Session
from app.crud.session_crud import create_session, update_session, get_user_sessions, get_session_by_id, get_active_session_by_user_id, end_session
from app.services.system_log_service import SystemLogService
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

class SessionService:
    """Service quản lý phiên phân tích"""
    
    @staticmethod
    def create_session(db: Session, user_id: int, camera_resolution: str = None, 
                      analysis_interval: float = None) -> Dict[str, Any]:
        """Tạo phiên phân tích mới"""
        try:
            # Kiểm tra xem user có phiên đang hoạt động không
            active_session = get_active_session_by_user_id(db, user_id)
            if active_session:
                return {
                    'success': False,
                    'error': 'User đã có phiên phân tích đang hoạt động'
                }
            
            # Tạo phiên mới
            session = create_session(db, user_id, camera_resolution, analysis_interval)
            
            # Log việc tạo session
            SystemLogService.log_session_start(db, user_id, session.id, camera_resolution or "unknown")
            
            return {
                'success': True,
                'session': {
                    'id': session.id,
                    'user_id': session.user_id,
                    'session_start': session.session_start.isoformat(),
                    'camera_resolution': session.camera_resolution,
                    'analysis_interval': session.analysis_interval
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi tạo phiên phân tích: {str(e)}'
            }
    
    @staticmethod
    def update_session_stats(db: Session, session_id: int, **stats) -> Dict[str, Any]:
        """Cập nhật thống kê phiên phân tích"""
        try:
            session = update_session(db, session_id, **stats)
            if not session:
                return {
                    'success': False,
                    'error': 'Phiên phân tích không tồn tại'
                }
            
            return {
                'success': True,
                'message': 'Cập nhật thống kê thành công'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi cập nhật thống kê: {str(e)}'
            }
    
    @staticmethod
    def get_user_sessions_list(db: Session, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Lấy danh sách phiên phân tích của user"""
        try:
            sessions = get_user_sessions(db, user_id, limit)
            return [
                {
                    'id': session.id,
                    'session_start': session.session_start.isoformat(),
                    'session_end': session.session_end.isoformat() if session.session_end else None,
                    'total_analyses': session.total_analyses or 0,
                    'successful_detections': session.successful_detections or 0,
                    'failed_detections': session.failed_detections or 0,
                    'detection_rate': session.detection_rate or 0,
                    'average_engagement': session.average_engagement or 0,
                    'avg_processing_time': session.avg_processing_time or 0,
                    'avg_fps': session.avg_fps or 0
                }
                for session in sessions
            ]
            
        except Exception:
            return []
    
    @staticmethod
    def get_session_statistics(db: Session, session_id: int) -> Optional[Dict[str, Any]]:
        """Lấy thống kê chi tiết của phiên phân tích"""
        try:
            # Lấy thống kê cơ bản
            basic_stats = get_session_stats(db, session_id)
            if not basic_stats:
                return None
            
            # Lấy tổng hợp cảm xúc
            emotions_summary = get_session_emotions_summary(db, session_id)
            
            # Lấy độ tương tác trung bình
            avg_engagement = get_session_average_engagement(db, session_id)
            
            return {
                **basic_stats,
                'emotions_summary': emotions_summary,
                'average_engagement': avg_engagement
            }
            
        except Exception:
            return None
    
    @staticmethod
    def end_user_session(db: Session, user_id: int) -> Dict[str, Any]:
        """Kết thúc phiên phân tích của user"""
        try:
            active_session = get_active_session_by_user_id(db, user_id)
            if not active_session:
                return {
                    'success': False,
                    'error': 'Không có phiên phân tích đang hoạt động'
                }
            
            success = end_session(db, active_session.id)
            if not success:
                return {
                    'success': False,
                    'error': 'Lỗi kết thúc phiên phân tích'
                }
            
            session_duration = (datetime.now(timezone.utc) - active_session.session_start).total_seconds()
            
            # Log việc kết thúc session
            SystemLogService.log_session_end(db, user_id, active_session.id, 
                                            session_duration, active_session.total_analyses or 0)
            
            return {
                'success': True,
                'message': 'Kết thúc phiên phân tích thành công',
                'session_duration': session_duration
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi kết thúc phiên phân tích: {str(e)}'
            }
    
    @staticmethod
    def get_active_session_info(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
        """Lấy thông tin phiên phân tích đang hoạt động"""
        try:
            session = get_active_session_by_user_id(db, user_id)
            if not session:
                return None
            
            return {
                'id': session.id,
                'session_start': session.session_start.isoformat(),
                'camera_resolution': session.camera_resolution,
                'analysis_interval': session.analysis_interval,
                'total_analyses': session.total_analyses or 0,
                'successful_detections': session.successful_detections or 0,
                'failed_detections': session.failed_detections or 0,
                'detection_rate': session.detection_rate or 0
            }
            
        except Exception:
            return None 