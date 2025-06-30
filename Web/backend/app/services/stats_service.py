from sqlalchemy.orm import Session
from app.crud.emotion_crud import (
    get_emotion_stats, get_all_emotion_stats, get_emotion_history, get_real_performance_stats
)
from app.crud.session_crud import get_user_sessions
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class StatsService:
    """Service thống kê và báo cáo"""
    
    @staticmethod
    def get_user_emotion_stats(db: Session, user_id: int, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê cảm xúc của user"""
        try:
            emotion_stats = get_emotion_stats(db, user_id, period)
            
            return {
                'success': True,
                'period': period,
                'emotion_stats': emotion_stats
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê cảm xúc: {str(e)}'
            }
    
    @staticmethod
    def get_user_performance_stats(db: Session, user_id: int, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê hiệu suất của user"""
        try:
            # Sử dụng hàm mới để lấy dữ liệu thực từ database
            real_stats = get_real_performance_stats(db, user_id, period)
            
            return {
                'success': True,
                'period': period,
                'total_analyses': real_stats['total_analyses'],
                'successful_detections': real_stats['successful_detections'],
                'failed_detections': real_stats['failed_detections'],
                'detection_rate': real_stats['detection_rate'],
                'average_image_quality': real_stats['average_image_quality'],
                'average_emotion_score': real_stats['average_emotion_score'],
                'average_fps': real_stats['average_fps'],
                'average_processing_time': real_stats['average_processing_time'],
                'total_sessions': real_stats['total_sessions'],
                # Thêm detection_metrics và engagement_metrics để tương thích với frontend
                'detection_metrics': {
                    'total_analyses': real_stats['total_analyses'],
                    'successful_detections': real_stats['successful_detections'],
                    'failed_detections': real_stats['failed_detections'],
                    'detection_rate': real_stats['detection_rate'],
                    'average_image_quality': real_stats['average_image_quality']
                },
                'engagement_metrics': {
                    'average_emotion_score': real_stats['average_emotion_score'],
                    'total_emotions_analyzed': real_stats['total_analyses']
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê hiệu suất: {str(e)}'
            }
    
    @staticmethod
    def get_face_detection_stats(db: Session, user_id: int, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê chi tiết về phát hiện khuôn mặt"""
        try:
            from app.crud.emotion_crud import get_real_performance_stats
            real_stats = get_real_performance_stats(db, user_id, period)
            
            # Tính thêm các chỉ số
            total_attempts = real_stats['total_analyses']
            successful_detections = real_stats['successful_detections']
            failed_detections = real_stats['failed_detections']
            
            # Tính tỷ lệ thất bại
            failure_rate = (failed_detections / total_attempts * 100) if total_attempts > 0 else 0
            
            # Tính hiệu quả phát hiện
            detection_efficiency = (successful_detections / total_attempts * 100) if total_attempts > 0 else 0
            
            return {
                'success': True,
                'total_attempts': total_attempts,
                'successful_detections': successful_detections,
                'failed_detections': failed_detections,
                'detection_rate': real_stats['detection_rate'],
                'failure_rate': failure_rate,
                'detection_efficiency': detection_efficiency,
                'average_processing_time': real_stats['average_processing_time'],
                'average_image_quality': real_stats['average_image_quality']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê phát hiện khuôn mặt: {str(e)}'
            }
    
    @staticmethod
    def get_emotion_history_data(db: Session, user_id: int, limit: int = 100) -> Dict[str, Any]:
        """Lấy dữ liệu lịch sử cảm xúc"""
        try:
            history = get_emotion_history(db, user_id, limit)
            
            return {
                'success': True,
                'history': history,
                'total_records': len(history)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy lịch sử cảm xúc: {str(e)}'
            }
    
    @staticmethod
    def get_admin_dashboard_stats(db: Session, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê tổng hợp cho admin dashboard"""
        try:
            # Thống kê cảm xúc tổng hợp
            emotion_stats = get_all_emotion_stats(db, period)
            
            # Tính tổng số kết quả phân tích
            total_analyses = sum(emotion_stats.values()) if emotion_stats else 0
            
            # Tính cảm xúc phổ biến nhất
            most_common_emotion = max(emotion_stats.items(), key=lambda x: x[1])[0] if emotion_stats else None
            
            return {
                'success': True,
                'period': period,
                'total_analyses': total_analyses,
                'emotion_distribution': emotion_stats,
                'most_common_emotion': most_common_emotion,
                'emotion_count': len(emotion_stats) if emotion_stats else 0
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê dashboard: {str(e)}'
            }
    
    @staticmethod
    def get_all_users_emotion_stats(db: Session, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê cảm xúc tổng hợp của tất cả users"""
        try:
            emotion_stats = get_all_emotion_stats(db, period)
            
            return {
                'success': True,
                'period': period,
                'emotion_stats': emotion_stats
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê cảm xúc tổng hợp: {str(e)}'
            }
    
    @staticmethod
    def get_all_users_performance_stats(db: Session, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê hiệu suất tổng hợp của tất cả users"""
        try:
            from app.crud.emotion_crud import get_all_users_performance_stats as get_all_perf_stats
            all_stats = get_all_perf_stats(db, period)
            
            return {
                'success': True,
                'period': period,
                'total_analyses': all_stats['total_analyses'],
                'successful_detections': all_stats['successful_detections'],
                'failed_detections': all_stats['failed_detections'],
                'detection_rate': all_stats['detection_rate'],
                'average_image_quality': all_stats['average_image_quality'],
                'average_emotion_score': all_stats['average_emotion_score'],
                'average_fps': all_stats['average_fps'],
                'average_processing_time': all_stats['average_processing_time'],
                'total_sessions': all_stats['total_sessions'],
                'detection_metrics': {
                    'total_analyses': all_stats['total_analyses'],
                    'successful_detections': all_stats['successful_detections'],
                    'failed_detections': all_stats['failed_detections'],
                    'detection_rate': all_stats['detection_rate'],
                    'average_image_quality': all_stats['average_image_quality']
                },
                'engagement_metrics': {
                    'average_emotion_score': all_stats['average_emotion_score'],
                    'total_emotions_analyzed': all_stats['total_analyses']
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê hiệu suất tổng hợp: {str(e)}'
            }
    
    @staticmethod
    def get_all_users_face_detection_stats(db: Session, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê phát hiện khuôn mặt tổng hợp của tất cả users"""
        try:
            from app.crud.emotion_crud import get_all_users_performance_stats as get_all_perf_stats
            all_stats = get_all_perf_stats(db, period)
            
            # Tính thêm các chỉ số
            total_attempts = all_stats['total_analyses']
            successful_detections = all_stats['successful_detections']
            failed_detections = all_stats['failed_detections']
            
            # Tính tỷ lệ thất bại
            failure_rate = (failed_detections / total_attempts * 100) if total_attempts > 0 else 0
            
            # Tính hiệu quả phát hiện
            detection_efficiency = (successful_detections / total_attempts * 100) if total_attempts > 0 else 0
            
            return {
                'success': True,
                'total_attempts': total_attempts,
                'successful_detections': successful_detections,
                'failed_detections': failed_detections,
                'detection_rate': all_stats['detection_rate'],
                'failure_rate': failure_rate,
                'detection_efficiency': detection_efficiency,
                'average_processing_time': all_stats['average_processing_time'],
                'average_image_quality': all_stats['average_image_quality']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê phát hiện khuôn mặt tổng hợp: {str(e)}'
            }
    
    @staticmethod
    def get_all_users_emotion_history_data(db: Session, limit: int = 100) -> Dict[str, Any]:
        """Lấy dữ liệu lịch sử cảm xúc tổng hợp của tất cả users"""
        try:
            from app.crud.emotion_crud import get_all_users_emotion_history
            history = get_all_users_emotion_history(db, limit)
            
            return {
                'success': True,
                'history': history,
                'total_records': len(history)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy lịch sử cảm xúc tổng hợp: {str(e)}'
            } 