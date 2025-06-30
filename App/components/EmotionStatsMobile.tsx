import { BASE_API } from "@/constants/endpoinst";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DetectionStats {
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  average_image_quality: number;
}

interface EmotionStats {
  [key: string]: number;
}

interface UserSession {
  id: number;
  session_start: string;
  total_analyses: number;
  successful_detections: number;
  detection_rate: number;
  emotions_summary: { [key: string]: number };
  average_engagement: number;
}

const emotionLabels: { [key: string]: string } = {
  happy: "Vui vẻ",
  sad: "Buồn bã",
  angry: "Giận dữ",
  surprise: "Ngạc nhiên",
  fear: "Sợ hãi",
  disgust: "Ghê tởm",
  neutral: "Bình thường",
};

const getEmotionType = (emotion: string) => {
  if (["happy", "surprise"].includes(emotion)) return "positive";
  if (["sad", "angry", "fear", "disgust"].includes(emotion)) return "negative";
  return "neutral";
};

// Thêm mapping màu sắc cho từng cảm xúc
const emotionColors: { [key: string]: string } = {
  happy: "#52c41a",
  sad: "#1890ff",
  angry: "#ff4d4f",
  surprise: "#faad14",
  fear: "#722ed1",
  disgust: "#eb2f96",
  neutral: "#8c8c8c",
};

const EmotionStatsMobile = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detectionStats, setDetectionStats] = useState<DetectionStats | null>(
    null
  );
  const [emotionStats, setEmotionStats] = useState<EmotionStats>({});
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy thống kê cảm xúc
        const res = await fetch(`${BASE_API}/stats/emotion?filters=%7B%7D`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEmotionStats(data.emotion_stats || {});
        setDetectionStats(data.detection_metrics || {});
        // Lấy lịch sử phiên phân tích
        const resHistory = await fetch(
          `${BASE_API}/stats/history?filters=%7B%22limit%22%3A100%7D`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const dataHistory = await resHistory.json();
        const sessions = (dataHistory.history || []).map(
          (item: any, idx: number) => ({
            id: idx + 1,
            session_start: item.timestamp || new Date().toISOString(),
            total_analyses: 1,
            successful_detections: 1,
            detection_rate: 100,
            emotions_summary: { [item.emotion]: 1 },
            average_engagement: item.score || 0,
          })
        );
        setUserSessions(sessions);
      } catch (e: any) {
        setError("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  // Phân loại cảm xúc
  const emotionCategories: {
    positive: [string, number][];
    negative: [string, number][];
    neutral: [string, number][];
  } = { positive: [], negative: [], neutral: [] };
  Object.entries(emotionStats).forEach(([emotion, count]) => {
    (emotionCategories[getEmotionType(emotion)] as [string, number][]).push([
      emotion,
      count,
    ]);
  });
  const totalPositive = emotionCategories.positive.reduce(
    (sum, [, c]) => sum + c,
    0
  );
  const totalNegative = emotionCategories.negative.reduce(
    (sum, [, c]) => sum + c,
    0
  );
  const totalNeutral = emotionCategories.neutral.reduce(
    (sum, [, c]) => sum + c,
    0
  );

  return (
    <View style={{ marginTop: insets.top }}>
      <ScrollView contentContainerStyle={[styles.container]}>
        <Text style={styles.header}>Thống kê cảm xúc</Text>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            {/* Thẻ số liệu chính */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Tổng phân tích</Text>
                <Text style={styles.statValue}>
                  {detectionStats?.total_analyses || 0} lần
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Phát hiện thành công</Text>
                <Text style={[styles.statValue, { color: "#3f8600" }]}>
                  {detectionStats?.successful_detections || 0} lần
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Tỷ lệ phát hiện</Text>
                <Text style={[styles.statValue, { color: "#cf1322" }]}>
                  {detectionStats?.detection_rate?.toFixed(2) || "0.00"} %
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Chất lượng ảnh TB</Text>
                <Text style={[styles.statValue, { color: "#1890ff" }]}>
                  {detectionStats?.average_image_quality?.toFixed(2) || "0.00"}{" "}
                  %
                </Text>
              </View>
            </View>

            {/* Phân loại cảm xúc */}
            <View style={styles.emotionRow}>
              <View style={styles.emotionCard}>
                <Text style={styles.emotionTitle}>Cảm xúc tích cực</Text>
                <Text style={[styles.emotionTotal, { color: "#52c41a" }]}>
                  Tổng cộng: {totalPositive} lần
                </Text>
                {emotionCategories.positive.map(([e, c]) => (
                  <Text
                    key={e}
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: "white",
                      backgroundColor: emotionColors[e] || "#333",
                      padding: 8,
                      borderRadius: 12,
                      margin: 4,
                      overflow: "hidden",
                      alignSelf: "flex-start",
                    }}
                  >
                    {emotionLabels[e] || e}: {c}
                  </Text>
                ))}
              </View>
              <View style={styles.emotionCard}>
                <Text style={styles.emotionTitle}>Cảm xúc tiêu cực</Text>
                <Text style={[styles.emotionTotal, { color: "#f5222d" }]}>
                  Tổng cộng: {totalNegative} lần
                </Text>
                {emotionCategories.negative.map(([e, c]) => (
                  <Text
                    key={e}
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: "white",
                      backgroundColor: emotionColors[e] || "#333",
                      padding: 8,
                      borderRadius: 12,
                      margin: 4,
                      overflow: "hidden",
                      alignSelf: "flex-start",
                    }}
                  >
                    {emotionLabels[e] || e}: {c}
                  </Text>
                ))}
              </View>
            </View>
            <View style={styles.emotionRow}>
              <View style={styles.emotionCard}>
                <Text style={styles.emotionTitle}>Cảm xúc trung tính</Text>
                <Text style={[styles.emotionTotal, { color: "#8c8c8c" }]}>
                  Tổng cộng: {totalNeutral} lần
                </Text>
                {emotionCategories.neutral.map(([e, c]) => (
                  <Text
                    key={e}
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: "white",
                      backgroundColor: emotionColors[e] || "#333",
                      padding: 8,
                      borderRadius: 12,
                      margin: 4,
                      overflow: "hidden",
                      alignSelf: "flex-start",
                    }}
                  >
                    {emotionLabels[e] || e}: {c}
                  </Text>
                ))}
              </View>
              <View
                style={{ flex: 1, margin: 4, backgroundColor: "transparent" }}
              />
            </View>

            {/* Chi tiết cảm xúc */}
            <Text style={styles.sectionTitle}>Chi Tiết Cảm Xúc</Text>
            <View
              style={[
                styles.detailCard,
                {
                  flexDirection: "row",
                  flexWrap: "wrap",
                  backgroundColor: "transparent",
                  gap: 4,
                },
              ]}
            >
              {Object.entries(emotionStats).length === 0 ? (
                <Text style={{ color: "#aaa" }}>No data</Text>
              ) : (
                Object.entries(emotionStats).map(([e, c]) => (
                  <Text
                    key={e}
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: "white",
                      backgroundColor: emotionColors[e] || "#333",
                      padding: 8,
                      borderRadius: 12,
                    }}
                  >
                    {emotionLabels[e] || e}: {c} lần
                  </Text>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  error: { color: "red", textAlign: "center", marginTop: 20 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    margin: 8,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statLabel: { fontSize: 15, color: "#888", fontWeight: "500" },
  statValue: { fontSize: 22, fontWeight: "bold", marginTop: 4 },
  emotionRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  emotionCard: {
    minWidth: 150,
    maxWidth: 180,
    flex: 1,
    backgroundColor: "#f7f7f7",
    margin: 8,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  emotionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  emotionTotal: { fontSize: 16, marginBottom: 4, fontWeight: "500" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  sessionList: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    padding: 8,
  },
  sessionCell: { flex: 1, fontSize: 12 },
  detailCard: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    // padding: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
});

export default EmotionStatsMobile;
