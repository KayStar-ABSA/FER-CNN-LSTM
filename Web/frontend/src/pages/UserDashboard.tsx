import React, { useEffect, useState } from 'react';
import { Card, Typography, Radio, Space, List, Statistic, Row, Col, Progress, message, Button } from 'antd';
import { getStats, createSampleData } from '../utils/api';

const { Title, Text } = Typography;

const periods = [
  { label: 'Ngày', value: 'day' },
  { label: 'Tuần', value: 'week' },
  { label: 'Tháng', value: 'month' },
  { label: 'Năm', value: 'year' },
];

const UserDashboard: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getStats(period);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  // Tính tổng để tính phần trăm
  const total = Object.values(stats).reduce((sum, count) => sum + Number(count), 0);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Thống kê cảm xúc cá nhân
        </Title>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Radio.Group 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="large"
          >
            {periods.map(p => (
              <Radio.Button key={p.value} value={p.value}>
                {p.label}
              </Radio.Button>
            ))}
          </Radio.Group>
          
          <div style={{ marginTop: 16 }}>
            <Button 
              type="dashed" 
              onClick={async () => {
                try {
                  await createSampleData();
                  message.success('Đã tạo dữ liệu mẫu!');
                  fetchStats();
                } catch (error) {
                  message.error('Không thể tạo dữ liệu mẫu');
                }
              }}
            >
              Tạo dữ liệu mẫu
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text type="secondary">Đang tải dữ liệu...</Text>
          </div>
        ) : Object.keys(stats).length > 0 ? (
          <div style={{ marginBottom: 32 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Biểu đồ phân bố:</Title>
            {Object.entries(stats).map(([emotion, count]) => {
              const percentage = total > 0 ? (Number(count) / total) * 100 : 0;
              return (
                <div key={emotion} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong>{emotion}</Text>
                    <Text>{String(count)} ({percentage.toFixed(1)}%)</Text>
                  </div>
                  <Progress 
                    percent={percentage} 
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    showInfo={false}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text type="secondary">Không có dữ liệu</Text>
          </div>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Title level={5} style={{ marginBottom: 16 }}>Chi tiết:</Title>
            <List
              size="small"
              dataSource={Object.entries(stats)}
              renderItem={([emotion, count]) => (
                <List.Item>
                  <Space>
                    <Text strong>{String(emotion)}:</Text>
                    <Statistic value={Number(count)} />
                  </Space>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default UserDashboard; 