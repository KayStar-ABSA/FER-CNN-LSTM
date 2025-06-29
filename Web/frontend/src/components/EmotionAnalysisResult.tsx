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
}

interface EmotionAnalysisResultProps {
  result: AnalysisResult | null;
}

const EmotionAnalysisResult: React.FC<EmotionAnalysisResultProps> = ({ result }) => {
  if (!result) {
    return (
      <Card style={{ textAlign: 'center', backgroundColor: '#fafafa' }}>
        <Text type="secondary">Chưa có kết quả phân tích</Text>
      </Card>
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
    <div>
      <Title level={4}>Kết quả phân tích</Title>
      
      <div style={{ marginBottom: 16 }}>
        <Text strong>Số khuôn mặt phát hiện: </Text>
        <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
          {result.faces_detected}
        </Tag>
      </div>
      
      {result.results.map((faceResult, index) => (
        <Card 
          key={index} 
          style={{ 
            marginBottom: 16, 
            border: '1px solid #f0f0f0',
            borderRadius: 8
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
              Khuôn mặt {index + 1}
            </Title>
          </div>
          
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 12 }}>
                <Text strong>Cảm xúc chủ đạo: </Text>
                <br />
                <Tag 
                  color="green" 
                  style={{ 
                    fontSize: 14, 
                    padding: '8px 12px',
                    marginTop: 4,
                    borderRadius: 6
                  }}
                >
                  {faceResult.dominant_emotion_vn} ({faceResult.dominant_emotion_score.toFixed(1)}%)
                </Tag>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text strong>Mức độ tham gia: </Text>
                <br />
                <Tag 
                  color={getEngagementColor(faceResult.engagement)} 
                  icon={getEngagementIcon(faceResult.engagement)}
                  style={{ 
                    fontSize: 14, 
                    padding: '8px 12px',
                    marginTop: 4,
                    borderRadius: 6
                  }}
                >
                  {faceResult.engagement}
                </Tag>
              </div>
            </Col>
            
            <Col span={12}>
              <div>
                <Text strong>Chi tiết cảm xúc:</Text>
                <div style={{ marginTop: 8 }}>
                  {Object.entries(faceResult.emotions_vn)
                    .sort(([,a], [,b]) => b - a) // Sắp xếp theo điểm số giảm dần
                    .map(([emotion, score]) => (
                      <div key={emotion} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>{emotion}:</Text>
                          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
                            {score.toFixed(1)}%
                          </Text>
                        </div>
                        <Progress 
                          percent={score} 
                          size="small" 
                          strokeColor={getEmotionColor(emotion, emotion === faceResult.dominant_emotion_vn)}
                          showInfo={false}
                          style={{ marginBottom: 4 }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </Col>
          </Row>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ fontSize: 12, color: '#666' }}>
            <Text>Vị trí: ({faceResult.face_position.x}, {faceResult.face_position.y}) - 
                  Kích thước: {faceResult.face_position.width}×{faceResult.face_position.height}</Text>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EmotionAnalysisResult; 