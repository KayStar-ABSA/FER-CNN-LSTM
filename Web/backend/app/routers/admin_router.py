from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.services.admin_service import AdminService
from app.services.user_service import UserService
from app.core.utils import get_json_filters, extract_common_filters
from typing import Dict, Any
from pydantic import BaseModel, Field

class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Tên đăng nhập (3-50 ký tự)")
    password: str = Field(..., min_length=6, max_length=100, description="Mật khẩu (ít nhất 6 ký tự)")
    is_admin: bool = Field(default=False, description="Có phải admin không")

router = APIRouter(prefix="/admin", tags=["Admin"])

def verify_admin(current_user: User = Depends(get_current_user)):
    """Xác thực user có quyền admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền truy cập"
        )
    return current_user

@router.get("/overview")
async def get_system_overview(
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy tổng quan hệ thống"""
    try:
        result = AdminService.get_system_overview(db)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy tổng quan hệ thống: {str(e)}"
        )

@router.get("/users")
async def get_all_users(
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy danh sách tất cả users"""
    try:
        result = AdminService.get_all_users_management(db)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách users: {str(e)}"
        )

@router.put("/users/{user_id}/admin")
async def update_user_admin_role(
    user_id: int,
    is_admin: bool,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Cập nhật vai trò admin của user"""
    try:
        result = AdminService.update_user_admin_role(db, user_id, is_admin)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật vai trò admin: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user_account(
    user_id: int,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Xóa tài khoản user"""
    try:
        # Không cho phép xóa chính mình
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể xóa tài khoản của chính mình"
            )
        
        result = AdminService.delete_user_account(db, user_id)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xóa tài khoản: {str(e)}"
        )

@router.get("/statistics")
async def get_system_statistics(
    request: Request,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê hệ thống với JSON filters"""
    try:
        # Lấy filters từ JSON parameter
        filters = get_json_filters(request)
        common_filters = extract_common_filters(filters)
        
        # Extract các filters cụ thể cho admin statistics
        period = common_filters.get('period', 'day')
        user_type = filters.get('userType', 'all')
        include_inactive = filters.get('includeInactive', False)
        sort_by = filters.get('sortBy', 'created_at')
        sort_order = filters.get('sortOrder', 'desc')
        
        result = AdminService.get_system_statistics(db, period)
        
        # Thêm thông tin filters đã sử dụng
        result['applied_filters'] = {
            'period': period,
            'user_type': user_type,
            'include_inactive': include_inactive,
            'sort_by': sort_by,
            'sort_order': sort_order
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê hệ thống: {str(e)}"
        )

@router.get("/users/{user_id}/activity")
async def get_user_activity_report(
    user_id: int,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy báo cáo hoạt động của user"""
    try:
        result = AdminService.get_user_activity_report(db, user_id)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy báo cáo hoạt động: {str(e)}"
        )

@router.get("/health")
async def get_system_health(
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Kiểm tra sức khỏe hệ thống"""
    try:
        result = AdminService.get_system_health_check(db)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi kiểm tra sức khỏe hệ thống: {str(e)}"
        )

@router.post("/users")
async def create_user_by_admin(
    user_data: CreateUserRequest,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Tạo user mới (chỉ admin)"""
    try:
        result = UserService.create_user(db, user_data.username, user_data.password, user_data.is_admin)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo user: {str(e)}"
        ) 