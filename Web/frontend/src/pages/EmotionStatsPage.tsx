import React, { useEffect, useState } from 'react';
import { Alert, Card, Col, Progress, Row, Select, Space, Spin, Statistic, Table, Tag, Typography, message } from 'antd';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { getDetectionStats, getEngagementStats, getStats, getUserSessions } from '../utils/api';
import { API_BASE_URL } from '../constants';

const { Title, Text } = Typography;
const { Option } = Select;

interface EmotionStats {
  [key: string]: number;
}

interface DetectionStats {
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  average_image_quality: number;
}

interface EngagementStats {
  average_emotion_score: number;
  total_emotions_analyzed: number;
}

interface UserSession {
  id: number;
  session_start: string;
  session_end: string | null;
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  emotions_summary: { [key: string]: number } | null;
  average_engagement: number | null;
  camera_resolution: string | null;
  analysis_interval: number | null;
}

interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

const EmotionStatsPage: React.FC = () => {
  const [period, setPeriod] = useState('day');
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all');
  const [emotionStats, setEmotionStats] = useState<EmotionStats>({});
  const [detectionStats, setDetectionStats] = useState<DetectionStats | null>(null);
  const [engagementStats, setEngagementStats] = useState<EngagementStats | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Kiểm tra quyền admin
  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(adminStatus);
    if (!adminStatus) {
      setSelectedUserId('all'); // User thường chỉ xem dữ liệu của mình
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập để xem thống kê');
        return;
      }

      let emotionResponse, detectionResponse, engagementResponse;

      if (selectedUserId === 'all') {
        // Lấy thống kê tổng hợp cho admin hoặc thống kê cá nhân cho user thường
        if (isAdmin) {
          [emotionResponse, detectionResponse, engagementResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/stats/${period}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/detection-stats/${period}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/engagement-stats/${period}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);
        } else {
          // User thường xem thống kê của mình
          [emotionResponse, detectionResponse, engagementResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/stats/${period}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/detection-stats/${period}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/engagement-stats/${period}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);
        }
      } else {
        // Lấy thống kê của user cụ thể (chỉ admin mới có thể làm điều này)
        const userStatsResponse = await fetch(`${API_BASE_URL}/admin/user-stats/${selectedUserId}/${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (userStatsResponse.ok) {
          const userStatsData = await userStatsResponse.json();
          setEmotionStats(userStatsData.emotion_stats);
          setDetectionStats(userStatsData.detection_stats);
          setEngagementStats(userStatsData.engagement_stats);
        }
      }

      // Lấy sessions (chỉ cho user hiện tại)
      const sessionsResponse = await fetch(`${API_BASE_URL}/user-sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (selectedUserId === 'all') {
        if (emotionResponse?.ok) {
          const emotionData = await emotionResponse.json();
          setEmotionStats(emotionData);
          console.log('Emotion stats:', emotionData);
        }

        if (detectionResponse?.ok) {
          const detectionData = await detectionResponse.json();
          setDetectionStats(detectionData);
          console.log('Detection stats:', detectionData);
        }

        if (engagementResponse?.ok) {
          const engagementData = await engagementResponse.json();
          setEngagementStats(engagementData);
          console.log('Engagement stats:', engagementData);
        }
      }

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setUserSessions(sessionsData);
        console.log('User sessions:', sessionsData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Lỗi khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [period, selectedUserId]);

  const emotionData = Object.entries(emotionStats).map(([emotion, count]) => ({
    name: emotion,
    value: count
  }));

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

  const sessionColumns = [
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
          status={rate < 50 ? 'exception' : rate < 80 ? 'active' : 'success'}
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

  // Phân loại cảm xúc tích cực/tiêu cực
  const positiveEmotions = Object.entries(emotionStats).filter(([emotion]) => 
    getEmotionType(emotion) === 'positive'
  );
  const negativeEmotions = Object.entries(emotionStats).filter(([emotion]) => 
    getEmotionType(emotion) === 'negative'
  );
  const neutralEmotions = Object.entries(emotionStats).filter(([emotion]) => 
    getEmotionType(emotion) === 'neutral'
  );

  const totalPositive = positiveEmotions.reduce((sum, [, count]) => sum + count, 0);
  const totalNegative = negativeEmotions.reduce((sum, [, count]) => sum + count, 0);
  const totalNeutral = neutralEmotions.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3}>Thống kê cảm xúc</Title>
          <Space>
            {isAdmin && (
              <Select 
                value={selectedUserId} 
                onChange={setSelectedUserId} 
                style={{ width: 200 }}
                placeholder="Chọn người dùng"
              >
                <Option value="all">Tất cả người dùng</Option>
                {users.map(user => (
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Đang tải thống kê...</Text>
            </div>
          </div>
        ) : (
          <>
            {/* Thống kê tổng quan */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tổng phân tích"
                    value={detectionStats?.total_analyses || 0}
                    suffix="lần"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Phát hiện thành công"
                    value={detectionStats?.successful_detections || 0}
                    suffix="lần"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tỷ lệ phát hiện"
                    value={detectionStats?.detection_rate || 0}
                    suffix="%"
                    precision={2}
                    valueStyle={{ 
                      color: (detectionStats?.detection_rate || 0) < 50 ? '#cf1322' : 
                             (detectionStats?.detection_rate || 0) < 80 ? '#faad14' : '#3f8600'
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Chất lượng ảnh TB"
                    value={detectionStats?.average_image_quality || 0}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Thống kê phân loại cảm xúc */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card title="Cảm xúc tích cực" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Tổng cộng"
                    value={totalPositive}
                    suffix="lần"
                    valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    {positiveEmotions.map(([emotion, count]) => (
                      <div key={emotion} style={{ marginBottom: 8 }}>
                        <Tag color="green">{formatEmotion(emotion)}: {count}</Tag>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Cảm xúc tiêu cực" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Tổng cộng"
                    value={totalNegative}
                    suffix="lần"
                    valueStyle={{ color: '#f5222d', fontSize: '24px' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    {negativeEmotions.map(([emotion, count]) => (
                      <div key={emotion} style={{ marginBottom: 8 }}>
                        <Tag color="red">{formatEmotion(emotion)}: {count}</Tag>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Cảm xúc trung tính" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Tổng cộng"
                    value={totalNeutral}
                    suffix="lần"
                    valueStyle={{ color: '#8c8c8c', fontSize: '24px' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    {neutralEmotions.map(([emotion, count]) => (
                      <div key={emotion} style={{ marginBottom: 8 }}>
                        <Tag color="default">{formatEmotion(emotion)}: {count}</Tag>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Thống kê chi tiết */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card title="Thống kê chi tiết" style={{ height: 400 }}>
                  <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
                    <div>
                      <Text strong>Tỷ lệ phát hiện khuôn mặt:</Text>
                      <Progress 
                        percent={detectionStats?.detection_rate || 0} 
                        status={detectionStats?.detection_rate && detectionStats.detection_rate < 50 ? 'exception' : 'active'}
                        style={{ marginTop: 8 }}
                        format={(percent) => `${(percent || 0).toFixed(2)}%`}
                      />
                    </div>
                    
                    <div>
                      <Text strong>Chất lượng ảnh trung bình:</Text>
                      <Progress 
                        percent={detectionStats?.average_image_quality ? detectionStats.average_image_quality * 100 : 0} 
                        status="active"
                        style={{ marginTop: 8 }}
                        format={(percent) => `${(percent || 0).toFixed(2)}%`}
                      />
                    </div>
                    
                    <div>
                      <Text strong>Độ tương tác trung bình:</Text>
                      <Progress 
                        percent={engagementStats?.average_emotion_score ? engagementStats.average_emotion_score * 100 : 0} 
                        status="active"
                        style={{ marginTop: 8 }}
                        format={(percent) => `${(percent || 0).toFixed(2)}%`}
                      />
                    </div>
                    
                    <div>
                      <Text strong>Tổng cảm xúc đã phân tích:</Text>
                      <Text style={{ fontSize: 18, color: '#1890ff', marginLeft: 8 }}>
                        {engagementStats?.total_emotions_analyzed || 0}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Xếp hạng cảm xúc" style={{ height: 400 }}>
                  {emotionData.length > 0 ? (
                    <div style={{ padding: '20px' }}>
                      {emotionData.slice(0, 5).map((item, index) => (
                        <div key={item.name} style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text>#{index + 1} {formatEmotion(item.name)}</Text>
                            <Text strong style={{ color: getEmotionColor(item.name) }}>{item.value} lần</Text>
                          </div>
                          <Progress 
                            percent={(item.value / Math.max(...emotionData.map(d => d.value))) * 100} 
                            strokeColor={getEmotionColor(item.name)}
                            showInfo={false}
                            style={{ marginTop: 8 }}
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

            {/* Lịch sử phiên phân tích */}
            <Card title="Lịch sử phiên phân tích" style={{ marginBottom: 24 }}>
              {userSessions.length > 0 ? (
                <Table 
                  dataSource={userSessions} 
                  columns={sessionColumns} 
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chưa có phiên phân tích nào</Text>
                </div>
              )}
            </Card>

            {/* Gợi ý cải thiện */}
            {detectionStats && detectionStats.detection_rate < 70 && (
              <Alert
                message="Gợi ý cải thiện"
                description="Tỷ lệ phát hiện khuôn mặt của bạn khá thấp. Hãy đảm bảo: ánh sáng đủ sáng, khuôn mặt rõ ràng, và nhìn thẳng camera."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {/* Hướng dẫn tạo dữ liệu */}
            {Object.keys(emotionStats).length === 0 && (
              <Alert
                message="Hướng dẫn tạo dữ liệu"
                description="Để có dữ liệu thống kê, hãy vào trang Camera, bật camera và phân tích cảm xúc. Mỗi lần phân tích sẽ được lưu vào database."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default EmotionStatsPage; 