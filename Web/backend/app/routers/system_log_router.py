from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, SystemLog
from app.services.system_log_service import SystemLogService
from typing import Dict, Any, List
from datetime import datetime, timedelta

router = APIRouter(prefix="/system-logs", tags=["System Logs"])

@router.get("/")
async def get_system_logs(
    level: str = Query(None, description="Lọc theo level (INFO, WARNING, ERROR)"),
    user_id: int = Query(None, description="Lọc theo user ID"),
    limit: int = Query(100, description="Số lượng log tối đa"),
    days: int = Query(7, description="Số ngày gần đây"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy danh sách system logs"""
    try:
        # Chỉ admin mới được xem system logs
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chỉ admin mới được xem system logs"
            )
        
        # Tính thời gian bắt đầu
        start_date = datetime.now() - timedelta(days=days)
        
        # Query logs
        query = db.query(SystemLog).filter(SystemLog.created_at >= start_date)
        
        if level:
            query = query.filter(SystemLog.level == level)
        if user_id:
            query = query.filter(SystemLog.user_id == user_id)
        
        logs = query.order_by(SystemLog.created_at.desc()).limit(limit).all()
        
        return {
            "success": True,
            "logs": [
                {
                    "id": log.id,
                    "level": log.level,
                    "message": log.message,
                    "user_id": log.user_id,
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat()
                }
                for log in logs
            ],
            "total": len(logs)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy system logs: {str(e)}"
        )

@router.get("/stats")
async def get_log_stats(
    days: int = Query(7, description="Số ngày gần đây"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê system logs"""
    try:
        # Chỉ admin mới được xem
        if not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chỉ admin mới được xem thống kê logs"
            )
        
        start_date = datetime.now() - timedelta(days=days)
        
        # Thống kê theo level
        from sqlalchemy import func
        level_stats = db.query(
            SystemLog.level,
            func.count(SystemLog.id).label('count')
        ).filter(
            SystemLog.created_at >= start_date
        ).group_by(SystemLog.level).all()
        
        # Thống kê theo user
        user_stats = db.query(
            SystemLog.user_id,
            func.count(SystemLog.id).label('count')
        ).filter(
            SystemLog.created_at >= start_date,
            SystemLog.user_id.isnot(None)
        ).group_by(SystemLog.user_id).order_by(func.count(SystemLog.id).desc()).limit(10).all()
        
        return {
            "success": True,
            "level_stats": [{"level": stat.level, "count": stat.count} for stat in level_stats],
            "top_users": [{"user_id": stat.user_id, "count": stat.count} for stat in user_stats],
            "period_days": days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê logs: {str(e)}"
        ) 