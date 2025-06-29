import React from 'react';
import { Progress, Tag } from 'antd';
import { getPerformanceColor, getProgressStatus } from './performanceUtils';
import { formatEmotion } from './emotionUtils';

// Session table columns
export const getSessionColumns = () => [
  {
    title: 'Thời gian bắt đầu',
    dataIndex: 'session_start',
    key: 'session_start',
    render: (text: string) => new Date(text).toLocaleString('vi-VN')
  },
  {
    title: 'Tổng phân tích',
    dataIndex: 'total_analyses',
    key: 'total_analyses',
  },
  {
    title: 'Phát hiện thành công',
    dataIndex: 'successful_detections',
    key: 'successful_detections',
  },
  {
    title: 'Tỷ lệ phát hiện',
    dataIndex: 'detection_rate',
    key: 'detection_rate',
    render: (rate: number) => (
      <Progress 
        percent={rate} 
        size="small" 
        status={getProgressStatus(rate, 'detection')}
      />
    )
  },
  {
    title: 'Độ tương tác TB',
    dataIndex: 'average_engagement',
    key: 'average_engagement',
    render: (engagement: number | null) => engagement ? `${(engagement * 100).toFixed(2)}%` : 'N/A'
  }
];

// Performance session table columns
export const getPerformanceSessionColumns = () => [
  {
    title: 'Phiên',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: 'Thời gian bắt đầu',
    dataIndex: 'session_start',
    key: 'session_start',
    render: (text: string) => new Date(text).toLocaleString('vi-VN'),
  },
  {
    title: 'Tổng phân tích',
    dataIndex: 'total_analyses',
    key: 'total_analyses',
    width: 120,
  },
  {
    title: 'Tỷ lệ phát hiện',
    dataIndex: 'detection_rate',
    key: 'detection_rate',
    width: 120,
    render: (value: number) => (
      <Progress 
        percent={Math.round(value)} 
        size="small" 
        status={getProgressStatus(value, 'detection')}
      />
    ),
  },
  {
    title: 'FPS',
    dataIndex: 'avg_fps',
    key: 'avg_fps',
    width: 80,
    render: (value: number) => (
      <Tag color={getPerformanceColor(value, 'fps')}>
        {value.toFixed(1)}
      </Tag>
    ),
  },
  {
    title: 'Thời gian xử lý (ms)',
    dataIndex: 'avg_processing_time',
    key: 'avg_processing_time',
    width: 150,
    render: (value: number) => (
      <Tag color={getPerformanceColor(value, 'processing')}>
        {value.toFixed(0)}
      </Tag>
    ),
  },
  {
    title: 'Cache Hit Rate',
    dataIndex: 'cache_hit_rate',
    key: 'cache_hit_rate',
    width: 120,
    render: (value: number) => (
      <Progress 
        percent={Math.round(value)} 
        size="small" 
        status={getProgressStatus(value, 'cache')}
      />
    ),
  },
];

// User list table columns
export const getUserListColumns = () => [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: 'Tên người dùng',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: 'Vai trò',
    dataIndex: 'is_admin',
    key: 'is_admin',
    render: (isAdmin: boolean) => (
      <Tag color={isAdmin ? 'red' : 'blue'}>
        {isAdmin ? 'Admin' : 'User'}
      </Tag>
    ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'active' ? 'green' : 'default'}>
        {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
      </Tag>
    ),
  },
];

// Emotion analysis result table columns
export const getEmotionAnalysisColumns = () => [
  {
    title: 'Cảm xúc',
    dataIndex: 'emotion',
    key: 'emotion',
    render: (emotion: string) => formatEmotion(emotion),
  },
  {
    title: 'Điểm số',
    dataIndex: 'score',
    key: 'score',
    render: (score: number) => `${(score * 100).toFixed(2)}%`,
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={status === 'detected' ? 'green' : 'red'}>
        {status === 'detected' ? 'Phát hiện' : 'Không phát hiện'}
      </Tag>
    ),
  },
]; 