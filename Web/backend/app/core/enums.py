from enum import Enum
from typing import List

class EmotionType(str, Enum):
    """Các loại cảm xúc được hỗ trợ"""
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    SURPRISED = "surprised"
    FEAR = "fear"
    DISGUST = "disgust"
    NEUTRAL = "neutral"
    NO_FACE = "no_face"
    ERROR = "error"

class PeriodType(str, Enum):
    """Các loại khoảng thời gian cho thống kê"""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"

class SessionStatus(str, Enum):
    """Trạng thái phiên phân tích"""
    ACTIVE = "active"
    ENDED = "ended"
    PAUSED = "paused"

class UserRole(str, Enum):
    """Vai trò người dùng"""
    USER = "user"
    ADMIN = "admin"

class ImageQualityLevel(str, Enum):
    """Mức độ chất lượng ảnh"""
    EXCELLENT = "excellent"  # 0.8-1.0
    GOOD = "good"           # 0.6-0.8
    FAIR = "fair"           # 0.4-0.6
    POOR = "poor"           # 0.0-0.4

class EngagementLevel(str, Enum):
    """Mức độ tương tác"""
    HIGH = "high"           # 0.8-1.0
    MEDIUM = "medium"       # 0.5-0.8
    LOW = "low"             # 0.0-0.5

class ProcessingStatus(str, Enum):
    """Trạng thái xử lý"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class CacheStatus(str, Enum):
    """Trạng thái cache"""
    HIT = "hit"
    MISS = "miss"

class AnalysisMode(str, Enum):
    """Chế độ phân tích"""
    SINGLE = "single"
    STREAM = "stream"
    BATCH = "batch"

# Helper functions
def get_emotion_labels() -> List[str]:
    """Lấy danh sách nhãn cảm xúc"""
    return [emotion.value for emotion in EmotionType if emotion not in [EmotionType.NO_FACE, EmotionType.ERROR]]

def get_period_options() -> List[str]:
    """Lấy danh sách tùy chọn khoảng thời gian"""
    return [period.value for period in PeriodType]

def get_image_quality_level(score: float) -> ImageQualityLevel:
    """Xác định mức độ chất lượng ảnh dựa trên điểm số"""
    if score >= 0.8:
        return ImageQualityLevel.EXCELLENT
    elif score >= 0.6:
        return ImageQualityLevel.GOOD
    elif score >= 0.4:
        return ImageQualityLevel.FAIR
    else:
        return ImageQualityLevel.POOR

def get_engagement_level(score: float) -> EngagementLevel:
    """Xác định mức độ tương tác dựa trên điểm số"""
    if score >= 0.8:
        return EngagementLevel.HIGH
    elif score >= 0.5:
        return EngagementLevel.MEDIUM
    else:
        return EngagementLevel.LOW 