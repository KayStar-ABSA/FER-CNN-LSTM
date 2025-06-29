// Emotion translation and formatting utilities
export const formatEmotion = (emotion: string): string => {
  const emotionMap: { [key: string]: string } = {
    'happy': 'Vui vẻ',
    'sad': 'Buồn bã',
    'angry': 'Giận dữ',
    'surprise': 'Ngạc nhiên',
    'fear': 'Sợ hãi',
    'disgust': 'Ghê tởm',
    'neutral': 'Bình thường',
    'no_face_detected': 'Không phát hiện khuôn mặt'
  };
  return emotionMap[emotion] || emotion;
};

export const getEmotionColor = (emotion: string): string => {
  const colorMap: { [key: string]: string } = {
    'happy': '#52c41a',
    'sad': '#1890ff',
    'angry': '#f5222d',
    'surprise': '#fa8c16',
    'fear': '#722ed1',
    'disgust': '#eb2f96',
    'neutral': '#8c8c8c',
    'no_face_detected': '#d9d9d9'
  };
  return colorMap[emotion] || '#1890ff';
};

export const getEmotionType = (emotion: string): 'positive' | 'negative' | 'neutral' => {
  const positiveEmotions = ['happy', 'surprise'];
  const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
  
  if (positiveEmotions.includes(emotion)) return 'positive';
  if (negativeEmotions.includes(emotion)) return 'negative';
  return 'neutral';
};

// Emotion statistics utilities
export const categorizeEmotions = (emotionStats: { [key: string]: number }) => {
  const positiveEmotions = Object.entries(emotionStats).filter(([emotion]) => 
    getEmotionType(emotion) === 'positive'
  );
  const negativeEmotions = Object.entries(emotionStats).filter(([emotion]) => 
    getEmotionType(emotion) === 'negative'
  );
  const neutralEmotions = Object.entries(emotionStats).filter(([emotion]) => 
    getEmotionType(emotion) === 'neutral'
  );

  return {
    positive: positiveEmotions,
    negative: negativeEmotions,
    neutral: neutralEmotions,
    totalPositive: positiveEmotions.reduce((sum, [, count]) => sum + count, 0),
    totalNegative: negativeEmotions.reduce((sum, [, count]) => sum + count, 0),
    totalNeutral: neutralEmotions.reduce((sum, [, count]) => sum + count, 0)
  };
};

// Convert emotion stats to chart data
export const emotionStatsToChartData = (emotionStats: { [key: string]: number }) => {
  return Object.entries(emotionStats).map(([emotion, count]) => ({
    name: emotion,
    value: count,
    formattedName: formatEmotion(emotion),
    color: getEmotionColor(emotion),
    type: getEmotionType(emotion)
  }));
}; 