// Emotion related types
export interface EmotionStats {
  [key: string]: number;
}

export interface EmotionResult {
  id?: number;
  dominant_emotion: string;
  dominant_emotion_vn: string;
  dominant_emotion_score: number;
  emotions_scores: { [key: string]: number };
  emotions_scores_vn: { [key: string]: number };
  engagement: string;
  faces_detected: number;
  image_quality: number;
  processing_time: number;
  confidence_level: number;
  timestamp?: string;
}

export interface AnalysisResult {
  success: boolean;
  analysis?: {
    dominant_emotion: string;
    dominant_emotion_vn: string;
    dominant_emotion_score: number;
    emotions_scores: { [key: string]: number };
    emotions_scores_vn: { [key: string]: number };
    engagement: string;
    faces_detected: number;
    image_quality: number;
    processing_time: number;
    confidence_level: number;
  };
  saved_result?: {
    id: number;
    emotion: string;
    emotion_vn: string;
    score: number;
    engagement: string;
    timestamp: string;
  };
  session_id?: number;
  error?: string;
}

// Chart data types
export interface ChartDataItem {
  name: string;
  value: number;
  formattedName?: string;
  color?: string;
  type?: 'positive' | 'negative' | 'neutral';
}

export type EmotionType = 'positive' | 'negative' | 'neutral';

// Emotion labels
export const EMOTION_LABELS = {
  angry: 'Giận dữ',
  disgust: 'Ghê tởm', 
  fear: 'Sợ hãi',
  happy: 'Vui vẻ',
  sad: 'Buồn bã',
  surprise: 'Ngạc nhiên',
  neutral: 'Bình thường'
};

export const EMOTION_COLORS = {
  angry: '#ff4d4f',
  disgust: '#722ed1',
  fear: '#faad14',
  happy: '#52c41a',
  sad: '#1890ff',
  surprise: '#eb2f96',
  neutral: '#8c8c8c'
}; 