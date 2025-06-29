import React from 'react';
import { Spin, Typography } from 'antd';
import { LoadingSpinnerProps } from '../../types';

const { Text } = Typography;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Đang tải...', 
  size = 'large' 
}) => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Spin size={size} />
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">{message}</Text>
      </div>
    </div>
  );
};

export default LoadingSpinner; 