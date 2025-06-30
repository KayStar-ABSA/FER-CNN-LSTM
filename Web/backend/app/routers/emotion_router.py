from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import cv2
import numpy as np
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, AnalysisSession
from app.services.emotion_service import emotion_service
from app.services.stats_service import StatsService
from app.crud.session_crud import create_session, update_session, get_session_by_id, end_session
from typing import Dict, Any
import io
from datetime import datetime
from app.core.utils import get_json_filters, extract_common_filters
import base64

router = APIRouter(prefix="/emotion", tags=["Emotion Analysis"])

class EmotionAnalyzeRequest:
    def __init__(self, image_base64: str):
        self.image_base64 = image_base64

@router.post("/analyze")
async def analyze_emotion(
    request_data: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Phân tích cảm xúc từ ảnh base64"""
    try:
        # Decode base64 image
        image_base64 = request_data.get('image_base64')
        if not image_base64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy dữ liệu ảnh base64"
            )
            
        # Convert base64 to image
        try:
            img_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể decode ảnh base64: {str(e)}"
            )
        
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể đọc dữ liệu ảnh"
            )
        
        # Phân tích cảm xúc
        analysis_result = emotion_service.analyze_emotion(image)
        
        # Lưu kết quả vào database (cả thành công và thất bại)
        saved_result = emotion_service.save_emotion_result(db, current_user.id, analysis_result)
        
        # Session management đơn giản
        session_id = None
        try:
            # Chỉ tạo session mới nếu chưa có
            active_session = db.query(AnalysisSession).filter(AnalysisSession.user_id == current_user.id, AnalysisSession.session_end == None).first()
            if not active_session:
                active_session = create_session(
                    db=db,
                    user_id=current_user.id,
                    camera_resolution="640x480",
                    analysis_interval=500  # Cập nhật interval
                )
            
            # Cập nhật thống kê session
            if active_session:
                # Tính toán thống kê mới
                new_total = (active_session.total_analyses or 0) + 1
                new_successful = (active_session.successful_detections or 0) + (1 if analysis_result['faces_detected'] > 0 else 0)
                new_failed = (active_session.failed_detections or 0) + (1 if analysis_result['faces_detected'] == 0 else 0)
                new_detection_rate = (new_successful / new_total) * 100 if new_total > 0 else 0
                
                # Cập nhật session
                update_session(
                    db=db,
                    session_id=active_session.id,
                    total_analyses=new_total,
                    successful_detections=new_successful,
                    failed_detections=new_failed,
                    detection_rate=new_detection_rate,
                    avg_processing_time=analysis_result['processing_time'],
                    avg_fps=1000 / analysis_result['processing_time'] if analysis_result['processing_time'] > 0 else 0
                )
                
            session_id = active_session.id if active_session else None
        except Exception as e:
            print(f"Session creation error: {e}")
            session_id = None
        
        # Trả về kết quả dựa trên success
        if analysis_result.get('success', False):
            return {
                "success": True,
                "analysis": {
                    "dominant_emotion": analysis_result['dominant_emotion'],
                    "dominant_emotion_vn": analysis_result['dominant_emotion_vn'],
                    "dominant_emotion_score": analysis_result['dominant_emotion_score'],
                    "emotions_scores": analysis_result['emotions_scores'],
                    "emotions_scores_vn": analysis_result['emotions_scores_vn'],
                    "engagement": analysis_result['engagement'],
                    "faces_detected": analysis_result['faces_detected'],
                    "image_quality": analysis_result.get('image_quality', 0.5),
                    "processing_time": analysis_result['processing_time'],
                    "confidence_level": analysis_result.get('confidence_level', 0.0)
                },
                "saved_result": saved_result,
                "session_id": session_id
            }
        else:
            return {
                "success": False,
                "error": analysis_result.get('error', 'Lỗi phân tích cảm xúc'),
                "faces_detected": analysis_result.get('faces_detected', 0),
                "processing_time": analysis_result.get('processing_time', 0),
                "saved_result": saved_result,
                "session_id": session_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi phân tích cảm xúc: {str(e)}"
        )

@router.post("/end-session")
async def end_analysis_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Kết thúc phiên phân tích hiện tại"""
    try:
        active_session = db.query(AnalysisSession).filter(AnalysisSession.user_id == current_user.id, AnalysisSession.session_end == None).first()
        if active_session:
            end_session(db, active_session.id)
            return {
                "success": True,
                "message": "Đã kết thúc phiên phân tích",
                "session_id": active_session.id
            }
        else:
            return {
                "success": False,
                "message": "Không có phiên phân tích đang hoạt động"
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi kết thúc phiên: {str(e)}"
        )

@router.get("/stats")
async def get_emotion_stats(
    period: str = "day",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê cảm xúc của user"""
    try:
        result = StatsService.get_user_emotion_stats(db, current_user.id, period)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê cảm xúc: {str(e)}"
        )

@router.get("/history")
async def get_emotion_history(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy lịch sử phân tích cảm xúc"""
    try:
        result = StatsService.get_emotion_history_data(db, current_user.id, limit)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy lịch sử cảm xúc: {str(e)}"
        )

@router.get("/performance")
async def get_performance_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê hiệu suất phân tích với JSON filters"""
    try:
        # Lấy filters từ JSON parameter
        filters = get_json_filters(request)
        common_filters = extract_common_filters(filters)
        
        # Extract các filters cụ thể cho performance stats
        period = common_filters.get('period', 'day')
        user_id = common_filters.get('user_id', current_user.id)
        include_details = common_filters.get('include_details', False)
        
        # Nếu user_id là 'all' hoặc không có user_id cụ thể, lấy tổng hợp
        if user_id == 'all' or user_id is None:
            result = StatsService.get_all_users_performance_stats(db, period)
        else:
            result = StatsService.get_user_performance_stats(db, user_id, period)
        
        # Thêm thông tin filters đã sử dụng
        result['applied_filters'] = {
            'period': period,
            'user_id': user_id,
            'include_details': include_details
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê hiệu suất: {str(e)}"
        )

@router.get("/face-detection-stats")
async def get_face_detection_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Lấy thống kê chi tiết về phát hiện khuôn mặt với JSON filters"""
    try:
        # Lấy filters từ JSON parameter
        filters = get_json_filters(request)
        common_filters = extract_common_filters(filters)
        
        # Extract các filters cụ thể cho face detection stats
        period = common_filters.get('period', 'day')
        user_id = common_filters.get('user_id', current_user.id)
        include_details = common_filters.get('include_details', False)
        
        # Nếu user_id là 'all' hoặc không có user_id cụ thể, lấy tổng hợp
        if user_id == 'all' or user_id is None:
            result = StatsService.get_all_users_face_detection_stats(db, period)
        else:
            result = StatsService.get_face_detection_stats(db, user_id, period)
        
        # Thêm thông tin filters đã sử dụng
        result['applied_filters'] = {
            'period': period,
            'user_id': user_id,
            'include_details': include_details
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thống kê phát hiện khuôn mặt: {str(e)}"
        ) 