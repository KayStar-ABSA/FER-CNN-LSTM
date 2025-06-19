# Mapping cảm xúc từ tiếng Anh sang tiếng Việt
EMOTION_TRANSLATIONS = {
    'happy': 'Vui vẻ',
    'sad': 'Buồn bã',
    'angry': 'Tức giận',
    'surprise': 'Ngạc nhiên',
    'neutral': 'Bình thường',
    'fear': 'Sợ hãi',
    'disgust': 'Ghê tởm'
}

# Mapping mức độ tham gia từ tiếng Anh sang tiếng Việt
ENGAGEMENT_TRANSLATIONS = {
    'Highly engaged': 'Rất tích cực',
    'Engaged': 'Tích cực',
    'engaged': 'Tích cực',
    'Disengaged': 'Không tích cực',
    'disengaged': 'Không tích cực'
}

def translate_emotion(emotion_en):
    """Chuyển đổi cảm xúc từ tiếng Anh sang tiếng Việt"""
    return EMOTION_TRANSLATIONS.get(emotion_en, emotion_en)

def translate_engagement(engagement_en):
    """Chuyển đổi mức độ tham gia từ tiếng Anh sang tiếng Việt"""
    return ENGAGEMENT_TRANSLATIONS.get(engagement_en, engagement_en)

def get_engagement_vietnamese(emotion, emotion_percentage):
    """Xác định mức độ tham gia bằng tiếng Việt dựa trên cảm xúc"""
    if emotion in ['happy', 'surprise', 'fear'] and emotion_percentage > 80:
        return 'Rất tích cực'
    elif emotion == 'neutral' and emotion_percentage > 50:
        return 'Tích cực'
    else:
        return 'Không tích cực' 