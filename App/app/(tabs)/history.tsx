import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import dayjs from "dayjs";
import { BASE_API } from "@/constants/endpoinst";

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

const emotionColors: { [key: string]: string } = {
  happy: "#52c41a",
  sad: "#1890ff",
  angry: "#ff4d4f",
  surprise: "#faad14",
  fear: "#722ed1",
  disgust: "#eb2f96",
  neutral: "#8c8c8c",
};

const HistoryScreen = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // 2 box mỗi dòng, 5 dòng mỗi trang = 10 box mỗi trang

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_API}/stats/history?filters=%7B%22limit%22%3A100%7D`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const dataHistory = await res.json();
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
    if (token) fetchHistory();
  }, [token]);

  const pagedSessions = userSessions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const totalPages = Math.ceil(userSessions.length / pageSize);

  // Render 2 box mỗi dòng
  const renderSessionRows = () => {
    const rows = [];
    for (let i = 0; i < pagedSessions.length; i += 2) {
      rows.push(
        <View style={styles.sessionRow} key={i}>
          <View style={styles.sessionCard}>
            <Text style={styles.sessionLabel}>Thời gian:</Text>
            <Text>
              {dayjs(pagedSessions[i].session_start).format("HH:mm DD/MM/YYYY")}
            </Text>
            <Text style={styles.sessionLabel}>Tổng phân tích:</Text>
            <Text>{pagedSessions[i].total_analyses}</Text>
            <Text style={styles.sessionLabel}>Phát hiện thành công:</Text>
            <Text>{pagedSessions[i].successful_detections}</Text>
            <Text style={styles.sessionLabel}>Tỷ lệ phát hiện:</Text>
            <Text>{pagedSessions[i].detection_rate}%</Text>
            <Text style={styles.sessionLabel}>Cảm xúc:</Text>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2 }}
            >
              {Object.keys(pagedSessions[i].emotions_summary).map((e) => (
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
                  {emotionLabels[e] || e}
                </Text>
              ))}
            </View>
          </View>
          {pagedSessions[i + 1] ? (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>Thời gian:</Text>
              <Text>
                {dayjs(pagedSessions[i + 1].session_start).format(
                  "HH:mm DD/MM/YYYY"
                )}
              </Text>
              <Text style={styles.sessionLabel}>Tổng phân tích:</Text>
              <Text>{pagedSessions[i + 1].total_analyses}</Text>
              <Text style={styles.sessionLabel}>Phát hiện thành công:</Text>
              <Text>{pagedSessions[i + 1].successful_detections}</Text>
              <Text style={styles.sessionLabel}>Tỷ lệ phát hiện:</Text>
              <Text>{pagedSessions[i + 1].detection_rate}%</Text>
              <Text style={styles.sessionLabel}>Cảm xúc:</Text>
              <View
                style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2 }}
              >
                {Object.keys(pagedSessions[i + 1].emotions_summary).map((e) => (
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
                    {emotionLabels[e] || e}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <View
              style={{ flex: 1, margin: 6, backgroundColor: "transparent" }}
            />
          )}
        </View>
      );
    }
    return rows;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Lịch sử phiên phân tích</Text>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {userSessions.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#aaa" }}>No data</Text>
          ) : (
            renderSessionRows()
          )}
          {/* Phân trang */}
          <View style={styles.paginationRow}>
            <Text
              style={styles.pageBtn}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              {"<"}
            </Text>
            <Text style={styles.pageNum}>
              {page} / {totalPages || 1}
            </Text>
            <Text
              style={styles.pageBtn}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {">"}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  error: { color: "red", textAlign: "center", marginTop: 20 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    margin: 6,
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    maxWidth: 180,
  },
  sessionLabel: { fontWeight: "bold", fontSize: 13, marginTop: 4 },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    paddingBottom: 16,
  },
  pageBtn: {
    fontSize: 18,
    marginHorizontal: 16,
    color: "#0a7ea4",
    fontWeight: "bold",
  },
  pageNum: { fontSize: 16, color: "#333" },
});

export default HistoryScreen;
