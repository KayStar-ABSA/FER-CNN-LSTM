from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.services.session_service import SessionService
from app.core.utils import get_json_config
from typing import Dict, Any, List, Optional

router = APIRouter(prefix="/sessions", tags=["Analysis Sessions"])

class SessionStartRequest(BaseModel):
    cameraResolution: Optional[str] = None
    analysisInterval: Optional[int] = None
    detectionThreshold: Optional[float] = Field(default=0.8)
    enabledEmotions: Optional[List[str]] = Field(default=[])
    maxSessionDuration: Optional[int] = Field(default=3600)

@router.post("/start")
async def start_analysis_session(
    config: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Bắt đầu phiên phân tích mới với JSON config"""
    try:
        result = SessionService.create_session(
            db, 
            current_user.id, 
            config.cameraResolution, 
            config.analysisInterval,
            detection_threshold=config.detectionThreshold,
            enabled_emotions=config.enabledEmotions,
            max_session_duration=config.maxSessionDuration
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        # Thêm thông tin config đã sử dụng
        result['applied_config'] = {
            'camera_resolution': config.cameraResolution,
            'analysis_interval': config.analysisInterval,
            'detection_threshold': config.detectionThreshold,
            'enabled_emotions': config.enabledEmotions,
            'max_session_duration': config.maxSessionDuration
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi bắt đầu phiên phân tích: {str(e)}"
        )

@router.post("/{session_id}/update-stats")
async def update_session_stats(
    session_id: int,
    total_analyses: int = None,
    successful_detections: int = None,
    failed_detections: int = None,
    detection_rate: float = None,
    emotions_summary: Dict[str, int] = None,
    average_engagement: float = None,
    avg_processing_time: float = None,
    avg_fps: float = None,
    total_cache_hits: int = None,
    cache_hit_rate: float = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Cập nhật thống kê phiên phân tích"""
    try:
        stats = {}
        if total_analyses is not None:
            stats['total_analyses'] = total_analyses
        if successful_detections is not None:
            stats['successful_detections'] = successful_detections
        if failed_detections is not None:
            stats['failed_detections'] = failed_detections
        if detection_rate is not None:
            stats['detection_rate'] = detection_rate
        if emotions_summary is not None:
            stats['emotions_summary'] = emotions_summary
        if average_engagement is not None:
            stats['average_engagement'] = average_engagement
        if avg_processing_time is not None:
            stats['avg_processing_time'] = avg_processing_time
        if avg_fps is not None:
            stats['avg_fps'] = avg_fps
        if total_cache_hits is not None:
            stats['total_cache_hits'] = total_cache_hits
        if cache_hit_rate is not None:
            stats['cache_hit_rate'] = cache_hit_rate
        
        result = SessionService.update_session_stats(db, session_id, **stats)
        
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
            detail=f"Lỗi cập nhật thống kê phiên: {str(e)}"
        )

@router.get("/my-sessions")
async def get_user_sessions(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy danh sách phiên phân tích của user"""
    try:
        sessions = SessionService.get_user_sessions_list(db, current_user.id, limit)
        
        return {
            "success": True,
            "sessions": sessions,
            "total_count": len(sessions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách phiên phân tích: {str(e)}"
        )

@router.get("/{session_id}/stats")
async def get_session_statistics(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê chi tiết của phiên phân tích"""
    try:
        stats = SessionService.get_session_statistics(db, session_id)
        
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiên phân tích"
            )
        
        return {
            "success": True,
            "session_id": session_id,
            "statistics": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê phiên: {str(e)}"
        )

@router.post("/end")
async def end_current_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Kết thúc phiên phân tích hiện tại"""
    try:
        result = SessionService.end_user_session(db, current_user.id)
        
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
            detail=f"Lỗi kết thúc phiên phân tích: {str(e)}"
        )

@router.get("/active")
async def get_active_session_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thông tin phiên phân tích đang hoạt động"""
    try:
        session_info = SessionService.get_active_session_info(db, current_user.id)
        
        if not session_info:
            return {
                "success": True,
                "has_active_session": False,
                "session": None
            }
        
        return {
            "success": True,
            "has_active_session": True,
            "session": session_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thông tin phiên hoạt động: {str(e)}"
        ) 