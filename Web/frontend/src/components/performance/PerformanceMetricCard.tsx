import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { PerformanceMetricType } from '../../types';
import { getPerformanceColor, getPerformanceStatus } from '../../utils/performanceUtils';

const { Text } = Typography;

interface PerformanceMetricCardProps {
  title: string;
  value: number;
  type: PerformanceMetricType;
  unit?: string;
  maxValue?: number;
  height?: number;
}

const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  value,
  type,
  unit = '',
  maxValue,
  height = 300
}) => {
  const color = getPerformanceColor(value, type);
  const status = getPerformanceStatus(value, type);
  
  // Calculate percentage for progress bar
  const getPercentage = () => {
    if (maxValue) {
      return (value / maxValue) * 100;
    }
    
    // Default calculations based on type
    switch (type) {
      case 'fps':
        return Math.min(value * 10, 100); // 10 FPS = 100%
      case 'processing':
        return Math.max(0, 100 - (value / 10)); // 1000ms = 0%, 0ms = 100%
      case 'detection':
        return value; // Already a percentage
      case 'cache':
        return value; // Already a percentage
      default:
        return 50;
    }
  };

  const getProgressStatus = () => {
    switch (type) {
      case 'fps':
        return value >= 10 ? 'success' : value >= 5 ? 'normal' : 'exception';
      case 'processing':
        return value <= 500 ? 'success' : value <= 1000 ? 'normal' : 'exception';
      case 'detection':
        return value >= 80 ? 'success' : value >= 60 ? 'normal' : 'exception';
      case 'cache':
        return value >= 70 ? 'success' : value >= 40 ? 'normal' : 'exception';
      default:
        return 'normal';
    }
  };

  return (
    <Card title={title} style={{ height }}>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>{title}</span>
            <span style={{ color }}>
              {value.toFixed(type === 'fps' ? 1 : 0)}{unit}
            </span>
          </div>
          <Progress 
            percent={getPercentage()} 
            strokeColor={color}
            status={getProgressStatus()}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {status}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PerformanceMetricCard; 