import React from 'react';
import { Card } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartDataItem } from '../../types';
import { formatEmotion } from '../../utils/emotionUtils';

interface EmotionChartProps {
  data: ChartDataItem[];
  type: 'pie' | 'bar';
  title: string;
  height?: number;
}

const EmotionChart: React.FC<EmotionChartProps> = ({
  data,
  type,
  title,
  height = 300
}) => {
  const renderChart = () => {
    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${formatEmotion(name)} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, formatEmotion(name as string)]} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedName" />
          <YAxis />
          <Tooltip formatter={(value, name) => [value, 'Số lần']} />
          <Bar dataKey="value" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card title={title}>
      {renderChart()}
    </Card>
  );
};

export default EmotionChart; 