from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import create_access_token, get_current_user
from app.services.user_service import UserService
from app.models.models import User
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Đăng nhập user"""
    try:
        # Xác thực user
        user_data = UserService.authenticate_user(db, form_data.username, form_data.password)
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Username hoặc password không đúng",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Tạo access token
        access_token = create_access_token(data={"sub": user_data["username"]})
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi đăng nhập: {str(e)}"
        )

@router.post("/register")
async def register(
    username: str,
    password: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Đăng ký user mới"""
    try:
        result = UserService.create_user(db, username, password, is_admin=False)
        
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
            detail=f"Lỗi đăng ký: {str(e)}"
        )

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thông tin user hiện tại"""
    try:
        user_info = UserService.get_user_info(db, current_user.id)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy thông tin user"
            )
        
        return {
            "success": True,
            "user": user_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thông tin user: {str(e)}"
        )

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Đổi mật khẩu"""
    try:
        # Xác thực mật khẩu hiện tại
        user_data = UserService.authenticate_user(db, current_user.username, current_password)
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu hiện tại không đúng"
            )
        
        # Cập nhật mật khẩu mới
        result = UserService.update_user_password(db, current_user.id, new_password)
        
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
            detail=f"Lỗi đổi mật khẩu: {str(e)}"
        ) 