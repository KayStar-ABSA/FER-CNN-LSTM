import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Row, Col, Statistic, Progress, Table, Space, Spin, Alert, Tabs } from 'antd';
import { getAdminStats, getUsers } from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface AdminStats {
  [key: string]: number;
}

interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

const AdminDashboard: React.FC = () => {
  const [period, setPeriod] = useState('day');
  const [adminStats, setAdminStats] = useState<AdminStats>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stats, usersData] = await Promise.all([
        getAdminStats(period),
        getUsers()
      ]);
      
      setAdminStats(stats);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const formatEmotion = (emotion: string) => {
    const emotionMap: { [key: string]: string } = {
      'happy': 'Vui vẻ',
      'sad': 'Buồn bã',
      'angry': 'Tức giận',
      'surprised': 'Ngạc nhiên',
      'fear': 'Sợ hãi',
      'disgust': 'Ghê tởm',
      'neutral': 'Bình thường',
      'no_face_detected': 'Không phát hiện khuôn mặt'
    };
    return emotionMap[emotion] || emotion;
  };

  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
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
        <span style={{ 
          color: isAdmin ? '#cf1322' : '#3f8600',
          fontWeight: 'bold'
        }}>
          {isAdmin ? 'Admin' : 'User'}
        </span>
      )
    }
  ];

  const totalEmotions = Object.values(adminStats).reduce((sum, count) => sum + count, 0);
  const topEmotion = Object.entries(adminStats).sort(([,a], [,b]) => b - a)[0];
  const topEmotionName = topEmotion ? formatEmotion(topEmotion[0]) : 'N/A';
  const topEmotionCount = topEmotion ? topEmotion[1] : 0;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3}>Admin Dashboard</Title>
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
            <Option value="day">Hôm nay</Option>
            <Option value="week">Tuần này</Option>
            <Option value="month">Tháng này</Option>
            <Option value="year">Năm nay</Option>
          </Select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Đang tải dữ liệu...</Text>
            </div>
          </div>
        ) : (
          <Tabs defaultActiveKey="overview" size="large">
            <TabPane tab="Tổng quan" key="overview">
              {/* Thống kê tổng quan */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng cảm xúc"
                      value={totalEmotions}
                      suffix="lần phân tích"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Người dùng"
                      value={users.length}
                      suffix="tài khoản"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Cảm xúc phổ biến"
                      value={topEmotionCount}
                      suffix={topEmotionName}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Loại cảm xúc"
                      value={Object.keys(adminStats).length}
                      suffix="loại"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Thống kê cảm xúc */}
              <Row gutter={24}>
                <Col span={12}>
                  <Card title="Phân bố cảm xúc tổng thể" style={{ height: 400 }}>
                    {Object.keys(adminStats).length > 0 ? (
                      <div style={{ padding: '20px' }}>
                        {Object.entries(adminStats).map(([emotion, count]) => (
                          <div key={emotion} style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <Text>{formatEmotion(emotion)}</Text>
                              <Text strong>{count} lần</Text>
                            </div>
                            <Progress 
                              percent={totalEmotions > 0 ? (count / totalEmotions) * 100 : 0} 
                              size="small"
                              status="active"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Text type="secondary">Chưa có dữ liệu cảm xúc</Text>
                      </div>
                    )}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Top cảm xúc" style={{ height: 400 }}>
                    {Object.keys(adminStats).length > 0 ? (
                      <div style={{ padding: '20px' }}>
                        {Object.entries(adminStats)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([emotion, count], index) => (
                            <div key={emotion} style={{ marginBottom: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Text>{index + 1}. {formatEmotion(emotion)}</Text>
                                <Text strong>{count} lần</Text>
                              </div>
                              <Progress 
                                percent={totalEmotions > 0 ? (count / totalEmotions) * 100 : 0} 
                                size="small"
                                status="active"
                              />
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Text type="secondary">Chưa có dữ liệu</Text>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="Người dùng" key="users">
              <Card title="Danh sách người dùng">
                <Table 
                  dataSource={users} 
                  columns={userColumns} 
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </TabPane>

            <TabPane tab="Chi tiết cảm xúc" key="emotions">
              <Card title="Thống kê chi tiết từng cảm xúc">
                <Row gutter={16}>
                  {Object.entries(adminStats).map(([emotion, count]) => (
                    <Col span={8} key={emotion} style={{ marginBottom: 16 }}>
                      <Card size="small">
                        <Statistic
                          title={formatEmotion(emotion)}
                          value={count}
                          suffix="lần"
                          valueStyle={{ 
                            color: count > totalEmotions * 0.2 ? '#3f8600' : 
                                   count > totalEmotions * 0.1 ? '#faad14' : '#cf1322'
                          }}
                        />
                        <Progress 
                          percent={totalEmotions > 0 ? (count / totalEmotions) * 100 : 0} 
                          size="small"
                          status={count > totalEmotions * 0.2 ? 'success' : 'active'}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </TabPane>
          </Tabs>
        )}

        {/* Thông tin hệ thống */}
        <Card style={{ marginTop: 24 }}>
          <Title level={4}>Thông tin hệ thống</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Phiên bản:</Text> <Text>1.0.0</Text>
            </Col>
            <Col span={8}>
              <Text strong>Database:</Text> <Text>SQLite</Text>
            </Col>
            <Col span={8}>
              <Text strong>Model:</Text> <Text>CNN-LSTM</Text>
            </Col>
          </Row>
        </Card>
      </Card>
    </div>
  );
};

export default AdminDashboard; 