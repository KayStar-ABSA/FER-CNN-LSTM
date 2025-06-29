import React from 'react';
import { Card, Progress, Tag, Typography } from 'antd';
import { EmotionStats } from '../../types';
import { formatEmotion, getEmotionColor, getEmotionType } from '../../utils/emotionUtils';

const { Text } = Typography;

interface EmotionDetailCardProps {
  emotionStats: EmotionStats;
  title?: string;
}

const EmotionDetailCard: React.FC<EmotionDetailCardProps> = ({
  emotionStats,
  title = "Chi Tiết Cảm Xúc"
}) => {
  const maxValue = Math.max(...Object.values(emotionStats));

  return (
    <Card title={title}>
      <div style={{ padding: '20px' }}>
        {Object.entries(emotionStats).map(([emotion, count]) => (
          <div key={emotion} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text>{formatEmotion(emotion)}</Text>
              <Text strong style={{ color: getEmotionColor(emotion) }}>
                {count} lần
              </Text>
            </div>
            <Progress 
              percent={(count / maxValue) * 100} 
              strokeColor={getEmotionColor(emotion)}
              showInfo={false}
            />
            <Tag 
              color={getEmotionType(emotion) === 'positive' ? 'green' : 
                     getEmotionType(emotion) === 'negative' ? 'red' : 'default'}
              style={{ marginTop: '4px' }}
            >
              {getEmotionType(emotion) === 'positive' ? 'Tích cực' : 
               getEmotionType(emotion) === 'negative' ? 'Tiêu cực' : 'Trung tính'}
            </Tag>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EmotionDetailCard; 