from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.services.stats_service import StatsService
from typing import Dict, Any, List

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/emotion")
async def get_emotion_statistics(
    period: str = "day",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê cảm xúc chi tiết"""
    try:
        result = StatsService.get_user_emotion_stats(db, current_user.id, period)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê cảm xúc: {str(e)}"
        )

@router.get("/performance")
async def get_performance_statistics(
    period: str = "day",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê hiệu suất chi tiết"""
    try:
        result = StatsService.get_user_performance_stats(db, current_user.id, period)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê hiệu suất: {str(e)}"
        )

@router.get("/history")
async def get_analysis_history(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy lịch sử phân tích chi tiết"""
    try:
        result = StatsService.get_emotion_history_data(db, current_user.id, limit)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy lịch sử phân tích: {str(e)}"
        )

@router.get("/summary")
async def get_statistics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy tổng hợp thống kê"""
    try:
        # Lấy thống kê cảm xúc ngày hôm nay
        emotion_stats = StatsService.get_user_emotion_stats(db, current_user.id, "day")
        
        # Lấy thống kê hiệu suất ngày hôm nay
        performance_stats = StatsService.get_user_performance_stats(db, current_user.id, "day")
        
        # Lấy lịch sử gần đây
        history_data = StatsService.get_emotion_history_data(db, current_user.id, 10)
        
        return {
            "success": True,
            "summary": {
                "emotion_stats": emotion_stats,
                "performance_stats": performance_stats,
                "recent_history": history_data
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy tổng hợp thống kê: {str(e)}"
        )

@router.get("/export")
async def export_statistics(
    period: str = "month",
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Xuất thống kê"""
    try:
        # Lấy thống kê cảm xúc
        emotion_stats = StatsService.get_user_emotion_stats(db, current_user.id, period)
        
        # Lấy thống kê hiệu suất
        performance_stats = StatsService.get_user_performance_stats(db, current_user.id, period)
        
        # Lấy lịch sử
        history_data = StatsService.get_emotion_history_data(db, current_user.id, 1000)
        
        export_data = {
            "user_id": current_user.id,
            "username": current_user.username,
            "period": period,
            "export_date": "2024-01-01T00:00:00Z",
            "emotion_statistics": emotion_stats,
            "performance_statistics": performance_stats,
            "analysis_history": history_data
        }
        
        return {
            "success": True,
            "format": format,
            "data": export_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xuất thống kê: {str(e)}"
        ) 