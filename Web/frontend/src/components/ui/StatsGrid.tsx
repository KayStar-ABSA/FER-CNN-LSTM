import React from 'react';
import { Row, Col } from 'antd';
import StatisticCard from '../common/StatisticCard';
import { StatisticCardProps } from '../../types';

interface StatsGridProps {
  stats: StatisticCardProps[];
  gutter?: number;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats, gutter = 16 }) => {
  const colSpan = 24 / Math.min(stats.length, 4); // Max 4 columns

  return (
    <Row gutter={gutter} style={{ marginBottom: '24px' }}>
      {stats.map((stat, index) => (
        <Col span={colSpan} key={index}>
          <StatisticCard {...stat} />
        </Col>
      ))}
    </Row>
  );
};

export default StatsGrid; 