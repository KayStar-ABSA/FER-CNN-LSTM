def translate_emotion(emotion):
    mapping = {
        'angry': 'Tức giận',
        'disgust': 'Ghê tởm',
        'fear': 'Sợ hãi',
        'happy': 'Vui vẻ',
        'sad': 'Buồn',
        'surprise': 'Ngạc nhiên',
        'neutral': 'Bình thường'
    }
    return mapping.get(emotion, emotion)

def get_engagement_vietnamese(emotion, percent):
    # Đơn giản hóa: happy/surprise > 60% là Rất tích cực, neutral/sad là Tích cực, còn lại Không tích cực
    if emotion in ['happy', 'surprise'] and percent > 60:
        return 'Rất tích cực'
    elif emotion in ['neutral', 'sad']:
        return 'Tích cực'
    else:
        return 'Không tích cực' 