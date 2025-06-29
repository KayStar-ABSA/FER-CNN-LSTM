import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, DatePicker, Table, Progress, Tag, Spin, Alert } from 'antd';
import { 
  ClockCircleOutlined, 
  EyeOutlined, 
  ThunderboltOutlined, 
  DatabaseOutlined,
  LineChartOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { getPerformanceStats, getUserSessions } from '../utils/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface PerformanceStats {
  avg_processing_time: number;
  avg_fps: number;
  avg_detection_rate: number;
  total_cache_hits: number;
  avg_cache_hit_rate: number;
  total_analyses: number;
}

interface SessionData {
  id: number;
  session_start: string;
  session_end: string;
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  avg_processing_time: number;
  avg_fps: number;
  total_cache_hits: number;
  cache_hit_rate: number;
}

const PerformanceReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [period, setPeriod] = useState('week');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, sessionsData] = await Promise.all([
        getPerformanceStats(period),
        getUserSessions()
      ]);
      setPerformanceStats(statsData);
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const getPerformanceColor = (value: number, type: 'fps' | 'processing' | 'detection' | 'cache') => {
    switch (type) {
      case 'fps':
        return value >= 10 ? '#52c41a' : value >= 5 ? '#faad14' : '#f5222d';
      case 'processing':
        return value <= 500 ? '#52c41a' : value <= 1000 ? '#faad14' : '#f5222d';
      case 'detection':
        return value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#f5222d';
      case 'cache':
        return value >= 70 ? '#52c41a' : value >= 40 ? '#faad14' : '#f5222d';
      default:
        return '#1890ff';
    }
  };

  const getPerformanceStatus = (value: number, type: 'fps' | 'processing' | 'detection' | 'cache') => {
    switch (type) {
      case 'fps':
        return value >= 10 ? 'Tuyệt vời' : value >= 5 ? 'Khá' : 'Cần cải thiện';
      case 'processing':
        return value <= 500 ? 'Tuyệt vời' : value <= 1000 ? 'Khá' : 'Cần cải thiện';
      case 'detection':
        return value >= 80 ? 'Tuyệt vời' : value >= 60 ? 'Khá' : 'Cần cải thiện';
      case 'cache':
        return value >= 70 ? 'Tuyệt vời' : value >= 40 ? 'Khá' : 'Cần cải thiện';
      default:
        return 'Bình thường';
    }
  };

  const sessionColumns = [
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
          status={value >= 80 ? 'success' : value >= 60 ? 'normal' : 'exception'}
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
          status={value >= 70 ? 'success' : value >= 40 ? 'normal' : 'exception'}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>Đang tải báo cáo hiệu suất...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '8px' }}>
          <LineChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Báo Cáo Hiệu Suất Hệ Thống
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Thống kê chi tiết về hiệu suất nhận diện cảm xúc và tối ưu hóa hệ thống
        </p>
      </div>

      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>
            <TrophyOutlined style={{ marginRight: '8px', color: '#faad14' }} />
            Tổng Quan Hiệu Suất
          </h3>
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
            <Option value="day">Hôm nay</Option>
            <Option value="week">Tuần này</Option>
            <Option value="month">Tháng này</Option>
          </Select>
        </div>

        {performanceStats && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="FPS Trung Bình"
                  value={performanceStats.avg_fps}
                  precision={1}
                  valueStyle={{ color: getPerformanceColor(performanceStats.avg_fps, 'fps') }}
                  prefix={<ThunderboltOutlined />}
                  suffix="FPS"
                />
                <div style={{ marginTop: '8px' }}>
                  <Tag color={getPerformanceColor(performanceStats.avg_fps, 'fps')}>
                    {getPerformanceStatus(performanceStats.avg_fps, 'fps')}
                  </Tag>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Thời Gian Xử Lý"
                  value={performanceStats.avg_processing_time}
                  precision={0}
                  valueStyle={{ color: getPerformanceColor(performanceStats.avg_processing_time, 'processing') }}
                  prefix={<ClockCircleOutlined />}
                  suffix="ms"
                />
                <div style={{ marginTop: '8px' }}>
                  <Tag color={getPerformanceColor(performanceStats.avg_processing_time, 'processing')}>
                    {getPerformanceStatus(performanceStats.avg_processing_time, 'processing')}
                  </Tag>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Tỷ Lệ Phát Hiện"
                  value={performanceStats.avg_detection_rate}
                  precision={1}
                  valueStyle={{ color: getPerformanceColor(performanceStats.avg_detection_rate, 'detection') }}
                  prefix={<EyeOutlined />}
                  suffix="%"
                />
                <div style={{ marginTop: '8px' }}>
                  <Tag color={getPerformanceColor(performanceStats.avg_detection_rate, 'detection')}>
                    {getPerformanceStatus(performanceStats.avg_detection_rate, 'detection')}
                  </Tag>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Cache Hit Rate"
                  value={performanceStats.avg_cache_hit_rate}
                  precision={1}
                  valueStyle={{ color: getPerformanceColor(performanceStats.avg_cache_hit_rate, 'cache') }}
                  prefix={<DatabaseOutlined />}
                  suffix="%"
                />
                <div style={{ marginTop: '8px' }}>
                  <Tag color={getPerformanceColor(performanceStats.avg_cache_hit_rate, 'cache')}>
                    {getPerformanceStatus(performanceStats.avg_cache_hit_rate, 'cache')}
                  </Tag>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      <Card>
        <h3 style={{ marginBottom: '16px' }}>
          <DatabaseOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Chi Tiết Các Phiên Phân Tích
        </h3>
        
        {performanceStats && (
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Tổng Số Phân Tích"
                  value={performanceStats.total_analyses}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tổng Cache Hits"
                  value={performanceStats.total_cache_hits}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Số Phiên"
                  value={sessions.length}
                  prefix={<LineChartOutlined />}
                />
              </Col>
            </Row>
          </div>
        )}

        <Table
          dataSource={sessions}
          columns={sessionColumns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} phiên`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>
          <WarningOutlined style={{ marginRight: '8px', color: '#faad14' }} />
          Khuyến Nghị Tối Ưu Hóa
        </h3>
        
        {performanceStats && (
          <div>
            {performanceStats.avg_fps < 5 && (
              <Alert
                message="FPS thấp"
                description="FPS hiện tại khá thấp. Khuyến nghị: Giảm độ phân giải camera, tăng khoảng thời gian phân tích, hoặc tối ưu hóa model."
                type="warning"
                showIcon
                style={{ marginBottom: '12px' }}
              />
            )}
            
            {performanceStats.avg_processing_time > 1000 && (
              <Alert
                message="Thời gian xử lý cao"
                description="Thời gian xử lý trung bình khá cao. Khuyến nghị: Giảm kích thước ảnh đầu vào, tối ưu hóa face detection parameters."
                type="warning"
                showIcon
                style={{ marginBottom: '12px' }}
              />
            )}
            
            {performanceStats.avg_detection_rate < 60 && (
              <Alert
                message="Tỷ lệ phát hiện thấp"
                description="Tỷ lệ phát hiện khuôn mặt thấp. Khuyến nghị: Cải thiện ánh sáng, điều chỉnh góc camera, hoặc tối ưu hóa face detection."
                type="warning"
                showIcon
                style={{ marginBottom: '12px' }}
              />
            )}
            
            {performanceStats.avg_cache_hit_rate < 40 && (
              <Alert
                message="Cache hit rate thấp"
                description="Tỷ lệ cache hit thấp. Khuyến nghị: Tăng kích thước cache, tối ưu hóa thuật toán cache, hoặc điều chỉnh cache key strategy."
                type="info"
                showIcon
                style={{ marginBottom: '12px' }}
              />
            )}
            
            {performanceStats.avg_fps >= 10 && performanceStats.avg_processing_time <= 500 && performanceStats.avg_detection_rate >= 80 && (
              <Alert
                message="Hiệu suất tuyệt vời"
                description="Hệ thống đang hoạt động với hiệu suất tối ưu. Tiếp tục duy trì các thiết lập hiện tại."
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PerformanceReportPage; 