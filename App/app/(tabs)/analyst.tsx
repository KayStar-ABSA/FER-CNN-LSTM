import { BASE_API, endpoint } from "@/constants/endpoinst";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
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
import { Collapsible } from "@/components/Collapsible";

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

const analyzeEmotion = async (
  imageData: any,
  token: string
): Promise<AnalysisResult> => {
  try {
    console.log(imageData);

    const response = await fetch(`${BASE_API}${endpoint.analyze}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(imageData),
    });

    console.log(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
};

const screenWidth = Dimensions.get("window").width;

// Emotion Analysis Result Component
const EmotionAnalysisResult: React.FC<{ result: AnalysisResult | null }> = ({
  result,
}) => {
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
    <Collapsible title="Kết quả phân tích">
      {!result ? (
        <Text style={{ color: "#888", padding: 8 }}>Chưa có dữ liệu</Text>
      ) : (
        <View style={{ marginLeft: -24, padding: 12 }}>
          {result.results.map((faceResult, index) => (
            <View key={index} style={styles.faceResultContainer}>
              <Text style={styles.faceTitle}>Khuôn mặt {index + 1}</Text>
              <View style={styles.faceContent}>
                <View style={styles.faceLeft}>
                  <View style={styles.emotionItem}>
                    <Text style={styles.emotionLabel}>Cảm xúc chủ đạo:</Text>
                    <View
                      style={[
                        styles.emotionTag,
                        { backgroundColor: "#52c41a" },
                      ]}
                    >
                      <Text style={styles.emotionTagText}>
                        {faceResult.dominant_emotion_vn} (
                        {(faceResult.dominant_emotion_score * 100).toFixed(0)}%)
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
                          <Text style={styles.emotionDetailText}>
                            {emotion}:
                          </Text>
                          <Text style={styles.emotionDetailScore}>
                            {(score * 100).toFixed(0)}%
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${score * 100}%`,
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
            </View>
          ))}
        </View>
      )}
    </Collapsible>
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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const cameraRef = useRef<Camera>(null);

  const toggleCamera = () => {
    if (!hasPermission) {
      requestPermission();
      return;
    }

    if (isCameraActive) {
      setIsCameraActive(false);

      if (isStreaming) {
        toggleStreaming();
      }

      setLoading(false);

      setAnalysisResult(null);
    } else {
      setIsCameraActive(true);
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

      const base64Image = await FileSystem.readAsStringAsync(
        `file://${frame.path}`,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );

      const imageData = {
        image_base64: base64Image,
      };

      if (token) {
        const result = await analyzeEmotion(imageData, token);
        setAnalysisResult(result);
      }
    } catch (error) {
      console.error("Error capturing frame:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderFaceBoxes = useCallback((_faces: Face[], frame: Frame) => {}, []);

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

  return (
    <View style={[styles.container, { marginTop: insets.top }]}>
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
        <View style={styles.resultsCard}>
          <EmotionAnalysisResult
            result={{
              faces_detected: 2,
              results: [
                {
                  face_position: {
                    x: 100,
                    y: 150,
                    width: 80,
                    height: 80,
                  },
                  emotions: {
                    happy: 0.8,
                    sad: 0.1,
                    angry: 0.05,
                  },
                  dominant_emotion: "happy",
                  dominant_emotion_vn: "vui",
                  dominant_emotion_score: 0.8,
                  engagement: "high",
                  emotions_vn: {
                    vui: 0.8,
                    buon: 0.1,
                    tuc_gian: 0.05,
                  },
                },
                {
                  face_position: {
                    x: 300,
                    y: 200,
                    width: 75,
                    height: 75,
                  },
                  emotions: {
                    neutral: 0.7,
                    surprise: 0.2,
                  },
                  dominant_emotion: "neutral",
                  dominant_emotion_vn: "binh_thuong",
                  dominant_emotion_score: 0.7,
                  engagement: "medium",
                  emotions_vn: {
                    binh_thuong: 0.7,
                    bat_ngo: 0.2,
                  },
                },
              ],
              success: true,
              processing_time: 120,
              avg_fps: 24.5,
              image_size: "1280x720",
              cache_hits: 3,
              session_id: 42,
            }}
          />
        </View>
      </View>
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
    width: screenWidth - 32,
    alignSelf: "center",
  },
  resultsCard: {
    padding: 12,
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
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
    backgroundColor: "white",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  progressText: {
    fontSize: 12,
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
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#eee",
    width: "100%",
    alignSelf: "center",
  },
  faceTitle: {
    fontSize: 17,
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
    gap: 12,
  },
  faceRight: {
    flex: 1,
    gap: 12,
  },
  emotionItem: {
    marginBottom: 6,
  },
  emotionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
    fontWeight: "500",
  },
  emotionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  emotionTagText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  emotionDetailScore: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  facePosition: {
    fontSize: 12,
    color: "black",
    marginTop: 4,
    fontWeight: "500",
  },
});
