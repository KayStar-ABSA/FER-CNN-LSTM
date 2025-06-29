import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Space, Typography, Spin } from 'antd';
import { LineChartOutlined, ThunderboltOutlined, ClockCircleOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getPerformanceStats, getFaceDetectionStats } from '../utils/api';

const { Title, Text } = Typography;

interface PerformanceStats {
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  average_image_quality: number;
  average_emotion_score: number;
  average_fps: number;
  average_processing_time: number;
  total_sessions: number;
}

interface FaceDetectionStats {
  total_attempts: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  failure_rate: number;
  detection_efficiency: number;
  average_processing_time: number;
  average_image_quality: number;
}

const PerformanceReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [faceDetectionStats, setFaceDetectionStats] = useState<FaceDetectionStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [performanceData, faceDetectionData] = await Promise.all([
        getPerformanceStats('day'),
        getFaceDetectionStats('day')
      ]);
      
      if (performanceData.success) {
        setPerformanceStats(performanceData);
      }
      
      if (faceDetectionData.success) {
        setFaceDetectionStats(faceDetectionData);
      }
    } catch (error) {
      console.error('Error loading performance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressStatus = (value: number, type: string) => {
    switch (type) {
      case 'detection':
        return value >= 80 ? 'success' : value >= 60 ? 'normal' : 'exception';
      case 'fps':
        return value >= 10 ? 'success' : value >= 5 ? 'normal' : 'exception';
      case 'processing':
        return value <= 500 ? 'success' : value <= 1000 ? 'normal' : 'exception';
      default:
        return 'normal';
    }
  };

  const getPerformanceColor = (value: number, type: string) => {
    switch (type) {
      case 'detection':
        return value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f';
      case 'fps':
        return value >= 10 ? '#52c41a' : value >= 5 ? '#faad14' : '#ff4d4f';
      case 'processing':
        return value <= 500 ? '#52c41a' : value <= 1000 ? '#faad14' : '#ff4d4f';
      default:
        return '#1890ff';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Đang tải thống kê hiệu suất...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <LineChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Báo Cáo Hiệu Suất Hệ Thống
        </Title>
        <Text type="secondary">
          Thống kê chi tiết về hiệu suất nhận diện cảm xúc và tối ưu hóa hệ thống
        </Text>
      </div>

      {/* Performance Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng phân tích"
              value={faceDetectionStats?.total_attempts || performanceStats?.total_analyses || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Phát hiện thành công"
              value={faceDetectionStats?.successful_detections || performanceStats?.successful_detections || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Không phát hiện"
              value={faceDetectionStats?.failed_detections || performanceStats?.failed_detections || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tỷ lệ phát hiện"
              value={faceDetectionStats?.detection_rate || performanceStats?.detection_rate || 0}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: getPerformanceColor(faceDetectionStats?.detection_rate || 0, 'detection') }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Hiệu suất phát hiện khuôn mặt" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Tỷ lệ phát hiện:</Text>
                <Progress
                  percent={faceDetectionStats?.detection_rate || 0}
                  status={getProgressStatus(faceDetectionStats?.detection_rate || 0, 'detection')}
                  format={(percent) => `${percent?.toFixed(1)}%`}
                />
              </div>
              <div>
                <Text strong>Tỷ lệ thất bại:</Text>
                <Progress
                  percent={faceDetectionStats?.failure_rate || 0}
                  status="exception"
                  format={(percent) => `${percent?.toFixed(1)}%`}
                  strokeColor="#ff4d4f"
                />
              </div>
              <div>
                <Text strong>Hiệu quả phát hiện:</Text>
                <Progress
                  percent={faceDetectionStats?.detection_efficiency || 0}
                  status={getProgressStatus(faceDetectionStats?.detection_efficiency || 0, 'detection')}
                  format={(percent) => `${percent?.toFixed(1)}%`}
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Hiệu suất xử lý" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>FPS trung bình:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Progress
                    percent={Math.min((faceDetectionStats?.average_processing_time || 0) * 10, 100)}
                    status={getProgressStatus(1000 / (faceDetectionStats?.average_processing_time || 1), 'fps')}
                    format={() => `${(1000 / (faceDetectionStats?.average_processing_time || 1)).toFixed(1)} FPS`}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div>
                <Text strong>Thời gian xử lý trung bình:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Progress
                    percent={Math.max(0, 100 - (faceDetectionStats?.average_processing_time || 0) / 10)}
                    status={getProgressStatus(faceDetectionStats?.average_processing_time || 0, 'processing')}
                    format={() => `${(faceDetectionStats?.average_processing_time || 0).toFixed(0)}ms`}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div>
                <Text strong>Chất lượng ảnh trung bình:</Text>
                <Progress
                  percent={(faceDetectionStats?.average_image_quality || 0) * 100}
                  status="normal"
                  format={(percent) => `${percent?.toFixed(1)}%`}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Summary */}
      <Card title="Tóm tắt hiệu suất" size="small">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#52c41a' }}>
                {faceDetectionStats?.detection_rate?.toFixed(1) || '0'}%
              </Title>
              <Text type="secondary">Tỷ lệ phát hiện thành công</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#1890ff' }}>
                {faceDetectionStats?.total_attempts || '0'}
              </Title>
              <Text type="secondary">Tổng số lần phân tích</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#faad14' }}>
                {(1000 / (faceDetectionStats?.average_processing_time || 1)).toFixed(1)}
              </Title>
              <Text type="secondary">FPS trung bình</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PerformanceReportPage; 