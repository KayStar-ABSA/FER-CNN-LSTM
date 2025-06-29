import React, { useRef, useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Spin, message, Row, Col, Progress, Statistic } from 'antd';
import { CameraOutlined, PlayCircleOutlined, StopOutlined, VideoCameraOutlined, DatabaseOutlined, ExclamationCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { analyzeEmotion, getPerformanceStats } from '../utils/api';
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
  processing_time?: number;
  avg_fps?: number;
  image_size?: string;
  cache_hits?: number;
}

interface PerformanceStats {
  avg_processing_time: number;
  avg_fps: number;
  avg_detection_rate: number;
  total_cache_hits: number;
  avg_cache_hit_rate: number;
  total_analyses: number;
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
  const [cameraResolution, setCameraResolution] = useState<string>('640x480');
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    avg_processing_time: 0,
    avg_fps: 0,
    avg_detection_rate: 0,
    total_cache_hits: 0,
    avg_cache_hit_rate: 0,
    total_analyses: 0
  });
  const [dbPerformanceStats, setDbPerformanceStats] = useState<PerformanceStats>({
    avg_processing_time: 0,
    avg_fps: 0,
    avg_detection_rate: 0,
    total_cache_hits: 0,
    avg_cache_hit_rate: 0,
    total_analyses: 0
  });

  // Load performance stats from database
  const loadPerformanceStats = async () => {
    try {
      const stats = await getPerformanceStats('week');
      setDbPerformanceStats(stats);
    } catch (error) {
      console.error('Error loading performance stats:', error);
    }
  };

  // Load stats on component mount
  useEffect(() => {
    loadPerformanceStats();
  }, []);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },  // Giảm độ phân giải để tăng tốc
            height: { ideal: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30 }  // Giới hạn FPS
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
    setPerformanceStats({
      avg_processing_time: 0,
      avg_fps: 0,
      avg_detection_rate: 0,
      total_cache_hits: 0,
      avg_cache_hit_rate: 0,
      total_analyses: 0
    });
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
    }, 800); // Giảm xuống 800ms (1.25 FPS) để tăng tần suất phân tích
    setStreamInterval(interval);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Giảm kích thước canvas để tăng tốc độ xử lý
    const canvasWidth = 640;
    const canvasHeight = 480;
    
    ctx.drawImage(videoRef.current, 0, 0, canvasWidth, canvasHeight);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8); // Giảm chất lượng ảnh để tăng tốc
    
    try {
      const startTime = performance.now();
      
      const data = await analyzeEmotion({ 
        image: dataUrl,
        save_to_db: true,
        session_id: currentSessionId,
        camera_resolution: cameraResolution,
        analysis_interval: 0.8
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Cập nhật session_id nếu có
      if (data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
      }
      
      setAnalysisResult(data);
      setTotalAnalysisCount(prev => prev + 1);
      
      // Cập nhật thống kê hiệu suất từ backend response
      if (data.processing_time || data.avg_fps) {
        setPerformanceStats(prev => {
          const newTotalTime = prev.avg_processing_time * prev.total_analyses + (data.processing_time || processingTime);
          const newTotalAnalyses = prev.total_analyses + 1;
          const newAvgTime = newTotalTime / newTotalAnalyses;
          const newAvgFPS = data.avg_fps || (1000 / newAvgTime);
          
          return {
            avg_processing_time: newAvgTime,
            avg_fps: newAvgFPS,
            avg_detection_rate: prev.avg_detection_rate,
            total_cache_hits: prev.total_cache_hits + (data.cache_hits || 0),
            avg_cache_hit_rate: ((prev.total_cache_hits + (data.cache_hits || 0)) / newTotalAnalyses) * 100,
            total_analyses: newTotalAnalyses
          };
        });
      }
      
      // Đếm số kết quả đã lưu
      if (data.faces_detected > 0) {
        setSavedCount(prev => prev + data.faces_detected);
        // Hiển thị thông báo thỉnh thoảng
        if (Math.random() < 0.05) { // 5% chance
          message.success(`Phát hiện ${data.faces_detected} khuôn mặt! (${data.processing_time}ms)`, 1);
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
      
      // Reload performance stats from database every 10 analyses
      if (totalAnalysisCount % 10 === 0) {
        loadPerformanceStats();
      }
      
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
    
    // Giảm kích thước canvas
    const canvasWidth = 640;
    const canvasHeight = 480;
    
    ctx.drawImage(videoRef.current, 0, 0, canvasWidth, canvasHeight);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    
    setLoading(true);
    try {
      const startTime = performance.now();
      
      const data = await analyzeEmotion({ 
        image: dataUrl,
        save_to_db: true,
        session_id: currentSessionId,
        camera_resolution: cameraResolution,
        analysis_interval: null
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Cập nhật session_id nếu có
      if (data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
      }
      
      setAnalysisResult(data);
      setTotalAnalysisCount(prev => prev + 1);
      
      // Cập nhật thống kê hiệu suất từ backend response
      if (data.processing_time || data.avg_fps) {
        setPerformanceStats(prev => {
          const newTotalTime = prev.avg_processing_time * prev.total_analyses + (data.processing_time || processingTime);
          const newTotalAnalyses = prev.total_analyses + 1;
          const newAvgTime = newTotalTime / newTotalAnalyses;
          const newAvgFPS = data.avg_fps || (1000 / newAvgTime);
          
          return {
            avg_processing_time: newAvgTime,
            avg_fps: newAvgFPS,
            avg_detection_rate: prev.avg_detection_rate,
            total_cache_hits: prev.total_cache_hits + (data.cache_hits || 0),
            avg_cache_hit_rate: ((prev.total_cache_hits + (data.cache_hits || 0)) / newTotalAnalyses) * 100,
            total_analyses: newTotalAnalyses
          };
        });
      }
      
      if (data.faces_detected > 0) {
        message.success(`Phát hiện ${data.faces_detected} khuôn mặt và đã lưu vào database! (${data.processing_time || processingTime.toFixed(0)}ms)`);
        setSavedCount(prev => prev + data.faces_detected);
      } else {
        message.warning('Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng và đủ ánh sáng.');
        setNoFaceCount(prev => prev + 1);
      }
      
      // Cập nhật tỷ lệ phát hiện
      const total = totalAnalysisCount + 1;
      const detected = total - noFaceCount;
      setDetectionRate((detected / total) * 100);
      
      // Reload performance stats from database
      loadPerformanceStats();
      
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
              value={analysisResult?.avg_fps || performanceStats.avg_fps || dbPerformanceStats.avg_fps}
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
              value={analysisResult?.processing_time || performanceStats.avg_processing_time || dbPerformanceStats.avg_processing_time}
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
              value={detectionRate || dbPerformanceStats.avg_detection_rate}
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
              value={analysisResult?.image_size || cameraResolution}
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
                  <div>⚡ {analysisResult?.avg_fps || performanceStats.avg_fps?.toFixed(1)} FPS</div>
                  <div>⏱️ {analysisResult?.processing_time || performanceStats.avg_processing_time?.toFixed(0)}ms</div>
                  <div>💾 Cache: {analysisResult?.cache_hits || 0}</div>
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
                onClick={startStreaming}
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
                  <Text strong>Khuôn mặt đã lưu:</Text>
                  <Text>{savedCount}</Text>
                </Row>
                <Row justify="space-between">
                  <Text strong>Lần phân tích:</Text>
                  <Text>{totalAnalysisCount}</Text>
                </Row>
                <Row justify="space-between">
                  <Text strong>Không phát hiện:</Text>
                  <Text>{noFaceCount}</Text>
                </Row>
                <Progress
                  percent={detectionRate}
                  status={detectionRate > 80 ? 'success' : detectionRate > 50 ? 'normal' : 'exception'}
                  format={(percent) => `${percent?.toFixed(1)}%`}
                  size="small"
                />
              </Space>
            </Card>

            {/* Session Info - Compact */}
            {currentSessionId && (
              <Card title="Thông tin phiên" size="small" style={{ flex: 1 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row justify="space-between">
                    <Text strong>Session ID:</Text>
                    <Text code>{currentSessionId}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text strong>Trạng thái:</Text>
                    <Text style={{ color: isStreaming ? '#52c41a' : '#faad14' }}>
                      {isStreaming ? '🟢 Đang stream' : '🟡 Sẵn sàng'}
                    </Text>
                  </Row>
                </Space>
              </Card>
            )}

            {/* Analysis Results - Compact */}
            {analysisResult && (
              <Card title="Kết quả phân tích" size="small" style={{ flex: 2 }}>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <EmotionAnalysisResult result={analysisResult} />
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
