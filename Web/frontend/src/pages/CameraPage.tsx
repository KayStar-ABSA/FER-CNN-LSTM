import { CameraOutlined, PlayCircleOutlined, StopOutlined, ThunderboltOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Progress, Row, Space, Statistic, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { AnalysisResult } from '../types/emotion';
import { analyzeEmotion, analyzeEmotionRealtime, endAnalysisSession, getActiveSession, getFaceDetectionStats, getPerformanceStats, startAnalysisSession } from '../utils/api';
import { getEmotionType } from '../utils/emotionUtils';

const { Title, Text } = Typography;

interface PerformanceStats {
  average_processing_time: number;
  average_fps: number;
  detection_rate: number;
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  average_image_quality: number;
  average_emotion_score: number;
  total_sessions: number;
}

interface FaceDetectionStats {
  total_attempts: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  failure_rate: number;
  detection_efficiency: number;
  average_processing_time: number;
  average_image_quality: number;
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
  const [cameraResolution, setCameraResolution] = useState<string>('640x480');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [dbPerformanceStats, setDbPerformanceStats] = useState<PerformanceStats>({
    average_processing_time: 0,
    average_fps: 0,
    detection_rate: 0,
    total_analyses: 0,
    successful_detections: 0,
    failed_detections: 0,
    average_image_quality: 0,
    average_emotion_score: 0,
    total_sessions: 0
  });

  const [faceDetectionStats, setFaceDetectionStats] = useState<FaceDetectionStats>({
    total_attempts: 0,
    successful_detections: 0,
    failed_detections: 0,
    detection_rate: 0,
    failure_rate: 0,
    detection_efficiency: 0,
    average_processing_time: 0,
    average_image_quality: 0
  });

  const [useRealtimeAPI] = useState(true);
  const [negativeStreak, setNegativeStreak] = useState<number[]>([]);
  const [hasWarned, setHasWarned] = useState(false);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load performance stats from database
  const loadPerformanceStats = async () => {
    try {
      const [performanceData, faceDetectionData] = await Promise.all([
        getPerformanceStats('day'),
        getFaceDetectionStats('day')
      ]);
      
      if (performanceData.success) {
        setDbPerformanceStats(performanceData);
      }
      
      if (faceDetectionData.success) {
        setFaceDetectionStats(faceDetectionData);
      }
    } catch (error) {
      console.error('Error loading performance stats:', error);
    }
  };

  // Load performance stats on component mount
  useEffect(() => {
    loadPerformanceStats();
    
    // Kiểm tra session hiện tại
    const checkActiveSession = async () => {
      try {
        const result = await getActiveSession();
        if (result.success && result.has_active_session) {
          setCurrentSessionId(result.session.id);
          // Nếu có session đang hoạt động, có thể user đã refresh trang
          // Chúng ta sẽ kết thúc session cũ để tránh conflict
          await endCurrentSession();
        }
      } catch (error) {
        console.error('Error checking active session:', error);
      }
    };
    
    checkActiveSession();
    
    // Cleanup khi component unmount
    return () => {
      if (streamInterval) {
        clearInterval(streamInterval);
      }
      if (currentSessionId) {
        endCurrentSession();
      }
    };
  }, []);

  const endCurrentSession = async () => {
    try {
      const result = await endAnalysisSession();
      if (result.success) {
        console.log('Session ended successfully');
        setCurrentSessionId(null);
        message.success('Kết thúc phiên thành công');
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
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

  const stopCamera = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
    await stopStreaming();
    
    // Reset thống kê và session khi tắt camera
    setSavedCount(0);
    setNoFaceCount(0);
    setTotalAnalysisCount(0);
    setDetectionRate(0);
    setDbPerformanceStats({
      average_processing_time: 0,
      average_fps: 0,
      detection_rate: 0,
      total_analyses: 0,
      successful_detections: 0,
      failed_detections: 0,
      average_image_quality: 0,
      average_emotion_score: 0,
      total_sessions: 0
    });
  };

  const stopStreaming = async () => {
    if (streamInterval) {
      clearInterval(streamInterval);
      setStreamInterval(null);
    }
    setIsStreaming(false);
    
    // Kết thúc session khi dừng stream
    if (currentSessionId) {
      await endCurrentSession();
    }
  };

  const handleStartStream = async () => {
    if (!isCameraOn) {
      message.error('Bạn phải bật camera trước!');
      return;
    }
    if (isStreaming) {
      message.warning('Đang stream rồi!');
      return;
    }

    setIsStreaming(true);
    message.success('Bắt đầu stream!');
    let interval = setInterval(() => {
      captureFrame();
    }, 200);
    setStreamInterval(interval);

    // Gọi backend tạo session song song, không chờ
    const config = {
      cameraResolution: cameraResolution,
      analysisInterval: 200,
      detectionThreshold: 0.8,
      enabledEmotions: ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear', 'disgust'],
      maxSessionDuration: 3600
    };
    startAnalysisSession(config)
      .then(sessionResult => {
        if (sessionResult.success) {
          setCurrentSessionId(sessionResult.session.id);
        }
      })
      .catch(error => {
        console.error('Error creating session:', error);
      });
  };

  // Hàm phát âm thanh cảnh báo
  const playAlertSound = () => {
    if (!alertAudioRef.current) {
      alertAudioRef.current = new window.Audio('/alert-beep.mp3');
    }
    alertAudioRef.current.currentTime = 0;
    alertAudioRef.current.play();
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }
    const canvasWidth = 640;
    const canvasHeight = 480;
    ctx.drawImage(videoRef.current, 0, 0, canvasWidth, canvasHeight);
    try {
      const canvas = canvasRef.current!;
      let data: AnalysisResult;
      if (useRealtimeAPI) {
        // Lấy blob từ canvas và gửi lên API realtime
        const blob: Blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8));
        data = await analyzeEmotionRealtime(blob);
      } else {
        // Dùng API cũ (base64)
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        data = await analyzeEmotion(imageBase64);
      }
      setAnalysisResult(data);
      setTotalAnalysisCount(prev => prev + 1);
      if (data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
      }
      // --- CẢNH BÁO CẢM XÚC NGUY HIỂM ---
      const now = Date.now();
      let streak = negativeStreak;
      const dominant = data.analysis?.dominant_emotion;
      if (dominant && getEmotionType(dominant) === 'negative') {
        streak = [...streak, now].filter(ts => now - ts <= 1000);
        setNegativeStreak(streak);
        if (streak.length >= 5 && !hasWarned) {
          message.warning('Cảnh báo: Cảm xúc tiêu cực liên tục!');
          playAlertSound();
          setHasWarned(true);
        }
      } else {
        streak = [];
        setNegativeStreak([]);
        setHasWarned(false);
      }
      // --- END CẢNH BÁO ---
      await loadPerformanceStats();
      if (data.analysis?.faces_detected && data.analysis.faces_detected > 0) {
        setSavedCount(prev => prev + data.analysis!.faces_detected);
        if (Math.random() < 0.05) {
          message.success(`Phát hiện ${data.analysis.faces_detected} khuôn mặt! (${data.analysis.processing_time}ms)`, 1);
        }
      } else {
        setNoFaceCount(prev => prev + 1);
        if (Math.random() < 0.1) {
          message.info('Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng và đủ ánh sáng.', 2);
        }
      }
    } catch (error) {
      console.error('Lỗi khi gọi API analyzeEmotion:', error);
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      message.error('Camera chưa được khởi động');
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Giảm kích thước canvas
    const canvasWidth = 640;
    const canvasHeight = 480;
    
    ctx.drawImage(videoRef.current, 0, 0, canvasWidth, canvasHeight);
    
    setLoading(true);
    try {
      const canvas = canvasRef.current!;
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const data = await analyzeEmotion(imageBase64);
      setAnalysisResult(data);
      setTotalAnalysisCount(prev => prev + 1);
      
      // Lưu session ID nếu có
      if (data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
      }
      
      // Refresh thống kê từ database sau mỗi lần phân tích
      await loadPerformanceStats();
      
      if (data.analysis?.faces_detected && data.analysis.faces_detected > 0) {
        message.success(`Phát hiện ${data.analysis.faces_detected} khuôn mặt và đã lưu vào database! (${data.analysis.processing_time}ms)`);
        setSavedCount(prev => prev + data.analysis!.faces_detected);
      } else {
        message.warning('Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng và đủ ánh sáng.');
        setNoFaceCount(prev => prev + 1);
      }
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      message.error('Lỗi khi phân tích ảnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', height: '100vh', overflow: 'hidden' }}>
      <Title level={3} style={{ marginBottom: '12px' }}>
        <CameraOutlined /> Camera Analysis
      </Title>
      
      {/* Performance Statistics - Compact */}
      <Row gutter={8} style={{ marginBottom: '12px' }}>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Tốc độ xử lý"
              value={dbPerformanceStats.average_fps || 0}
              suffix="FPS"
              prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
              precision={1}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Thời gian xử lý"
              value={dbPerformanceStats.average_processing_time || 0}
              suffix="ms"
              precision={0}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Tỷ lệ phát hiện"
              value={faceDetectionStats.detection_rate || dbPerformanceStats.detection_rate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="Độ phân giải"
              value={cameraResolution}
              valueStyle={{ fontSize: '14px' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ height: 'calc(100vh - 140px)' }}>
        <Col span={14}>
          <Card title="Camera Feed" size="small" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', display: 'inline-block', flex: 1 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 'calc(100vh - 280px)',
                  border: '2px solid #d9d9d9',
                  borderRadius: '8px'
                }}
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
                width="640"
                height="480"
              />
              
              {/* Performance overlay */}
              {analysisResult && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  <div>⚡ {dbPerformanceStats.average_fps?.toFixed(1)} FPS</div>
                  <div>⏱️ {analysisResult.analysis?.processing_time || dbPerformanceStats.average_processing_time?.toFixed(0)}ms</div>
                  <div>💾 Cache: 0</div>
                </div>
              )}
            </div>
            
            <Space style={{ marginTop: '8px', flexWrap: 'wrap' }}>
              <Button
                type="primary"
                size="small"
                icon={<CameraOutlined />}
                onClick={startCamera}
                disabled={isCameraOn}
              >
                Bật Camera
              </Button>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={stopCamera}
                disabled={!isCameraOn}
              >
                Tắt Camera
              </Button>
              <Button
                type="default"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={capture}
                loading={loading}
                disabled={!isCameraOn}
              >
                Chụp Ảnh
              </Button>
              <Button
                type="default"
                size="small"
                icon={<VideoCameraOutlined />}
                onClick={handleStartStream}
                disabled={!isCameraOn || isStreaming}
              >
                Bắt đầu Stream
              </Button>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={stopStreaming}
                disabled={!isStreaming}
              >
                Dừng Stream
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={10}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Statistics - Compact */}
            <Card title="Thống kê" size="small" style={{ flex: 1 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Text strong>Tổng phân tích:</Text>
                  <Text>{faceDetectionStats.total_attempts || dbPerformanceStats.total_analyses || 0}</Text>
                </Row>
                <Row justify="space-between">
                  <Text strong>Phát hiện thành công:</Text>
                  <Text style={{ color: '#52c41a' }}>{faceDetectionStats.successful_detections || dbPerformanceStats.successful_detections || 0}</Text>
                </Row>
                <Row justify="space-between">
                  <Text strong>Không phát hiện:</Text>
                  <Text style={{ color: '#ff4d4f' }}>{faceDetectionStats.failed_detections || dbPerformanceStats.failed_detections || 0}</Text>
                </Row>
                <Row justify="space-between">
                  <Text strong>Tỷ lệ thất bại:</Text>
                  <Text style={{ color: '#ff4d4f' }}>{(faceDetectionStats.failure_rate || 0).toFixed(1)}%</Text>
                </Row>
                <Progress
                  percent={faceDetectionStats.detection_rate || dbPerformanceStats.detection_rate || 0}
                  status={(faceDetectionStats.detection_rate || dbPerformanceStats.detection_rate || 0) > 80 ? 'success' : (faceDetectionStats.detection_rate || dbPerformanceStats.detection_rate || 0) > 50 ? 'normal' : 'exception'}
                  format={(percent) => `${percent?.toFixed(1)}%`}
                  size="small"
                />
              </Space>
            </Card>

            {/* Session Info - Compact */}
            {analysisResult && (
              <Card title="Thông tin phiên" size="small" style={{ flex: 1 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row justify="space-between">
                    <Text strong>Trạng thái:</Text>
                    <Text style={{ color: isStreaming ? '#52c41a' : '#faad14' }}>
                      {isStreaming ? '🟢 Đang stream' : '🟡 Sẵn sàng'}
                    </Text>
                  </Row>
                  <Row justify="space-between">
                    <Text strong>Kết quả:</Text>
                    <Text style={{ color: analysisResult.success ? '#52c41a' : '#ff4d4f' }}>
                      {analysisResult.success ? '✅ Thành công' : '❌ Thất bại'}
                    </Text>
                  </Row>
                </Space>
              </Card>
            )}

            {/* Analysis Results - Compact */}
            {analysisResult && analysisResult.analysis && (
              <Card title="Kết quả phân tích" size="small" style={{ flex: 2 }}>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Row justify="space-between">
                      <Text strong>Cảm xúc chính:</Text>
                      <Text>{analysisResult.analysis.dominant_emotion_vn}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text strong>Điểm số:</Text>
                      <Text>{(analysisResult.analysis.dominant_emotion_score * 100).toFixed(1)}%</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text strong>Tương tác:</Text>
                      <Text>{analysisResult.analysis.engagement}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text strong>Khuôn mặt:</Text>
                      <Text>{analysisResult.analysis.faces_detected}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text strong>Chất lượng ảnh:</Text>
                      <Text>{(analysisResult.analysis.image_quality * 100).toFixed(1)}%</Text>
                    </Row>
                  </Space>
                </div>
              </Card>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CameraPage;
