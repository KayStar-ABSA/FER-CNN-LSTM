from sqlalchemy.orm import Session
from app.crud.user_crud import get_all_users, update_user_admin_status, delete_user
from app.crud.emotion_crud import get_all_emotion_stats
from app.services.user_service import UserService
from app.services.stats_service import StatsService
from typing import Dict, Any, List

class AdminService:
    """Service quản lý admin"""
    
    @staticmethod
    def get_system_overview(db: Session) -> Dict[str, Any]:
        """Lấy tổng quan hệ thống"""
        try:
            # Lấy thống kê users
            all_users = get_all_users(db)
            total_users = len(all_users)
            admin_users = len([u for u in all_users if u.is_admin])
            regular_users = total_users - admin_users
            
            # Lấy thống kê cảm xúc tổng hợp
            emotion_stats = get_all_emotion_stats(db, 'day')
            total_analyses = sum(emotion_stats.values()) if emotion_stats else 0
            
            return {
                'success': True,
                'system_overview': {
                    'total_users': total_users,
                    'admin_users': admin_users,
                    'regular_users': regular_users,
                    'total_analyses_today': total_analyses,
                    'emotion_distribution': emotion_stats
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy tổng quan hệ thống: {str(e)}'
            }
    
    @staticmethod
    def get_all_users_management(db: Session) -> Dict[str, Any]:
        """Lấy danh sách users để quản lý"""
        try:
            users_info = UserService.get_all_users_info(db)
            
            return {
                'success': True,
                'users': users_info,
                'total_count': len(users_info)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy danh sách users: {str(e)}'
            }
    
    @staticmethod
    def update_user_admin_role(db: Session, user_id: int, is_admin: bool) -> Dict[str, Any]:
        """Cập nhật vai trò admin của user"""
        try:
            result = UserService.update_user_admin_status(db, user_id, is_admin)
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi cập nhật vai trò admin: {str(e)}'
            }
    
    @staticmethod
    def delete_user_account(db: Session, user_id: int) -> Dict[str, Any]:
        """Xóa tài khoản user"""
        try:
            result = UserService.delete_user(db, user_id)
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi xóa tài khoản: {str(e)}'
            }
    
    @staticmethod
    def get_system_statistics(db: Session, period: str = 'day') -> Dict[str, Any]:
        """Lấy thống kê hệ thống"""
        try:
            # Lấy thống kê dashboard
            dashboard_stats = StatsService.get_admin_dashboard_stats(db, period)
            
            if not dashboard_stats['success']:
                return dashboard_stats
            
            # Lấy thống kê users
            users_info = UserService.get_all_users_info(db)
            
            return {
                'success': True,
                'period': period,
                'dashboard_stats': dashboard_stats,
                'user_stats': {
                    'total_users': len(users_info),
                    'admin_users': len([u for u in users_info if u['is_admin']]),
                    'regular_users': len([u for u in users_info if not u['is_admin']])
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy thống kê hệ thống: {str(e)}'
            }
    
    @staticmethod
    def get_user_activity_report(db: Session, user_id: int) -> Dict[str, Any]:
        """Lấy báo cáo hoạt động của user"""
        try:
            # Lấy thống kê cảm xúc
            emotion_stats = StatsService.get_user_emotion_stats(db, user_id, 'month')
            
            # Lấy thống kê hiệu suất
            performance_stats = StatsService.get_user_performance_stats(db, user_id, 'month')
            
            # Lấy lịch sử cảm xúc
            history_data = StatsService.get_emotion_history_data(db, user_id, 50)
            
            return {
                'success': True,
                'user_id': user_id,
                'emotion_stats': emotion_stats,
                'performance_stats': performance_stats,
                'recent_history': history_data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi lấy báo cáo hoạt động: {str(e)}'
            }
    
    @staticmethod
    def get_system_health_check(db: Session) -> Dict[str, Any]:
        """Kiểm tra sức khỏe hệ thống"""
        try:
            # Kiểm tra database connection
            db.execute("SELECT 1")
            
            # Lấy thống kê cơ bản
            total_users = len(get_all_users(db))
            emotion_stats = get_all_emotion_stats(db, 'day')
            total_analyses = sum(emotion_stats.values()) if emotion_stats else 0
            
            return {
                'success': True,
                'system_health': {
                    'database_status': 'healthy',
                    'total_users': total_users,
                    'analyses_today': total_analyses,
                    'timestamp': '2024-01-01T00:00:00Z'
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi kiểm tra sức khỏe hệ thống: {str(e)}',
                'system_health': {
                    'database_status': 'unhealthy',
                    'error': str(e)
                }
            } 