import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Space, Typography, Spin, Select } from 'antd';
import { LineChartOutlined, ThunderboltOutlined, ClockCircleOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getPerformanceStats, getFaceDetectionStats, getUsers } from '../utils/api';
import { User } from '../types/user';

const { Title, Text } = Typography;
const { Option } = Select;

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
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(adminStatus);
    // Admin xem tổng hợp, user thường xem dữ liệu của mình
    if (adminStatus) {
      setSelectedUserId('all');
      fetchUsers();
    } else {
      // User thường lấy user_id của mình từ localStorage
      const currentUserId = localStorage.getItem('user_id');
      setSelectedUserId(currentUserId ? parseInt(currentUserId) : 1);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      // Handle the backend response structure: { success: true, users: [...], total_count: ... }
      const usersArray = Array.isArray(data) ? data : data?.users || [];
      setUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array on error
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Admin có thể chọn xem dữ liệu của user cụ thể hoặc tổng hợp
        const filters = {
          period: 'day',
          userId: selectedUserId,  // Có thể là 'all' hoặc user_id cụ thể
          includeDetails: true
        };
        
        const data = await getPerformanceStats(filters);
        setPerformanceStats(data);
        
        // Tính toán face detection stats từ performance data
        const faceStats: FaceDetectionStats = {
          total_attempts: data.total_analyses || 0,
          successful_detections: data.successful_detections || 0,
          failed_detections: data.failed_detections || 0,
          detection_rate: data.detection_rate || 0,
          failure_rate: data.failed_detections && data.total_analyses ? 
            (data.failed_detections / data.total_analyses) * 100 : 0,
          detection_efficiency: data.detection_rate || 0,
          average_processing_time: data.average_processing_time || 0,
          average_image_quality: data.average_image_quality || 0
        };
        setFaceDetectionStats(faceStats);
      } else {
        // User thường chỉ xem dữ liệu của chính mình
        const data = await getPerformanceStats('day');
        setPerformanceStats(data);
        
        // Tính toán face detection stats từ performance data
        const faceStats: FaceDetectionStats = {
          total_attempts: data.total_analyses || 0,
          successful_detections: data.successful_detections || 0,
          failed_detections: data.failed_detections || 0,
          detection_rate: data.detection_rate || 0,
          failure_rate: data.failed_detections && data.total_analyses ? 
            (data.failed_detections / data.total_analyses) * 100 : 0,
          detection_efficiency: data.detection_rate || 0,
          average_processing_time: data.average_processing_time || 0,
          average_image_quality: data.average_image_quality || 0
        };
        setFaceDetectionStats(faceStats);
      }
    } catch (error) {
      console.error('Error loading performance stats:', error);
      setPerformanceStats(null);
      setFaceDetectionStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ load khi cả isAdmin và selectedUserId đã được set
    if (isAdmin !== undefined && selectedUserId !== undefined) {
      loadStats();
    }
  }, [isAdmin, selectedUserId]);

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
        <Row justify="space-between" align="middle" style={{ marginBottom: '8px' }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <LineChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Báo Cáo Hiệu Suất Hệ Thống
            </Title>
          </Col>
          {isAdmin && (
            <Col>
              <Select
                value={selectedUserId}
                onChange={setSelectedUserId}
                style={{ width: 200 }}
                placeholder="Chọn người dùng"
              >
                <Option value="all">Tất cả người dùng</Option>
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.username}
                  </Option>
                ))}
              </Select>
            </Col>
          )}
        </Row>
        <Text type="secondary">
          Thống kê chi tiết về hiệu suất nhận diện cảm xúc và tối ưu hóa hệ thống
          {isAdmin && selectedUserId === 'all' && (
            <span> - Dữ liệu tổng hợp từ tất cả người dùng</span>
          )}
          {isAdmin && selectedUserId !== 'all' && (
            <span> - Người dùng: {users.find(u => u.id === selectedUserId)?.username}</span>
          )}
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