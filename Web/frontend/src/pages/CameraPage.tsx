import React, { useRef, useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Spin, message, Row, Col, Progress } from 'antd';
import { CameraOutlined, PlayCircleOutlined, StopOutlined, VideoCameraOutlined, DatabaseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { analyzeEmotion } from '../utils/api';
import EmotionAnalysisResult from '../components/EmotionAnalysisResult';

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
  session_id?: number;
}

const CameraPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamInterval, setStreamInterval] = useState<NodeJS.Timeout | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [totalAnalysisCount, setTotalAnalysisCount] = useState(0);
  const [detectionRate, setDetectionRate] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [cameraResolution, setCameraResolution] = useState<string>('1280x720');

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraOn(true);
          
          // Lấy thông tin độ phân giải camera
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          setCameraResolution(`${settings.width}x${settings.height}`);
        }
      }
    } catch (error) {
      message.error('Không thể truy cập camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
    stopStreaming();
    // Reset thống kê và session khi tắt camera
    setSavedCount(0);
    setNoFaceCount(0);
    setTotalAnalysisCount(0);
    setDetectionRate(0);
    setCurrentSessionId(null);
  };

  const stopStreaming = () => {
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
    }
    setIsStreaming(false);
  };

  const startStreaming = () => {
    if (!isCameraOn) {
      message.error('Vui lòng bật camera trước');
      return;
    }
    
    setIsStreaming(true);
    const interval = setInterval(() => {
      captureFrame();
    }, 1500); // Phân tích mỗi 1.5 giây để tăng tần suất
    setStreamInterval(interval);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9); // Tăng chất lượng ảnh
    
    try {
      const data = await analyzeEmotion({ 
        image: dataUrl,
        save_to_db: true, // Luôn lưu vào database
        session_id: currentSessionId,
        camera_resolution: cameraResolution,
        analysis_interval: 1.5
      });
      
      // Cập nhật session_id nếu có
      if (data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
      }
      
      setAnalysisResult(data);
      setTotalAnalysisCount(prev => prev + 1);
      
      // Đếm số kết quả đã lưu
      if (data.faces_detected > 0) {
        setSavedCount(prev => prev + data.faces_detected);
        // Hiển thị thông báo thỉnh thoảng
        if (Math.random() < 0.05) { // 5% chance
          message.success(`Phát hiện ${data.faces_detected} khuôn mặt!`, 1);
        }
      } else {
        setNoFaceCount(prev => prev + 1);
        // Hiển thị gợi ý thỉnh thoảng
        if (Math.random() < 0.1) { // 10% chance
          message.info('Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng và đủ ánh sáng.', 2);
        }
      }
      
      // Cập nhật tỷ lệ phát hiện
      const total = totalAnalysisCount + 1;
      const detected = total - noFaceCount;
      setDetectionRate((detected / total) * 100);
      
    } catch (error: any) {
      console.error('Stream analysis error:', error);
      setTotalAnalysisCount(prev => prev + 1);
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      message.error('Camera chưa được khởi động');
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    
    setLoading(true);
    try {
      const data = await analyzeEmotion({ 
        image: dataUrl,
        save_to_db: true, // Luôn lưu vào database
        session_id: currentSessionId,
        camera_resolution: cameraResolution,
        analysis_interval: null // Không phải stream
      });
      
      // Cập nhật session_id nếu có
      if (data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
      }
      
      setAnalysisResult(data);
      setTotalAnalysisCount(prev => prev + 1);
      
      if (data.faces_detected > 0) {
        message.success(`Phát hiện ${data.faces_detected} khuôn mặt và đã lưu vào database!`);
        setSavedCount(prev => prev + data.faces_detected);
      } else {
        message.warning('Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng và đủ ánh sáng.');
        setNoFaceCount(prev => prev + 1);
      }
      
      // Cập nhật tỷ lệ phát hiện
      const total = totalAnalysisCount + 1;
      const detected = total - noFaceCount;
      setDetectionRate((detected / total) * 100);
      
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi phân tích');
      setTotalAnalysisCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopStreaming();
      stopCamera();
    };
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Phân tích cảm xúc qua camera
        </Title>
        
        <Row gutter={24}>
          <Col span={12}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <video 
                ref={videoRef} 
                width={640} 
                height={480} 
                autoPlay 
                style={{ 
                  borderRadius: 8, 
                  border: '2px solid #f0f0f0',
                  backgroundColor: '#f5f5f5',
                  maxWidth: '100%'
                }} 
              />
            </div>
            
            <Space direction="vertical" size="middle" style={{ width: '100%', alignItems: 'center' }}>
              {/* Thống kê phiên hiện tại */}
              <div style={{ 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f', 
                borderRadius: 6, 
                padding: '12px',
                width: '100%',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="success">
                    <DatabaseOutlined /> Đã lưu {savedCount} kết quả trong phiên này
                  </Text>
                </div>
                
                {/* Tỷ lệ phát hiện khuôn mặt */}
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">
                    Tỷ lệ phát hiện: {detectionRate.toFixed(1)}% ({totalAnalysisCount - noFaceCount}/{totalAnalysisCount})
                  </Text>
                  <Progress 
                    percent={detectionRate} 
                    size="small" 
                    status={detectionRate < 50 ? 'exception' : detectionRate < 80 ? 'active' : 'success'}
                    style={{ marginTop: 4 }}
                  />
                </div>
                
                {/* Gợi ý cải thiện */}
                {detectionRate < 70 && totalAnalysisCount > 5 && (
                  <div style={{ 
                    background: '#fff7e6', 
                    border: '1px solid #ffd591', 
                    borderRadius: 4, 
                    padding: '8px',
                    marginTop: 8
                  }}>
                    <Text type="warning">
                      <ExclamationCircleOutlined /> Gợi ý: Đảm bảo khuôn mặt rõ ràng, đủ ánh sáng và nhìn thẳng camera
                    </Text>
                  </div>
                )}
                
                {savedCount > 0 && (
                  <Button 
                    size="small" 
                    type="text" 
                    onClick={() => {
                      setSavedCount(0);
                      setNoFaceCount(0);
                      setTotalAnalysisCount(0);
                      setDetectionRate(0);
                    }}
                    style={{ color: '#52c41a', marginTop: 8 }}
                  >
                    Reset thống kê
                  </Button>
                )}
              </div>
              
              <Space wrap>
                {!isCameraOn ? (
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />} 
                    onClick={startCamera}
                    size="large"
                  >
                    Bật camera
                  </Button>
                ) : (
                  <Button 
                    danger 
                    icon={<StopOutlined />} 
                    onClick={stopCamera}
                    size="large"
                  >
                    Tắt camera
                  </Button>
                )}
                
                <Button 
                  type="primary" 
                  icon={<CameraOutlined />} 
                  onClick={capture} 
                  loading={loading}
                  disabled={!isCameraOn}
                  size="large"
                >
                  Chụp & Phân tích
                </Button>

                {isCameraOn && !isStreaming ? (
                  <Button 
                    type="default" 
                    icon={<VideoCameraOutlined />} 
                    onClick={startStreaming}
                    size="large"
                  >
                    Bật stream
                  </Button>
                ) : (
                  <Button 
                    danger 
                    icon={<StopOutlined />} 
                    onClick={stopStreaming}
                    disabled={!isStreaming}
                    size="large"
                  >
                    Tắt stream
                  </Button>
                )}
              </Space>
              
              {loading && (
                <div style={{ textAlign: 'center' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Đang phân tích...</Text>
                  </div>
                </div>
              )}

              {isStreaming && (
                <div style={{ textAlign: 'center' }}>
                  <Spin size="small" />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Đang phân tích real-time và lưu vào database...
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          </Col>

          <Col span={12}>
            <EmotionAnalysisResult result={analysisResult} />
          </Col>
        </Row>
        
        <canvas ref={canvasRef} width={1280} height={720} style={{ display: 'none' }} />
      </Card>
    </div>
  );
};

export default CameraPage;
