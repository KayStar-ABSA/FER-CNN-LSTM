import React from 'react';
import { Card, Statistic } from 'antd';
import { StatisticCardProps } from '../../types';

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  suffix,
  precision,
  valueStyle,
  color
}) => {
  const defaultValueStyle = color ? { color } : {};
  
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        precision={precision}
        valueStyle={{ ...defaultValueStyle, ...valueStyle }}
      />
    </Card>
  );
};

export default StatisticCard; 