from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.services.stats_service import StatsService
from app.core.utils import get_json_filters, extract_common_filters
from typing import Dict, Any, List

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/emotion")
async def get_emotion_statistics(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê cảm xúc chi tiết với JSON filters"""
    try:
        # Lấy filters từ JSON parameter
        filters = get_json_filters(request)
        common_filters = extract_common_filters(filters)
        
        # Extract các filters cụ thể cho emotion stats
        period = common_filters.get('period', 'day')
        emotions = common_filters.get('emotions', [])
        include_details = common_filters.get('include_details', False)
        user_id = common_filters.get('user_id', current_user.id)
        
        # Nếu user_id là 'all' hoặc không có user_id cụ thể, lấy tổng hợp
        if user_id == 'all' or user_id is None:
            result = StatsService.get_all_users_emotion_stats(db, period)
        else:
            result = StatsService.get_user_emotion_stats(db, user_id, period)
        
        # Filter theo emotions nếu có
        if emotions and 'emotion_stats' in result:
            result['emotion_stats'] = {k: v for k, v in result['emotion_stats'].items() if k in emotions}
        
        # Thêm thông tin filters đã sử dụng
        result['applied_filters'] = {
            'period': period,
            'emotions': emotions,
            'include_details': include_details,
            'user_id': user_id
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê cảm xúc: {str(e)}"
        )

@router.get("/performance")
async def get_performance_statistics(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê hiệu suất chi tiết với JSON filters"""
    try:
        # Lấy filters từ JSON parameter
        filters = get_json_filters(request)
        common_filters = extract_common_filters(filters)
        
        # Extract các filters cụ thể cho performance stats
        period = common_filters.get('period', 'day')
        include_details = common_filters.get('include_details', False)
        user_id = common_filters.get('user_id', current_user.id)
        
        # Nếu user_id là 'all' hoặc không có user_id cụ thể, lấy tổng hợp
        if user_id == 'all' or user_id is None:
            result = StatsService.get_all_users_performance_stats(db, period)
        else:
            result = StatsService.get_user_performance_stats(db, user_id, period)
        
        # Thêm thông tin filters đã sử dụng
        result['applied_filters'] = {
            'period': period,
            'include_details': include_details,
            'user_id': user_id
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê hiệu suất: {str(e)}"
        )

@router.get("/history")
async def get_analysis_history(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy lịch sử phân tích chi tiết với JSON filters"""
    try:
        # Lấy filters từ JSON parameter
        filters = get_json_filters(request)
        common_filters = extract_common_filters(filters)
        
        # Extract các filters cụ thể cho history
        limit = common_filters.get('limit', 100)
        user_id = common_filters.get('user_id', current_user.id)
        start_date = common_filters.get('start_date')
        end_date = common_filters.get('end_date')
        
        # Nếu user_id là 'all', lấy lịch sử tổng hợp của tất cả users
        if user_id == 'all':
            result = StatsService.get_all_users_emotion_history_data(db, limit)
        else:
            result = StatsService.get_emotion_history_data(db, user_id, limit)
        
        # Filter theo date range nếu có
        if start_date or end_date:
            # TODO: Implement date filtering in StatsService
            pass
        
        # Thêm thông tin filters đã sử dụng
        result['applied_filters'] = {
            'limit': limit,
            'user_id': user_id,
            'start_date': start_date,
            'end_date': end_date
        }
        
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