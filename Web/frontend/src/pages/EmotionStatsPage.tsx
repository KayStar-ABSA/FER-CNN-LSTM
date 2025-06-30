import { Card, Col, Row, Table, message } from 'antd';
import React, { useEffect, useState, useCallback } from 'react';
import EmotionCategoryCard from '../components/common/EmotionCategoryCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmotionDetailCard from '../components/emotion/EmotionDetailCard';
import FilterBar from '../components/ui/FilterBar';
import PageHeader from '../components/ui/PageHeader';
import StatsGrid from '../components/ui/StatsGrid';
import {
  DetectionStats,
  EmotionStats,
  EngagementStats,
  FilterOptions,
  StatisticCardProps,
  User,
  UserSession
} from '../types';
import { getEmotionHistory, getEmotionStats, getPerformanceStats, getUsers } from '../utils/api';
import { categorizeEmotions } from '../utils/emotionUtils';
import { getSessionColumns } from '../utils/tableUtils';

const EmotionStatsPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({ period: 'day' });
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all');
  const [emotionStats, setEmotionStats] = useState<EmotionStats>({});
  const [detectionStats, setDetectionStats] = useState<DetectionStats | null>(null);
  const [, setEngagementStats] = useState<EngagementStats | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Admin có thể chọn xem dữ liệu của user cụ thể hoặc tổng hợp
        const emotionFilters = {
          period: filters.period,
          userId: selectedUserId,  // Có thể là 'all' hoặc user_id cụ thể
          includeDetails: true,
          emotions: ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear', 'disgust']
        };
        
        const performanceFilters = {
          period: filters.period,
          userId: selectedUserId,  // Có thể là 'all' hoặc user_id cụ thể
          includeDetails: true
        };
        
        const [emotionData, performanceData] = await Promise.all([
          getEmotionStats(emotionFilters),
          getPerformanceStats(performanceFilters)
        ]);
        
        // Xử lý response từ emotion API
        const emotionStatsData = emotionData.emotion_stats || {};
        setEmotionStats(emotionStatsData);
        
        // Xử lý response từ performance API
        const detectionStatsData = performanceData.detection_metrics || {};
        setDetectionStats({
          total_analyses: detectionStatsData.total_analyses || performanceData.total_analyses || 0,
          successful_detections: detectionStatsData.successful_detections || performanceData.successful_detections || 0,
          failed_detections: detectionStatsData.failed_detections || performanceData.failed_detections || 0,
          detection_rate: detectionStatsData.detection_rate || performanceData.detection_rate || 0,
          average_image_quality: detectionStatsData.average_image_quality || performanceData.average_image_quality || 0
        });
        
        const engagementStatsData = performanceData.engagement_metrics || {};
        setEngagementStats({
          average_emotion_score: engagementStatsData.average_emotion_score || 0,
          total_emotions_analyzed: engagementStatsData.total_emotions_analyzed || 0
        });

        // Lấy lịch sử phân tích với JSON filters
        const historyFilters: any = {
          limit: 100,
          includeDetails: true,
          userId: selectedUserId  // Admin truyền selectedUserId
        };
        
        const historyData = await getEmotionHistory(historyFilters);
        // Chuyển đổi dữ liệu từ emotion history sang user sessions format
        const sessionsData = (historyData.history || []).map((item: any, index: number) => ({
          id: index + 1,
          session_start: item.timestamp || new Date().toISOString(),
          session_end: null,
          total_analyses: 1,
          successful_detections: 1, // Nếu có dữ liệu thì đã phát hiện thành công
          failed_detections: 0,
          detection_rate: 100, // Nếu có dữ liệu thì tỷ lệ phát hiện 100%
          emotions_summary: { [item.emotion]: 1 },
          average_engagement: item.score || 0,
          camera_resolution: "640x480",
          analysis_interval: 200
        }));
        setUserSessions(sessionsData);
      } else {
        // User thường xem thống kê của mình (không truyền userId)
        const [emotionData, performanceData] = await Promise.all([
          getEmotionStats(filters.period),
          getPerformanceStats(filters.period)
        ]);
        
        // Xử lý response từ emotion API
        const emotionStatsData = emotionData.emotion_stats || {};
        setEmotionStats(emotionStatsData);
        
        // Xử lý response từ performance API
        const detectionStatsData = performanceData.detection_metrics || {};
        setDetectionStats({
          total_analyses: detectionStatsData.total_analyses || performanceData.total_analyses || 0,
          successful_detections: detectionStatsData.successful_detections || performanceData.successful_detections || 0,
          failed_detections: detectionStatsData.failed_detections || performanceData.failed_detections || 0,
          detection_rate: detectionStatsData.detection_rate || performanceData.detection_rate || 0,
          average_image_quality: detectionStatsData.average_image_quality || performanceData.average_image_quality || 0
        });
        
        const engagementStatsData = performanceData.engagement_metrics || {};
        setEngagementStats({
          average_emotion_score: engagementStatsData.average_emotion_score || 0,
          total_emotions_analyzed: engagementStatsData.total_emotions_analyzed || 0
        });

        // User thường lấy lịch sử của mình (không truyền userId)
        const historyData = await getEmotionHistory({ limit: 100 });
        // Chuyển đổi dữ liệu từ emotion history sang user sessions format
        const sessionsData = (historyData.history || []).map((item: any, index: number) => ({
          id: index + 1,
          session_start: item.timestamp || new Date().toISOString(),
          session_end: null,
          total_analyses: 1,
          successful_detections: 1, // Nếu có dữ liệu thì đã phát hiện thành công
          failed_detections: 0,
          detection_rate: 100, // Nếu có dữ liệu thì tỷ lệ phát hiện 100%
          emotions_summary: { [item.emotion]: 1 },
          average_engagement: item.score || 0,
          camera_resolution: "640x480",
          analysis_interval: 200
        }));
        setUserSessions(sessionsData);
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Lỗi khi tải thống kê');
    } finally {
      setLoading(false);
    }
  }, [filters.period, selectedUserId, isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Chỉ fetch khi cả isAdmin và selectedUserId đã được set
    if (isAdmin !== undefined && selectedUserId !== undefined) {
      fetchData();
    }
  }, [isAdmin, selectedUserId, fetchData]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    if (newFilters.userId) {
      setSelectedUserId(newFilters.userId);
    }
  };

  // Sử dụng utility function để phân loại cảm xúc
  const emotionCategories = categorizeEmotions(emotionStats);
  
  // Ensure users is always an array for safety
  const safeUsers = Array.isArray(users) ? users : [];

  // Prepare stats for StatsGrid
  const statsData: StatisticCardProps[] = [
    {
      title: "Tổng phân tích",
      value: detectionStats?.total_analyses || 0,
      suffix: "lần"
    },
    {
      title: "Phát hiện thành công",
      value: detectionStats?.successful_detections || 0,
      suffix: "lần",
      color: "#3f8600"
    },
    {
      title: "Tỷ lệ phát hiện",
      value: detectionStats?.detection_rate || 0,
      suffix: "%",
      precision: 2,
      color: (detectionStats?.detection_rate || 0) < 50 ? '#cf1322' : 
             (detectionStats?.detection_rate || 0) < 80 ? '#faad14' : '#3f8600'
    },
    {
      title: "Chất lượng ảnh TB",
      value: detectionStats?.average_image_quality || 0,
      suffix: "%",
      precision: 2,
      color: "#1890ff"
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
        <PageHeader
          title="Thống kê cảm xúc"
          subtitle="Phân tích và thống kê chi tiết về cảm xúc"
        >
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            showUserFilter={isAdmin}
            users={safeUsers}
          />
        </PageHeader>

        {loading ? (
          <LoadingSpinner message="Đang tải thống kê..." />
        ) : (
          <>
            {/* Thống kê tổng quan */}
            <StatsGrid stats={statsData} />

            {/* Thống kê phân loại cảm xúc */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <EmotionCategoryCard
                  title="Cảm xúc tích cực"
                  emotions={emotionCategories.positive}
                  total={emotionCategories.totalPositive}
                  color="#52c41a"
                  tagColor="green"
                />
              </Col>
              <Col span={8}>
                <EmotionCategoryCard
                  title="Cảm xúc tiêu cực"
                  emotions={emotionCategories.negative}
                  total={emotionCategories.totalNegative}
                  color="#f5222d"
                  tagColor="red"
                />
              </Col>
              <Col span={8}>
                <EmotionCategoryCard
                  title="Cảm xúc trung tính"
                  emotions={emotionCategories.neutral}
                  total={emotionCategories.totalNeutral}
                  color="#8c8c8c"
                  tagColor="default"
                />
              </Col>
            </Row>

            {/* Bảng sessions */}
            <Card title="Lịch sử phiên phân tích" style={{ marginBottom: 24 }}>
              <Table
                dataSource={userSessions}
                columns={getSessionColumns()}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </Card>

            {/* Thống kê chi tiết cảm xúc */}
            <EmotionDetailCard emotionStats={emotionStats} />
          </>
        )}
      </Card>
    </div>
  );
};

export default EmotionStatsPage; 