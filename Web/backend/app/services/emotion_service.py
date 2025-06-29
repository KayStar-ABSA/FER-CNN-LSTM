from sqlalchemy.orm import Session
from app.models.models import EmotionResult
from app.crud.emotion_crud import create_emotion_result, update_emotion_result
import numpy as np
from PIL import Image
import base64
from io import BytesIO
import cv2
import json
from typing import Dict, Any, Optional, Tuple
import time
from app.core.config import settings
from app.core.enums import EmotionType, ImageQualityLevel, EngagementLevel, get_image_quality_level, get_engagement_level
import logging
from app.services.system_log_service import SystemLogService

logger = logging.getLogger(__name__)

class EmotionService:
    """Service xử lý phân tích cảm xúc"""
    
    def __init__(self):
        self.model = None
        self.face_cascade = None
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        self.emotion_labels_vn = ['Giận dữ', 'Ghê tởm', 'Sợ hãi', 'Vui vẻ', 'Buồn bã', 'Ngạc nhiên', 'Bình thường']
        self.emotion_translations = dict(zip(self.emotion_labels, self.emotion_labels_vn))
        self._load_models()
        
    def _load_models(self):
        """Load các model cần thiết"""
        try:
            # Load face cascade
            self.face_cascade = cv2.CascadeClassifier(settings.CASCADE_PATH)
            if self.face_cascade.empty():
                logger.error("Không thể load face cascade classifier")
                raise Exception("Face cascade classifier không tồn tại")
            
            # Load emotion model
            with open(settings.MODEL_STRUCTURE_PATH, 'r') as f:
                model_config = json.load(f)
            
            # Import và tạo model
            from tensorflow.keras.models import model_from_json
            self.model = model_from_json(json.dumps(model_config))
            self.model.load_weights(settings.MODEL_WEIGHTS_PATH)
            
            logger.info("Models loaded successfully")
            
        except Exception as e:
            logger.error(f"Lỗi load models: {e}")
            raise
    
    def preprocess_image(self, image: np.ndarray) -> Tuple[np.ndarray, float]:
        """Tiền xử lý ảnh"""
        start_time = time.time()
        
        # Chuyển sang grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Phát hiện khuôn mặt
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return None, time.time() - start_time
        
        # Lấy khuôn mặt đầu tiên
        (x, y, w, h) = faces[0]
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize về kích thước chuẩn
        face_roi = cv2.resize(face_roi, (48, 48))
        
        # Chuẩn hóa
        face_roi = face_roi.astype('float32') / 255.0
        face_roi = np.expand_dims(face_roi, axis=-1)
        face_roi = np.expand_dims(face_roi, axis=0)
        
        processing_time = time.time() - start_time
        return face_roi, processing_time
    
    def analyze_emotion(self, image: np.ndarray) -> Dict[str, Any]:
        """Phân tích cảm xúc từ ảnh"""
        start_time = time.time()
        
        try:
            # Tiền xử lý ảnh
            processed_face, preprocess_time = self.preprocess_image(image)
            
            if processed_face is None:
                return {
                    'success': False,
                    'error': 'Không phát hiện được khuôn mặt',
                    'faces_detected': 0,
                    'processing_time': preprocess_time
                }
            
            # Dự đoán cảm xúc
            predictions = self.model.predict(processed_face, verbose=0)
            emotion_scores = predictions[0]
            
            # Tìm cảm xúc có điểm cao nhất
            dominant_emotion_idx = np.argmax(emotion_scores)
            dominant_emotion = self.emotion_labels[dominant_emotion_idx]
            dominant_emotion_score = float(emotion_scores[dominant_emotion_idx])
            
            # Tạo dictionary điểm số cảm xúc
            emotions_scores = dict(zip(self.emotion_labels, emotion_scores.tolist()))
            emotions_scores_vn = dict(zip(self.emotion_labels_vn, emotion_scores.tolist()))
            
            # Xác định mức độ tương tác
            engagement = self._determine_engagement(dominant_emotion_score)
            
            # Tính toán thời gian xử lý
            total_time = time.time() - start_time
            
            # Đánh giá chất lượng ảnh
            image_quality = self._assess_image_quality(image)
            
            result = {
                'success': True,
                'dominant_emotion': dominant_emotion,
                'dominant_emotion_vn': self.emotion_translations[dominant_emotion],
                'dominant_emotion_score': dominant_emotion_score,
                'emotions_scores': emotions_scores,
                'emotions_scores_vn': emotions_scores_vn,
                'engagement': engagement,
                'faces_detected': 1,
                'image_quality': image_quality,
                'processing_time': total_time,
                'confidence_level': dominant_emotion_score
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Lỗi phân tích cảm xúc: {e}")
            return {
                'success': False,
                'error': str(e),
                'faces_detected': 0,
                'processing_time': time.time() - start_time
            }
    
    def _determine_engagement(self, emotion_score: float) -> str:
        """Xác định mức độ tương tác dựa trên điểm cảm xúc"""
        if emotion_score > 0.7:
            return "high"
        elif emotion_score > 0.4:
            return "medium"
        else:
            return "low"
    
    def _assess_image_quality(self, image: np.ndarray) -> float:
        """Đánh giá chất lượng ảnh"""
        try:
            # Chuyển sang grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Tính độ tương phản
            contrast = gray.std()
            
            # Tính độ sáng trung bình
            brightness = gray.mean()
            
            # Đánh giá chất lượng (0-1)
            quality = min(1.0, (contrast / 50.0 + brightness / 255.0) / 2)
            
            return float(quality)
            
        except Exception:
            return 0.5
    
    def save_emotion_result(self, db: Session, user_id: int, analysis_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Lưu kết quả phân tích vào database"""
        try:
            # Lưu cả kết quả thành công và thất bại
            if analysis_result.get('success', False):
                # Trường hợp thành công - có phát hiện khuôn mặt
                emotion_result = create_emotion_result(
                    db=db,
                    user_id=user_id,
                    emotion=analysis_result['dominant_emotion'],
                    score=analysis_result['dominant_emotion_score'],
                    faces_detected=analysis_result['faces_detected'],
                    dominant_emotion=analysis_result['dominant_emotion'],
                    dominant_emotion_vn=analysis_result['dominant_emotion_vn'],
                    dominant_emotion_score=analysis_result['dominant_emotion_score'],
                    engagement=analysis_result['engagement'],
                    emotions_scores=analysis_result['emotions_scores'],
                    emotions_scores_vn=analysis_result['emotions_scores_vn'],
                    image_quality=analysis_result.get('image_quality', 0.5),
                    analysis_duration=analysis_result['processing_time'],
                    confidence_level=analysis_result.get('confidence_level', 0.0),
                    processing_time=analysis_result['processing_time'],
                    avg_fps=1000 / analysis_result['processing_time'] if analysis_result['processing_time'] > 0 else 0,
                    image_size=f"{analysis_result.get('image_width', 0)}x{analysis_result.get('image_height', 0)}",
                    cache_hits=0
                )
                
                # Log kết quả phân tích thành công
                SystemLogService.log_emotion_analysis(
                    db, user_id, analysis_result['faces_detected'], 
                    analysis_result['dominant_emotion_vn'], analysis_result['processing_time']
                )
                
                return {
                    'id': emotion_result.id,
                    'emotion': emotion_result.emotion,
                    'score': emotion_result.score,
                    'faces_detected': emotion_result.faces_detected,
                    'dominant_emotion': emotion_result.dominant_emotion,
                    'dominant_emotion_vn': emotion_result.dominant_emotion_vn,
                    'dominant_emotion_score': emotion_result.dominant_emotion_score,
                    'engagement': emotion_result.engagement,
                    'processing_time': emotion_result.processing_time,
                    'image_quality': emotion_result.image_quality,
                    'confidence_level': emotion_result.confidence_level
                }
            else:
                # Trường hợp thất bại - không phát hiện khuôn mặt
                emotion_result = create_emotion_result(
                    db=db,
                    user_id=user_id,
                    emotion='no_face_detected',  # Đánh dấu không phát hiện khuôn mặt
                    score=0.0,
                    faces_detected=0,
                    dominant_emotion='no_face_detected',
                    dominant_emotion_vn='Không phát hiện khuôn mặt',
                    dominant_emotion_score=0.0,
                    engagement='none',
                    emotions_scores={},
                    emotions_scores_vn={},
                    image_quality=analysis_result.get('image_quality', 0.5),
                    analysis_duration=analysis_result['processing_time'],
                    confidence_level=0.0,
                    processing_time=analysis_result['processing_time'],
                    avg_fps=1000 / analysis_result['processing_time'] if analysis_result['processing_time'] > 0 else 0,
                    image_size=f"{analysis_result.get('image_width', 0)}x{analysis_result.get('image_height', 0)}",
                    cache_hits=0
                )
                
                # Log thất bại phát hiện khuôn mặt
                SystemLogService.log_emotion_analysis(
                    db, user_id, 0, 'Không phát hiện khuôn mặt', analysis_result['processing_time']
                )
                
                return {
                    'id': emotion_result.id,
                    'emotion': 'no_face_detected',
                    'score': 0.0,
                    'faces_detected': 0,
                    'dominant_emotion': 'no_face_detected',
                    'dominant_emotion_vn': 'Không phát hiện khuôn mặt',
                    'dominant_emotion_score': 0.0,
                    'engagement': 'none',
                    'processing_time': emotion_result.processing_time,
                    'image_quality': emotion_result.image_quality,
                    'confidence_level': 0.0
                }
            
        except Exception as e:
            logger.error(f"Lỗi lưu kết quả phân tích: {e}")
            return None

# Tạo instance global
emotion_service = EmotionService() 