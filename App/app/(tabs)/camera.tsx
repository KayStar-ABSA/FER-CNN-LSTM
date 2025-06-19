import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, View, Dimensions, Text } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Helper: scale box to camera size
function scaleBox(
  box: number[],
  imageW: number,
  imageH: number,
  viewW: number,
  viewH: number
): number[] {
  // box: [x, y, w, h] trên ảnh gốc (imageW x imageH)
  // viewW, viewH: kích thước camera trên màn hình
  const scaleX = viewW / imageW;
  const scaleY = viewH / imageH;
  return [
    box[0] * scaleX,
    box[1] * scaleY,
    box[2] * scaleX,
    box[3] * scaleY,
  ];
}

export default function CameraTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [imageSize, setImageSize] = useState<{width: number, height: number} | null>(null);
  const [lastPhoto, setLastPhoto] = useState<any>(null);
  const intervalRef = useRef<number | null>(null);
  const cameraViewRef = useRef<any>(null);

  // Bắt đầu sử dụng: xin quyền và bật camera
  const handleStart = async () => {
    if (!permission?.granted) {
      const perm = await requestPermission();
      if (!perm.granted) {
        Alert.alert('Không có quyền truy cập camera');
        return;
      }
    }
    setIsCameraActive(true);
    setResult(null);
    setProcessing(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Không có takePictureAsync, nên phải chụp thủ công bằng nút hoặc snapshot API nếu có
  };

  // Dừng camera
  const handleStop = () => {
    setIsCameraActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Hàm gửi ảnh lên API
  const sendPhotoToAPI = async (photo: any) => {
    if (!photo || !photo.uri) return;
    try {
      setProcessing(true);
      if (photo.width && photo.height) setImageSize({ width: photo.width, height: photo.height });
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: 'frame.jpg',
        type: 'image/jpeg',
      } as any);
      const res = await fetch('http://192.168.1.224:5000/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!res.ok) {
        setResult(null);
        setProcessing(false);
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  };

  // Sự kiện khi chụp ảnh xong (CameraView mới)
  const handleMediaCaptured = (media: any) => {
    setLastPhoto(media);
    sendPhotoToAPI(media);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header hình emotion-icon */}
      <Image
        source={require('@/assets/images/emotion-logo.png')}
        style={styles.headerImageFull}
        contentFit="cover"
      />
      {/* Nút bắt đầu sử dụng nổi bật */}
      {!isCameraActive && (
        <View style={styles.centerPanel}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
            <ThemedText style={styles.startButtonText}>Bắt đầu sử dụng</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {/* Camera */}
      {isCameraActive && (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraViewRef}
            style={styles.camera}
            facing={cameraType}
            enableTorch={false}
            mode="picture"
          />
          {/* Overlay bounding box và cảm xúc */}
          <View style={styles.overlay} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.switchIconBtn}
              onPress={() => setCameraType(cameraType === 'front' ? 'back' : 'front')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="flip-camera-ios" size={32} color="#007AFF" />
            </TouchableOpacity>
            {/* Vẽ bounding box và cảm xúc nếu có khuôn mặt */}
            {result && result.faces && imageSize && result.faces.length > 0 && result.faces.map((face: any, idx: number) => {
              const [x, y, w, h] = scaleBox(face.box, imageSize.width, imageSize.height, width - 24, height * 0.55);
              return (
                <View key={idx} style={[styles.faceBox, { left: x, top: y, width: w, height: h }]}> 
                  <View style={styles.faceBoxRect} />
                  <View style={styles.faceBoxLabel}>
                    <Text style={styles.faceBoxLabelText}>{face.emotion_vn}</Text>
                    <Text style={styles.faceBoxEngagement}>{face.engagement_vn}</Text>
                  </View>
                  <View style={styles.faceBoxEmotions}>
                    {face.emotions && Object.entries(face.emotions).map(([emo, perc]) => (
                      <Text style={styles.faceBoxEmotionText} key={emo}>{emo}: {parseFloat(String(perc)).toFixed(1)}%</Text>
                    ))}
                  </View>
                </View>
              );
            })}
            {/* Nếu không có khuôn mặt */}
            {result && result.faces && result.faces.length === 0 && (
              <View style={styles.noFaceBox}><Text style={styles.noFaceText}>Không phát hiện khuôn mặt</Text></View>
            )}
            {processing && <ActivityIndicator style={styles.loading} />}
            {/* Nút dừng */}
            <TouchableOpacity style={[styles.stopButtonLower]} onPress={handleStop}>
              <MaterialIcons name="stop-circle" size={36} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Nền gradient hoa lá hẹ phủ full màn hình dưới camera */}
      <View style={styles.flowerBg} pointerEvents="none">
        <LinearGradient
          colors={["#f8ffae", "#43c6ac", "#191654", "#ffb6b9", "#f7d6e0", "#b5ead7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFull}
        />
        {/* Các hình tròn pastel lớn nhỏ */}
        <View style={[styles.circle, { backgroundColor: '#ffb6b9', top: 60, left: 20, width: 90, height: 90 }]} />
        <View style={[styles.circle, { backgroundColor: '#f7d6e0', top: 180, right: 40, width: 60, height: 60 }]} />
        <View style={[styles.circle, { backgroundColor: '#b5ead7', bottom: 60, left: width/2 - 60, width: 120, height: 120, opacity: 0.7 }]} />
        <View style={[styles.circle, { backgroundColor: '#f9f871', bottom: 120, right: 30, width: 70, height: 70, opacity: 0.5 }]} />
        {/* Emoji cảm xúc lớn */}
        <Text style={styles.emojiFull}>😊😍🤩🥳😎😇🥰😻</Text>
        {/* Sóng trắng lớn */}
        <View style={styles.waveFull} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImageFull: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
    position: 'relative',
    top: 0,
    left: 0,
    marginBottom: 0,
    zIndex: 10,
  },
  centerPanel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'absolute',
    top: 180,
    left: 0,
    width: '100%',
    height: 120,
    zIndex: 20,
  },
  startButton: {
    backgroundColor: '#ffb347',
    paddingVertical: 22,
    paddingHorizontal: 44,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#ffb347',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 0,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: '#ffcc33',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  cameraContainer: {
    width: width - 24,
    height: height * 0.55,
    borderRadius: 28,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#000',
    position: 'relative',
    zIndex: 2,
  },
  camera: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
    zIndex: 3,
  },
  switchIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    zIndex: 40,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    zIndex: 10,
  },
  stopButtonLower: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 32,
    marginBottom: 8,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 12,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  loading: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
  },
  resultBoxOverlayMulti: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTextOverlayMain: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 6,
  },
  resultTextOverlaySub: {
    color: '#444',
    fontSize: 16,
    marginBottom: 2,
  },
  flowerBg: {
    position: 'absolute',
    top: 180,
    left: 0,
    width: '100%',
    height: height - 180,
    zIndex: 1,
    overflow: 'hidden',
  },
  gradientFull: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.6,
    zIndex: 1,
  },
  emojiFull: {
    fontSize: 48,
    textAlign: 'center',
    marginTop: 180,
    zIndex: 2,
    width: '100%',
  },
  waveFull: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    zIndex: 2,
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 12,
    zIndex: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  faceBoxRect: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 12,
  },
  faceBoxLabel: {
    position: 'absolute',
    top: -38,
    left: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 51,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  faceBoxLabelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  faceBoxEngagement: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
    marginTop: 2,
  },
  faceBoxEmotions: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 51,
  },
  faceBoxEmotionText: {
    color: '#222',
    fontSize: 13,
    fontWeight: '500',
  },
  noFaceBox: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
  },
  noFaceText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
}); 