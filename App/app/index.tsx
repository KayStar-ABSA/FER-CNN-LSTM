import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  Frame,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import {
  Face,
  FaceDetectionOptions,
  useFaceDetector,
} from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import * as FileSystem from "expo-file-system";

// Types
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
  session_id?: number;
}

interface PerformanceStatsType {
  avg_processing_time: number;
  avg_fps: number;
  avg_detection_rate: number;
  total_cache_hits: number;
  avg_cache_hit_rate: number;
  total_analyses: number;
}

type Props = {
  performanceStats: PerformanceStatsType;
  analysisResult: AnalysisResult | null;
  detectionRate: number;
  cameraResolution: string;
};

// API Functions
const API_BASE_URL = "http://localhost:8000";

const analyzeEmotion = async (
  imageData: any,
  token: string
): Promise<AnalysisResult> => {
  console.log("🚀 ~ index.tsx:80 ~ imageData:", imageData);

  try {
    const response = await fetch(`${API_BASE_URL}/analyze-emotion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
};

const getPerformanceStats = async (
  period: string,
  token: string
): Promise<PerformanceStatsType> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/performance-stats/${period}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Performance stats error:", error);
    return {
      avg_processing_time: 0,
      avg_fps: 0,
      avg_detection_rate: 0,
      total_cache_hits: 0,
      avg_cache_hit_rate: 0,
      total_analyses: 0,
    };
  }
};

// Emotion Analysis Result Component
const EmotionAnalysisResult: React.FC<{ result: AnalysisResult | null }> = ({
  result,
}) => {
  if (!result) {
    return (
      <View style={styles.noResultContainer}>
        <Text style={styles.noResultText}>Chưa có kết quả phân tích</Text>
      </View>
    );
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case "Rất tích cực":
        return "#52c41a";
      case "Tích cực":
        return "#faad14";
      case "Không tích cực":
        return "#ff4d4f";
      default:
        return "#1890ff";
    }
  };

  const getEmotionColor = (emotion: string, isDominant: boolean) => {
    if (isDominant) return "#52c41a";

    const emotionColors: { [key: string]: string } = {
      "Vui vẻ": "#52c41a",
      "Buồn bã": "#1890ff",
      "Tức giận": "#ff4d4f",
      "Ngạc nhiên": "#faad14",
      "Bình thường": "#d9d9d9",
      "Sợ hãi": "#722ed1",
      "Ghê tởm": "#eb2f96",
    };

    return emotionColors[emotion] || "#d9d9d9";
  };

  return (
    <ScrollView style={styles.resultContainer}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Khuôn mặt: </Text>
        <View style={styles.faceCountBadge}>
          <Text style={styles.faceCountText}>{result.faces_detected}</Text>
        </View>
      </View>

      {result.results.map((faceResult, index) => (
        <View key={index} style={styles.faceResultContainer}>
          <Text style={styles.faceTitle}>Khuôn mặt {index + 1}</Text>

          <View style={styles.faceContent}>
            <View style={styles.faceLeft}>
              <View style={styles.emotionItem}>
                <Text style={styles.emotionLabel}>Cảm xúc chủ đạo:</Text>
                <View
                  style={[styles.emotionTag, { backgroundColor: "#52c41a" }]}
                >
                  <Text style={styles.emotionTagText}>
                    {faceResult.dominant_emotion_vn} (
                    {faceResult.dominant_emotion_score.toFixed(0)}%)
                  </Text>
                </View>
              </View>

              <View style={styles.emotionItem}>
                <Text style={styles.emotionLabel}>Mức độ tham gia:</Text>
                <View
                  style={[
                    styles.emotionTag,
                    {
                      backgroundColor: getEngagementColor(
                        faceResult.engagement
                      ),
                    },
                  ]}
                >
                  <Text style={styles.emotionTagText}>
                    {faceResult.engagement}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.faceRight}>
              <Text style={styles.emotionLabel}>Chi tiết cảm xúc:</Text>
              {Object.entries(faceResult.emotions_vn)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([emotion, score]) => (
                  <View key={emotion} style={styles.emotionDetail}>
                    <View style={styles.emotionDetailHeader}>
                      <Text style={styles.emotionDetailText}>{emotion}:</Text>
                      <Text style={styles.emotionDetailScore}>
                        {score.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${score}%`,
                            backgroundColor: getEmotionColor(
                              emotion,
                              emotion === faceResult.dominant_emotion_vn
                            ),
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
            </View>
          </View>

          <Text style={styles.facePosition}>
            Vị trí: ({faceResult.face_position.x}, {faceResult.face_position.y})
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

// Performance Statistics Component
const PerformanceStats = ({
  performanceStats,
  analysisResult,
  detectionRate,
  cameraResolution,
}: Props) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Ionicons name="flash" size={16} color="#52c41a" />
        <Text style={styles.statValue}>
          {analysisResult?.avg_fps || performanceStats.avg_fps || 0}
        </Text>
      </View>

      <View style={styles.statItem}>
        <Ionicons name="time" size={16} color="#1890ff" />
        <Text style={styles.statValue}>
          {analysisResult?.processing_time ||
            performanceStats.avg_processing_time ||
            0}
        </Text>
      </View>

      <View style={styles.statItem}>
        <Ionicons name="eye" size={16} color="#faad14" />
        <Text style={styles.statValue}>
          {detectionRate || performanceStats.avg_detection_rate || 0}
        </Text>
      </View>

      <View style={styles.statItem}>
        <Ionicons name="resize" size={16} color="#722ed1" />
        <Text style={styles.statValue}>
          {analysisResult?.image_size || cameraResolution}
        </Text>
      </View>
    </View>
  );
};

export default function App() {
  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode: "accurate",
    minFaceSize: 0.3,
    classificationMode: "all",
    landmarkMode: "all",
    contourMode: "all",
    trackingEnabled: true,
    cameraFacing: "front",
  }).current;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingInterval, setStreamingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const { detectFaces } = useFaceDetector(faceDetectionOptions);
  const [faces, setFaces] = useState<Face[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [totalAnalysisCount, setTotalAnalysisCount] = useState(0);
  const [detectionRate, setDetectionRate] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [cameraResolution, setCameraResolution] = useState("640x480");
  const [dbPerformanceStats, setDbPerformanceStats] =
    useState<PerformanceStatsType>({
      avg_processing_time: 0,
      avg_fps: 0,
      avg_detection_rate: 0,
      total_cache_hits: 0,
      avg_cache_hit_rate: 0,
      total_analyses: 0,
    });
  const insets = useSafeAreaInsets();
  const { token, isLoggedIn } = useAuth();
  const cameraRef = useRef<Camera>(null);

  // Load performance stats from database
  const loadPerformanceStats = async () => {
    if (!token) return;

    try {
      const stats = await getPerformanceStats("week", token);
      setDbPerformanceStats(stats);
    } catch (error) {
      console.error("Error loading performance stats:", error);
    }
  };

  useEffect(() => {
    loadPerformanceStats();
  }, [token]);

  const toggleCamera = () => {
    if (!hasPermission) {
      requestPermission();
      return;
    }

    if (isCameraActive) {
      setIsCameraActive(false);
      toggleStreaming();
      setSavedCount(0);
      setNoFaceCount(0);
      setTotalAnalysisCount(0);
      setDetectionRate(0);
      setCurrentSessionId(null);
      setAnalysisResult(null);
    } else {
      setIsCameraActive(true);
      setCameraResolution("640x480");
    }
  };

  const toggleStreaming = () => {
    if (!isCameraActive) {
      Alert.alert("Lỗi", "Vui lòng bật camera trước");
      return;
    }

    if (isStreaming) {
      if (streamingInterval) {
        clearInterval(streamingInterval);
        setStreamingInterval(null);
      }
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
      const interval = setInterval(() => {
        captureFrame();
      }, 800);
      setStreamingInterval(interval as unknown as NodeJS.Timeout);
    }
  };

  const captureFrame = async () => {
    if (!isCameraActive) return;

    try {
      setLoading(true);
      const frame = await cameraRef.current?.takePhoto({ flash: "off" });

      if (!frame) {
        return;
      }

      // Đọc file ảnh và chuyển đổi thành base64

      const base64Image = await FileSystem.readAsStringAsync(
        `file://${frame.path}`,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );

      const imageData = {
        image: `data:image/jpeg;base64,${base64Image}`,
        save_to_db: true,
        // session_id: currentSessionId,
        camera_resolution: cameraResolution,
        analysis_interval: 1,
      };

      if (token) {
        const result = await analyzeEmotion(imageData, token);
        setAnalysisResult(result);

        if (result.success) {
          setSavedCount((prev) => prev + 1);
          setDetectionRate(
            (prev) => ((prev + 1) / (totalAnalysisCount + 1)) * 100
          );
        } else {
          setNoFaceCount((prev) => prev + 1);
        }
        setTotalAnalysisCount((prev) => prev + 1);

        if (result.session_id) {
          setCurrentSessionId(result.session_id);
        }
      }
    } catch (error) {
      console.error("Error capturing frame:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderFaceBoxes = useCallback((_faces: Face[], frame: Frame) => {
    setFaces(_faces);
  }, []);

  const handleDetectedFacesJS = Worklets.createRunOnJS(renderFaceBoxes);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const objects = detectFaces(frame);
      handleDetectedFacesJS(objects, frame);
    },
    [handleDetectedFacesJS]
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!isLoggedIn) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <View style={[styles.container, { marginTop: insets.top }]}>
      {/* Header */}
      {/* <View style={styles.headerShadow}>
        <View style={styles.headerRow}>
          <Ionicons
            name="camera"
            size={28}
            color="#1890ff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.headerTitle}>Camera Analysis</Text>
        </View>
      </View> */}

      {/* Performance Statistics */}
      {/* <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#e6f7ff" }]}>
          <Ionicons name="flash" size={18} color="#1890ff" />
          <Text style={styles.statValue}>
            {analysisResult?.avg_fps || dbPerformanceStats.avg_fps || 0}
          </Text>
          <Text style={styles.statLabel}>FPS</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#f0f5ff" }]}>
          <Ionicons name="time" size={18} color="#722ed1" />
          <Text style={styles.statValue}>
            {analysisResult?.processing_time ||
              dbPerformanceStats.avg_processing_time ||
              0}
          </Text>
          <Text style={styles.statLabel}>ms</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#fffbe6" }]}>
          <Ionicons name="eye" size={18} color="#faad14" />
          <Text style={styles.statValue}>
            {detectionRate || dbPerformanceStats.avg_detection_rate || 0}
          </Text>
          <Text style={styles.statLabel}>%</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#f9f0ff" }]}>
          <Ionicons name="resize" size={18} color="#722ed1" />
          <Text style={styles.statValue}>
            {analysisResult?.image_size || cameraResolution}
          </Text>
          <Text style={styles.statLabel}>px</Text>
        </View>
      </View> */}

      <View style={styles.mainContent}>
        {/* Camera Section */}
        <View style={styles.cameraSection}>
          <View style={styles.cameraContainerShadow}>
            <View style={styles.cameraContainer}>
              {!!device && isCameraActive ? (
                <Camera
                  ref={cameraRef}
                  isActive={isCameraActive}
                  style={styles.camera}
                  photo={true}
                  device={device}
                  frameProcessor={frameProcessor}
                />
              ) : (
                <View style={styles.noCameraCenter}>
                  <Ionicons name="camera-outline" size={64} color="#ccc" />
                  <Text style={styles.noCameraText}>Camera chưa được bật</Text>
                </View>
              )}
              {/* Performance overlay */}
              {analysisResult && (
                <View style={styles.performanceOverlay}>
                  <Text style={styles.overlayText}>
                    ⚡{" "}
                    {analysisResult?.avg_fps ||
                      dbPerformanceStats.avg_fps?.toFixed(1)}{" "}
                    FPS
                  </Text>
                  <Text style={styles.overlayText}>
                    ⏱️{" "}
                    {analysisResult?.processing_time ||
                      dbPerformanceStats.avg_processing_time?.toFixed(0)}{" "}
                    ms
                  </Text>
                  <Text style={styles.overlayText}>
                    💾 Cache: {analysisResult?.cache_hits || 0}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {/* Camera Controls */}
          <View style={styles.cameraControlsRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isCameraActive ? styles.dangerButton : styles.primaryButton,
              ]}
              onPress={toggleCamera}
            >
              <Ionicons name="camera" size={22} color="white" />
              <Text style={styles.buttonText}>
                {isCameraActive ? "Tắt" : "Bật"}
              </Text>
            </TouchableOpacity>

            {isCameraActive && (
              <TouchableOpacity
                style={[styles.controlButton, styles.defaultButton]}
                onPress={captureFrame}
                disabled={!isCameraActive || loading}
              >
                <Ionicons name="camera-outline" size={22} color="#1890ff" />
                <Text style={[styles.buttonText, { color: "#1890ff" }]}>
                  {loading ? "..." : "Chụp"}
                </Text>
              </TouchableOpacity>
            )}

            {isCameraActive && (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  isStreaming ? styles.dangerButton : styles.defaultButton,
                ]}
                onPress={toggleStreaming}
              >
                {isStreaming ? (
                  <Ionicons name="stop" size={22} color="white" />
                ) : (
                  <Ionicons name="play" size={22} color="#1890ff" />
                )}

                <Text style={[styles.buttonText, { color: "#1890ff" }]}>
                  {isStreaming ? "Tắt" : "Bật"} Stream
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          {/* Statistics */}
          {/* <View style={styles.statisticsCardShadow}>
            <View style={styles.statisticsCard}>
              <Text style={styles.cardTitle}>Thống kê</Text>
              <View style={styles.statisticsContent}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Khuôn mặt đã lưu:</Text>
                  <Text style={styles.statValue}>{savedCount}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Lần phân tích:</Text>
                  <Text style={styles.statValue}>{totalAnalysisCount}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Không phát hiện:</Text>
                  <Text style={styles.statValue}>{noFaceCount}</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${detectionRate}%`,
                          backgroundColor:
                            detectionRate > 80
                              ? "#52c41a"
                              : detectionRate > 50
                              ? "#faad14"
                              : "#ff4d4f",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {detectionRate.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </View> */}
          {/* Session Info */}
          {/* {currentSessionId && (
            <View style={styles.sessionCardShadow}>
              <View style={styles.sessionCard}>
                <Text style={styles.cardTitle}>Thông tin phiên</Text>
                <View style={styles.sessionContent}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Session ID:</Text>
                    <Text style={styles.sessionId}>{currentSessionId}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Trạng thái:</Text>
                    <Text
                      style={[
                        styles.statusText,
                        { color: isStreaming ? "#52c41a" : "#faad14" },
                      ]}
                    >
                      {isStreaming ? "🟢 Đang stream" : "🟡 Sẵn sàng"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )} */}
          {/* Analysis Results */}
          <View style={styles.resultsCardShadow}>
            <View style={styles.resultsCard}>
              <Text style={styles.cardTitle}>Kết quả phân tích</Text>
              <EmotionAnalysisResult result={analysisResult} />
            </View>
          </View>
        </View>
      </View>

      {/* Face Detection Boxes */}
      {/* {isCameraActive &&
        faces.map((face, index) => {
          const { bounds, pitchAngle = 0, rollAngle = 0 } = face;
          const angleAdjustment = Math.abs(pitchAngle) + Math.abs(rollAngle);
          const padding = angleAdjustment;

          return (
            <View
              key={index}
              style={[
                styles.faceBox,
                {
                  right: bounds.x - padding - 50,
                  top: bounds.y - padding,
                  width: bounds.width + padding * 2,
                  height: bounds.height + padding * 2,
                },
              ]}
            />
          );
        })} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  headerShadow: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statsRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  statItem: {
    alignItems: "center",
    padding: 4,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
    // flexDirection: "row",
  },
  cameraSection: {
    flex: 1,
  },
  cameraContainerShadow: {
    flex: 1,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "black",
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  noCameraCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noCameraText: {
    marginTop: 8,
    color: "#999",
    fontSize: 16,
  },
  performanceOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 6,
    borderRadius: 4,
  },
  overlayText: {
    color: "white",
    fontSize: 11,
    marginBottom: 2,
  },
  cameraControlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    position: "absolute",
    bottom: 0,
    padding: 12,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#1890ff",
  },
  dangerButton: {
    backgroundColor: "#ff4d4f",
  },
  defaultButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  resultsSection: {
    padding: 12,
    gap: 8,
    position: "absolute",
    top: 0,
    right: 0,
  },
  statisticsCardShadow: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  statisticsCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  resultsCardShadow: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  resultsCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  statisticsContent: {
    gap: 8,
  },
  sessionCardShadow: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  sessionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  sessionContent: {
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sessionId: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1890ff",
    fontFamily: "monospace",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  faceBox: {
    position: "absolute",
    borderColor: "red",
    borderWidth: 4,
    borderRadius: 3,
  },
  resultContainer: {
    flex: 1,
  },
  noResultContainer: {
    alignItems: "center",
    padding: 20,
  },
  noResultText: {
    color: "#999",
    fontSize: 14,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  faceCountBadge: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  faceCountText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  faceResultContainer: {
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 4,
    backgroundColor: "#fafafa",
  },
  faceTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  faceContent: {
    flexDirection: "row",
  },
  faceLeft: {
    flex: 1,
    marginRight: 8,
  },
  faceRight: {
    flex: 1,
  },
  emotionItem: {
    marginBottom: 6,
  },
  emotionLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  emotionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  emotionTagText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  emotionDetail: {
    marginBottom: 4,
  },
  emotionDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  emotionDetailText: {
    fontSize: 9,
    color: "#666",
  },
  emotionDetailScore: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
  },
  facePosition: {
    fontSize: 9,
    color: "#666",
    marginTop: 4,
  },
});
