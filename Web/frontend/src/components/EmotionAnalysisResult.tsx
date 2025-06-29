import React from 'react';
import { Card, Typography, Tag, Progress, Row, Col, Divider } from 'antd';
import { SmileOutlined, MehOutlined, FrownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface EmotionResult {
  face_position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  emotions: { [key: string]: number };
  dominant_emotion: string;
  dominant_emotion_vn: string;
  dominant_emotion_score: number;
  engagement: string;
  emotions_vn: { [key: string]: number };
}

interface AnalysisResult {
  faces_detected: number;
  results: EmotionResult[];
  success: boolean;
  processing_time?: number;
  avg_fps?: number;
  image_size?: string;
  cache_hits?: number;
}

interface EmotionAnalysisResultProps {
  result: AnalysisResult | null;
}

const EmotionAnalysisResult: React.FC<EmotionAnalysisResultProps> = ({ result }) => {
  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
        <Text type="secondary">Chưa có kết quả phân tích</Text>
      </div>
    );
  }

  // Kiểm tra nếu không phát hiện được khuôn mặt
  if (result.faces_detected === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#ff4d4f' }}>
        <FrownOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
        <br />
        <Text type="danger" strong>Không phát hiện được khuôn mặt</Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Vui lòng điều chỉnh vị trí hoặc ánh sáng
        </Text>
      </div>
    );
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'Rất tích cực': return 'green';
      case 'Tích cực': return 'orange';
      case 'Không tích cực': return 'red';
      default: return 'blue';
    }
  };

  const getEngagementIcon = (engagement: string) => {
    switch (engagement) {
      case 'Rất tích cực': return <SmileOutlined />;
      case 'Tích cực': return <MehOutlined />;
      case 'Không tích cực': return <FrownOutlined />;
      default: return null;
    }
  };

  const getEmotionColor = (emotion: string, isDominant: boolean) => {
    if (isDominant) return '#52c41a';
    
    const emotionColors: { [key: string]: string } = {
      'Vui vẻ': '#52c41a',
      'Buồn bã': '#1890ff',
      'Tức giận': '#ff4d4f',
      'Ngạc nhiên': '#faad14',
      'Bình thường': '#d9d9d9',
      'Sợ hãi': '#722ed1',
      'Ghê tởm': '#eb2f96'
    };
    
    return emotionColors[emotion] || '#d9d9d9';
  };

  return (
    <div style={{ fontSize: '12px' }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong>Khuôn mặt: </Text>
        <Tag color="blue">
          {result.faces_detected}
        </Tag>
      </div>
      
      {result.results.map((faceResult, index) => (
        <div 
          key={index} 
          style={{ 
            marginBottom: 12, 
            padding: '8px',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            backgroundColor: '#fafafa'
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: '11px' }}>Khuôn mặt {index + 1}</Text>
          </div>
          
          <Row gutter={8}>
            <Col span={12}>
              <div style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: '10px' }}>Cảm xúc chủ đạo:</Text>
                <br />
                <Tag 
                  color="green" 
                  style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px',
                    marginTop: 2
                  }}
                >
                  {faceResult.dominant_emotion_vn} ({faceResult.dominant_emotion_score.toFixed(0)}%)
                </Tag>
              </div>

              <div style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: '10px' }}>Mức độ tham gia:</Text>
                <br />
                <Tag 
                  color={getEngagementColor(faceResult.engagement)} 
                  icon={getEngagementIcon(faceResult.engagement)}
                  style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px',
                    marginTop: 2
                  }}
                >
                  {faceResult.engagement}
                </Tag>
              </div>
            </Col>
            
            <Col span={12}>
              <div>
                <Text style={{ fontSize: '10px' }}>Chi tiết cảm xúc:</Text>
                <div style={{ marginTop: 4 }}>
                  {Object.entries(faceResult.emotions_vn)
                    .sort(([,a], [,b]) => b - a) // Sắp xếp theo điểm số giảm dần
                    .slice(0, 3) // Chỉ hiển thị 3 cảm xúc cao nhất
                    .map(([emotion, score]) => (
                      <div key={emotion} style={{ marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: '9px' }}>{emotion}:</Text>
                          <Text style={{ fontSize: '9px', fontWeight: 'bold' }}>
                            {score.toFixed(0)}%
                          </Text>
                        </div>
                        <Progress 
                          percent={score} 
                          size="small" 
                          strokeColor={getEmotionColor(emotion, emotion === faceResult.dominant_emotion_vn)}
                          showInfo={false}
                          style={{ marginBottom: 2 }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </Col>
          </Row>
          
          <div style={{ fontSize: '9px', color: '#666', marginTop: 4 }}>
            <Text>Vị trí: ({faceResult.face_position.x}, {faceResult.face_position.y})</Text>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmotionAnalysisResult; 