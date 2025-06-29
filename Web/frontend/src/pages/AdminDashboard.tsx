import { Card, Col, Progress, Row, Select, Spin, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis, Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';
import { API_BASE_URL } from '../constants';
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

interface UserStats {
  user: User;
  emotion_stats: { [key: string]: number };
  detection_stats: {
    total_analyses: number;
    successful_detections: number;
    failed_detections: number;
    detection_rate: number;
    average_image_quality: number;
  };
  engagement_stats: {
    average_emotion_score: number;
    total_emotions_analyzed: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [period, setPeriod] = useState('day');
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all');
  const [adminStats, setAdminStats] = useState<AdminStats>({});
  const [users, setUsers] = useState<User[]>([]);
  const [allUsersStats, setAllUsersStats] = useState<UserStats[]>([]);
  const [currentStats, setCurrentStats] = useState<AdminStats>({});
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Kiểm tra quyền admin
  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(adminStatus);
    if (!adminStatus) {
      setSelectedUserId('all'); // User thường chỉ xem dữ liệu của mình
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Admin lấy thống kê tổng hợp và danh sách users
        const [stats, usersData] = await Promise.all([
          getAdminStats(period),
          getUsers()
        ]);
        
        setAdminStats(stats);
        setUsers(usersData);
        setCurrentStats(stats); // Mặc định hiển thị tất cả
      } else {
        // User thường lấy thống kê của chính mình
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/stats/${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const userStats = await response.json();
          setCurrentStats(userStats);
          setAdminStats(userStats); // Để tương thích với logic hiện tại
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsersStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/all-users-stats/${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAllUsersStats(data);
      }
    } catch (error) {
      console.error('Error fetching all users stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUserStats = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/user-stats/${userId}/${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentStats(data.emotion_stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      fetchAllUsersStats();
    }
  }, [period, isAdmin]);

  useEffect(() => {
    if (selectedUserId === 'all') {
      setCurrentStats(adminStats);
    } else if (isAdmin) {
      fetchUserStats(selectedUserId);
    }
  }, [selectedUserId, adminStats, isAdmin]);

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

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      'happy': '#52c41a',
      'sad': '#1890ff',
      'angry': '#f5222d',
      'surprised': '#fa8c16',
      'fear': '#722ed1',
      'disgust': '#eb2f96',
      'neutral': '#8c8c8c',
      'no_face_detected': '#d9d9d9'
    };
    return colorMap[emotion] || '#1890ff';
  };

  const getEmotionType = (emotion: string) => {
    const positiveEmotions = ['happy', 'surprised'];
    const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
    
    if (positiveEmotions.includes(emotion)) return 'positive';
    if (negativeEmotions.includes(emotion)) return 'negative';
    return 'neutral';
  };

  // Tính toán xếp hạng người dùng
  const getUserRankings = () => {
    if (!allUsersStats.length) return [];

    return allUsersStats.map(stats => {
      const positiveEmotions = Object.entries(stats.emotion_stats).filter(([emotion]) => 
        getEmotionType(emotion) === 'positive'
      );
      const negativeEmotions = Object.entries(stats.emotion_stats).filter(([emotion]) => 
        getEmotionType(emotion) === 'negative'
      );

      const totalPositive = positiveEmotions.reduce((sum, [, count]) => sum + count, 0);
      const totalNegative = negativeEmotions.reduce((sum, [, count]) => sum + count, 0);
      const totalEmotions = Object.values(stats.emotion_stats).reduce((sum, count) => sum + count, 0);

      const positiveRate = totalEmotions > 0 ? (totalPositive / totalEmotions) * 100 : 0;
      const negativeRate = totalEmotions > 0 ? (totalNegative / totalEmotions) * 100 : 0;

      return {
        user: stats.user,
        totalEmotions,
        positiveRate,
        negativeRate,
        detectionRate: stats.detection_stats.detection_rate,
        avgEngagement: stats.engagement_stats.average_emotion_score
      };
    }).sort((a, b) => b.positiveRate - a.positiveRate); // Sắp xếp theo tỷ lệ tích cực
  };

  const emotionData = Object.entries(currentStats).map(([emotion, count]) => ({
    name: formatEmotion(emotion),
    value: count,
    color: getEmotionColor(emotion)
  }));

  const radarData = Object.entries(currentStats).map(([emotion, count]) => ({
    emotion: formatEmotion(emotion),
    count: count,
    fullMark: Math.max(...Object.values(currentStats))
  }));

  const barData = Object.entries(currentStats).map(([emotion, count]) => ({
    emotion: formatEmotion(emotion),
    count: count,
    color: getEmotionColor(emotion)
  }));

  const userRankings = getUserRankings();

  const rankingColumns = [
    {
      title: 'Xếp hạng',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <Tag color={index < 3 ? ['gold', 'silver', 'bronze'][index] : 'default'}>
          #{index + 1}
        </Tag>
      )
    },
    {
      title: 'Người dùng',
      dataIndex: 'user',
      key: 'username',
      render: (user: User) => user.username
    },
    {
      title: 'Tổng cảm xúc',
      dataIndex: 'totalEmotions',
      key: 'totalEmotions',
      render: (value: number) => value.toLocaleString()
    },
    {
      title: 'Tỷ lệ tích cực',
      dataIndex: 'positiveRate',
      key: 'positiveRate',
      render: (value: number) => (
        <Progress 
          percent={Math.round(value)} 
          size="small" 
          strokeColor="#52c41a"
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: 'Tỷ lệ tiêu cực',
      dataIndex: 'negativeRate',
      key: 'negativeRate',
      render: (value: number) => (
        <Progress 
          percent={Math.round(value)} 
          size="small" 
          strokeColor="#f5222d"
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: 'Tỷ lệ phát hiện',
      dataIndex: 'detectionRate',
      key: 'detectionRate',
      render: (value: number) => (
        <Progress 
          percent={Math.round(value)} 
          size="small" 
          strokeColor="#1890ff"
          format={(percent) => `${percent}%`}
        />
      )
    },
    {
      title: 'Điểm tương tác TB',
      dataIndex: 'avgEngagement',
      key: 'avgEngagement',
      render: (value: number) => value.toFixed(2)
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{isAdmin ? 'Dashboard Quản trị' : 'Dashboard Cá nhân'}</Title>
      
      {/* Bộ lọc */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Text strong>Thời gian:</Text>
            <Select 
              value={period} 
              onChange={setPeriod}
              style={{ width: '100%', marginLeft: '8px' }}
            >
              <Option value="hour">Giờ qua</Option>
              <Option value="day">Ngày qua</Option>
              <Option value="week">Tuần qua</Option>
              <Option value="month">Tháng qua</Option>
            </Select>
          </Col>
          {isAdmin && (
            <Col span={6}>
              <Text strong>Người dùng:</Text>
              <Select 
                value={selectedUserId} 
                onChange={setSelectedUserId}
                style={{ width: '100%', marginLeft: '8px' }}
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
      </Card>

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng phân tích"
              value={Object.values(currentStats).reduce((sum, count) => sum + count, 0)}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cảm xúc tích cực"
              value={Object.entries(currentStats).filter(([emotion]) => 
                getEmotionType(emotion) === 'positive'
              ).reduce((sum, [, count]) => sum + count, 0)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cảm xúc tiêu cực"
              value={Object.entries(currentStats).filter(([emotion]) => 
                getEmotionType(emotion) === 'negative'
              ).reduce((sum, [, count]) => sum + count, 0)}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cảm xúc trung tính"
              value={Object.entries(currentStats).filter(([emotion]) => 
                getEmotionType(emotion) === 'neutral'
              ).reduce((sum, [, count]) => sum + count, 0)}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ */}
      <Tabs defaultActiveKey="1">
        <TabPane tab="Biểu đồ thống kê" key="1">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card title="Biểu đồ tròn">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={emotionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {emotionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card title="Biểu đồ cột">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotion" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1890ff">
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card title="Biểu đồ radar">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="emotion" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Số lượng"
                      dataKey="count"
                      stroke="#1890ff"
                      fill="#1890ff"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {isAdmin && (
          <TabPane tab="Xếp hạng người dùng" key="2">
            <Card>
              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>Đang tải xếp hạng...</div>
                </div>
              ) : (
                <Table
                  dataSource={userRankings}
                  columns={rankingColumns}
                  rowKey={(record) => record.user.id}
                  pagination={{ pageSize: 10 }}
                />
              )}
            </Card>
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
