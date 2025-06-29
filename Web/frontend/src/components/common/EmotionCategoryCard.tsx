import React from 'react';
import { Card, Statistic, Tag } from 'antd';
import { formatEmotion } from '../../utils/emotionUtils';
import { EmotionCategoryCardProps } from '../../types';

const EmotionCategoryCard: React.FC<EmotionCategoryCardProps> = ({
  title,
  emotions,
  total,
  color,
  tagColor
}) => {
  return (
    <Card title={title} style={{ textAlign: 'center' }}>
      <Statistic
        title="Tổng cộng"
        value={total}
        suffix="lần"
        valueStyle={{ color, fontSize: '24px' }}
      />
      <div style={{ marginTop: 16 }}>
        {emotions.map(([emotion, count]) => (
          <div key={emotion} style={{ marginBottom: 8 }}>
            <Tag color={tagColor}>{formatEmotion(emotion)}: {count}</Tag>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EmotionCategoryCard; 