import { Card, Col, Progress, Row, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatisticCard from '../components/common/StatisticCard';
import { User } from '../types/user';
import { getEmotionStats, getPerformanceStats, getUsers } from '../utils/api';
import { emotionStatsToChartData, formatEmotion, getEmotionColor, getEmotionType } from '../utils/emotionUtils';
import { getProgressStatus } from '../utils/performanceUtils';
import { getUserListColumns } from '../utils/tableUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface AdminStats {
  [key: string]: number;
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
  const [currentPerformanceData, setCurrentPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(adminStatus);
    // Admin xem tổng hợp, user thường xem dữ liệu của mình
    if (adminStatus) {
      setSelectedUserId('all');
    } else {
      // User thường lấy user_id của mình từ localStorage
      const currentUserId = localStorage.getItem('user_id');
      setSelectedUserId(currentUserId ? parseInt(currentUserId) : 1);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Admin lấy thống kê tổng hợp và danh sách users
        const emotionFilters = {
          period: period,
          userId: selectedUserId,  // Lấy đúng theo selectedUserId
          includeDetails: true
        };
        
        const performanceFilters = {
          period: period,
          userId: selectedUserId,  // Lấy đúng theo selectedUserId
          includeDetails: true
        };
        
        const [emotionData, performanceData, usersData] = await Promise.all([
          getEmotionStats(emotionFilters),
          getPerformanceStats(performanceFilters),
          getUsers()
        ]);
        
        // Combine emotion and performance stats
        const combinedStats = {
          ...(emotionData.emotion_stats || {}),
          total_analyses: performanceData.total_analyses || 0,
          successful_detections: performanceData.successful_detections || 0,
          detection_rate: performanceData.detection_rate || 0
        };
        
        setAdminStats(combinedStats);
        setPerformanceData(performanceData);
        // Ensure users is always an array
        const usersArray = Array.isArray(usersData) ? usersData : usersData?.users || [];
        setUsers(usersArray);
        setCurrentStats(combinedStats); // Mặc định hiển thị tất cả
        setCurrentPerformanceData(performanceData); // Mặc định hiển thị tất cả
      } else {
        // User thường lấy thống kê của chính mình
        const [emotionData, performanceData] = await Promise.all([
          getEmotionStats(period),
          getPerformanceStats(period)
        ]);
        
        const combinedStats = {
          ...(emotionData.emotion_stats || {}),
          total_analyses: performanceData.total_analyses || 0,
          successful_detections: performanceData.successful_detections || 0,
          detection_rate: performanceData.detection_rate || 0
        };
        
        setCurrentStats(combinedStats);
        setCurrentPerformanceData(performanceData);
        setAdminStats(combinedStats); // Để tương thích với logic hiện tại
        setUsers([]); // User thường không cần danh sách users
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set default values on error
      setUsers([]);
      setAdminStats({});
      setCurrentStats({});
      setCurrentPerformanceData(null);
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, period, selectedUserId]);

  const fetchAllUsersStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Lấy thống kê tổng hợp cho tất cả users
      const emotionFilters = {
        period: period,
        userId: 'all',  // Lấy tổng hợp
        includeDetails: true
      };
      
      const performanceFilters = {
        period: period,
        userId: 'all',  // Lấy tổng hợp
        includeDetails: true
      };
      
      const [emotionData, performanceData] = await Promise.all([
        getEmotionStats(emotionFilters),
        getPerformanceStats(performanceFilters)
      ]);
      
      // Tạo placeholder stats cho tất cả users (sử dụng dữ liệu tổng hợp)
      const allUsersStats: UserStats[] = [{
        user: {
          id: 0,
          username: 'Tất cả người dùng',
          is_admin: false,
          created_at: new Date().toISOString()
        },
        emotion_stats: emotionData.emotion_stats || {},
        detection_stats: {
          total_analyses: performanceData.total_analyses || 0,
          successful_detections: performanceData.successful_detections || 0,
          failed_detections: performanceData.failed_detections || 0,
          detection_rate: performanceData.detection_rate || 0,
          average_image_quality: performanceData.average_image_quality || 0
        },
        engagement_stats: {
          average_emotion_score: performanceData.average_emotion_score || 0,
          total_emotions_analyzed: performanceData.total_analyses || 0
        }
      }];
      
      setAllUsersStats(allUsersStats);
    } catch (error) {
      console.error('Error fetching all users stats:', error);
      setAllUsersStats([]);
    } finally {
      setStatsLoading(false);
    }
  }, [period]);

  const fetchUserStats = useCallback(async (userId: number) => {
    try {
      // Lấy stats của user cụ thể
      const emotionFilters = {
        period: period,
        userId: userId,
        includeDetails: true
      };
      
      const performanceFilters = {
        period: period,
        userId: userId,
        includeDetails: true
      };
      
      const [emotionData, performanceData] = await Promise.all([
        getEmotionStats(emotionFilters),
        getPerformanceStats(performanceFilters)
      ]);
      
      const combinedStats = {
        ...(emotionData.emotion_stats || {}),
        total_analyses: performanceData.total_analyses || 0,
        successful_detections: performanceData.successful_detections || 0,
        detection_rate: performanceData.detection_rate || 0
      };
      
      setCurrentStats(combinedStats);
      setCurrentPerformanceData(performanceData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Fallback to admin stats if user-specific stats fail
      setCurrentStats(adminStats);
      setCurrentPerformanceData(performanceData);
    }
  }, [period, adminStats, performanceData]);

  useEffect(() => {
    // Chỉ fetch khi cả isAdmin và selectedUserId đã được set
    if (isAdmin !== undefined && selectedUserId !== undefined) {
      fetchData();
      if (isAdmin) {
        fetchAllUsersStats();
      }
    }
  }, [isAdmin, selectedUserId, fetchData, fetchAllUsersStats]);

  useEffect(() => {
    if (selectedUserId === 'all') {
      setCurrentStats(adminStats);
      setCurrentPerformanceData(performanceData);
    } else if (isAdmin) {
      fetchUserStats(selectedUserId);
    }
  }, [selectedUserId, adminStats, isAdmin, fetchUserStats, performanceData]);

  // Tính toán xếp hạng người dùng
  const getUserRankings = () => {
    if (!allUsersStats.length) return [];

    return allUsersStats
      .map(userStat => ({
        username: userStat.user.username,
        totalAnalyses: userStat.detection_stats.total_analyses,
        detectionRate: userStat.detection_stats.detection_rate,
        engagement: userStat.engagement_stats.average_emotion_score,
        totalEmotions: Object.values(userStat.emotion_stats).reduce((sum, count) => sum + count, 0)
      }))
      .sort((a, b) => b.totalAnalyses - a.totalAnalyses)
      .slice(0, 10);
  };

  // Chuyển đổi dữ liệu cho biểu đồ
  const emotionOnlyStats = Object.fromEntries(
    Object.entries(currentStats).filter(([key]) => 
      !['total_analyses', 'successful_detections', 'detection_rate', 'failed_detections', 'average_image_quality'].includes(key)
    )
  );
  const chartData = emotionStatsToChartData(emotionOnlyStats);
  const userRankings = getUserRankings();
  
  // Ensure users is always an array for safety
  const safeUsers = Array.isArray(users) ? users : [];

  if (loading) {
    return <LoadingSpinner message="Đang tải dashboard..." />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Dashboard Quản Trị</Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">
            Thống kê tổng quan về hệ thống nhận diện cảm xúc
          </Text>
          <Space>
            {isAdmin && (
              <Select 
                value={selectedUserId} 
                onChange={setSelectedUserId} 
                style={{ width: 200 }}
                placeholder="Chọn người dùng"
              >
                <Option value="all">Tất cả người dùng</Option>
                {safeUsers.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.username} {user.is_admin ? '(Admin)' : ''}
                  </Option>
                ))}
              </Select>
            )}
            <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
              <Option value="day">Hôm nay</Option>
              <Option value="week">Tuần này</Option>
              <Option value="month">Tháng này</Option>
              <Option value="year">Năm nay</Option>
            </Select>
          </Space>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <StatisticCard
            title="Tổng phân tích"
            value={currentPerformanceData?.total_analyses || currentStats?.total_analyses || 0}
            suffix="lần"
            color="#1890ff"
          />
        </Col>
        <Col span={6}>
          <StatisticCard
            title="Người dùng hoạt động"
            value={selectedUserId === 'all' ? safeUsers.filter(user => !user.is_admin).length : 1}
            suffix="người"
            color="#52c41a"
          />
        </Col>
        <Col span={6}>
          <StatisticCard
            title="Phát hiện thành công"
            value={currentPerformanceData?.successful_detections || currentStats?.successful_detections || 0}
            suffix="lần"
            color="#faad14"
          />
        </Col>
        <Col span={6}>
          <StatisticCard
            title="Tỷ lệ thành công"
            value={currentPerformanceData?.detection_rate || currentStats?.detection_rate || 0}
            suffix="%"
            precision={1}
            color="#722ed1"
          />
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" style={{ marginBottom: '24px' }}>
        <TabPane tab="Biểu Đồ Cảm Xúc" key="1">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Phân Bố Cảm Xúc">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${formatEmotion(name)} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, formatEmotion(name as string)]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">Chưa có dữ liệu phân tích cảm xúc</Text>
                  </div>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="So Sánh Cảm Xúc">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedName" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [value, 'Số lần']} />
                      <Bar dataKey="value" fill="#8884d8">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Text type="secondary">Chưa có dữ liệu phân tích cảm xúc</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Xếp Hạng Người Dùng" key="2">
          <Card>
            {statsLoading ? (
              <LoadingSpinner message="Đang tải xếp hạng..." />
            ) : (
              <Table
                dataSource={userRankings}
                columns={[
                  {
                    title: 'Hạng',
                    dataIndex: 'rank',
                    key: 'rank',
                    width: 80,
                    render: (_, __, index) => (
                      <Tag color={index < 3 ? ['gold', 'silver', 'bronze'][index] : 'default'}>
                        #{index + 1}
                      </Tag>
                    )
                  },
                  {
                    title: 'Tên người dùng',
                    dataIndex: 'username',
                    key: 'username',
                  },
                  {
                    title: 'Tổng phân tích',
                    dataIndex: 'totalAnalyses',
                    key: 'totalAnalyses',
                    sorter: (a, b) => a.totalAnalyses - b.totalAnalyses,
                  },
                  {
                    title: 'Tỷ lệ phát hiện',
                    dataIndex: 'detectionRate',
                    key: 'detectionRate',
                    render: (rate) => (
                      <Progress 
                        percent={rate} 
                        size="small" 
                        status={getProgressStatus(rate, 'detection')}
                      />
                    ),
                    sorter: (a, b) => a.detectionRate - b.detectionRate,
                  },
                  {
                    title: 'Độ tương tác',
                    dataIndex: 'engagement',
                    key: 'engagement',
                    render: (engagement) => `${(engagement * 100).toFixed(1)}%`,
                    sorter: (a, b) => a.engagement - b.engagement,
                  }
                ]}
                rowKey="username"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Quản Lý Người Dùng" key="3">
          <Card>
            <Table
              dataSource={safeUsers}
              columns={getUserListColumns()}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Thống kê chi tiết */}
      <Row gutter={24}>
        <Col span={12}>
          <Card title="Phân Loại Cảm Xúc">
            <div style={{ padding: '20px' }}>
              {Object.entries(emotionOnlyStats).filter(([key, value]) => value > 0).map(([emotion, count]) => (
                <div key={emotion} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>{formatEmotion(emotion)}</Text>
                    <Text strong style={{ color: getEmotionColor(emotion) }}>
                      {count} lần
                    </Text>
                  </div>
                  <Progress 
                    percent={(count / Math.max(...Object.values(emotionOnlyStats).filter(v => v > 0))) * 100} 
                    strokeColor={getEmotionColor(emotion)}
                    showInfo={false}
                  />
                  <Tag 
                    color={getEmotionType(emotion) === 'positive' ? 'green' : 
                           getEmotionType(emotion) === 'negative' ? 'red' : 'default'}
                    style={{ marginTop: '4px' }}
                  >
                    {getEmotionType(emotion) === 'positive' ? 'Tích cực' : 
                     getEmotionType(emotion) === 'negative' ? 'Tiêu cực' : 'Trung tính'}
                  </Tag>
                </div>
              ))}
              {Object.entries(emotionOnlyStats).filter(([key, value]) => value > 0).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chưa có dữ liệu phân tích cảm xúc</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Thống Kê Hệ Thống">
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <Text strong>Tổng số phân tích</Text>
                <Progress 
                  percent={currentPerformanceData?.total_analyses ? Math.min(100, (currentPerformanceData.total_analyses / 200) * 100) : 0} 
                  status="active" 
                  style={{ marginTop: '8px' }} 
                  showInfo={false}
                />
                <Text type="secondary">{currentPerformanceData?.total_analyses || 0} lần</Text>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <Text strong>Tỷ lệ phát hiện</Text>
                <Progress 
                  percent={currentPerformanceData?.detection_rate || 0} 
                  status="active" 
                  style={{ marginTop: '8px' }} 
                  showInfo={false}
                />
                <Text type="secondary">{(currentPerformanceData?.detection_rate || 0).toFixed(1)}%</Text>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <Text strong>Chất lượng ảnh trung bình</Text>
                <Progress 
                  percent={currentPerformanceData?.average_image_quality || 0} 
                  status="active" 
                  style={{ marginTop: '8px' }} 
                  showInfo={false}
                />
                <Text type="secondary">{(currentPerformanceData?.average_image_quality || 0).toFixed(2)}%</Text>
              </div>
              <div>
                <Text strong>Độ tương tác trung bình</Text>
                <Progress 
                  percent={currentPerformanceData?.average_emotion_score || 0} 
                  status="success" 
                  style={{ marginTop: '8px' }} 
                  showInfo={false}
                />
                <Text type="secondary">{(currentPerformanceData?.average_emotion_score || 0).toFixed(2)}%</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
