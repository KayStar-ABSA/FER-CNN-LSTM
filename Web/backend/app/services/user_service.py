from sqlalchemy.orm import Session
from app.crud.user_crud import (
    create_user, get_user_by_username, get_user_by_id, 
    get_all_users, update_user_password, update_user_admin_status, delete_user
)
from app.core.auth import get_password_hash, verify_password
from typing import List, Optional, Dict, Any

class UserService:
    """Service quản lý user"""
    
    @staticmethod
    def create_user(db: Session, username: str, password: str, is_admin: bool = False) -> Dict[str, Any]:
        """Tạo user mới"""
        try:
            # Kiểm tra username đã tồn tại
            existing_user = get_user_by_username(db, username)
            if existing_user:
                return {
                    'success': False,
                    'error': 'Username đã tồn tại'
                }
            
            # Tạo user
            user = create_user(db, username, password, is_admin)
            
            return {
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'created_at': user.created_at.isoformat()
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi tạo user: {str(e)}'
            }
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Xác thực user"""
        try:
            user = get_user_by_username(db, username)
            if not user:
                return None
            
            if not verify_password(password, user.password_hash):
                return None
            
            return {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin
            }
            
        except Exception:
            return None
    
    @staticmethod
    def get_user_info(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
        """Lấy thông tin user"""
        try:
            user = get_user_by_id(db, user_id)
            if not user:
                return None
            
            return {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat()
            }
            
        except Exception:
            return None
    
    @staticmethod
    def get_all_users_info(db: Session) -> List[Dict[str, Any]]:
        """Lấy thông tin tất cả users"""
        try:
            users = get_all_users(db)
            return [
                {
                    'id': user.id,
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'created_at': user.created_at.isoformat()
                }
                for user in users
            ]
            
        except Exception:
            return []
    
    @staticmethod
    def update_user_password(db: Session, user_id: int, new_password: str) -> Dict[str, Any]:
        """Cập nhật mật khẩu user"""
        try:
            user = update_user_password(db, user_id, new_password)
            if not user:
                return {
                    'success': False,
                    'error': 'User không tồn tại'
                }
            
            return {
                'success': True,
                'message': 'Cập nhật mật khẩu thành công'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi cập nhật mật khẩu: {str(e)}'
            }
    
    @staticmethod
    def update_user_admin_status(db: Session, user_id: int, is_admin: bool) -> Dict[str, Any]:
        """Cập nhật trạng thái admin của user"""
        try:
            user = update_user_admin_status(db, user_id, is_admin)
            if not user:
                return {
                    'success': False,
                    'error': 'User không tồn tại'
                }
            
            return {
                'success': True,
                'message': f'Cập nhật trạng thái admin thành công: {is_admin}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi cập nhật trạng thái admin: {str(e)}'
            }
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> Dict[str, Any]:
        """Xóa user"""
        try:
            success = delete_user(db, user_id)
            if not success:
                return {
                    'success': False,
                    'error': 'User không tồn tại'
                }
            
            return {
                'success': True,
                'message': 'Xóa user thành công'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi xóa user: {str(e)}'
            } 