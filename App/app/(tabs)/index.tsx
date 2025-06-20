import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

export default function App() {
  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode: "accurate",
    minFaceSize: 0.3,
  }).current;
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const [active, setActive] = useState(false);
  const { detectFaces } = useFaceDetector(faceDetectionOptions);
  const [faces, setFaces] = useState<Face[]>([]);
  const insets = useSafeAreaInsets();

  const renderFaceBoxes = useCallback((_faces: Face[], frame: Frame) => {
    setFaces(_faces);

    // const buffer = frame.toArrayBuffer()
    // const data = new Uint8Array(buffer)

    // setActive(false);
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

  return (
    <View style={{ flex: 1, marginTop: insets.top }}>
      <TouchableOpacity
        onPress={() => setActive(!active)}
        style={{
          padding: 20,
          position: "absolute",
          top: 0,
          right: 0,
          backgroundColor: "red",
          zIndex: 1,
        }}
      >
        <Text>Active</Text>
      </TouchableOpacity>

      {!!device && active ? (
        <Camera
          isActive={active}
          style={StyleSheet.absoluteFill}
          device={device}
          frameProcessor={frameProcessor}
        />
      ) : (
        <Text>No Device</Text>
      )}
      {faces.map((face, index) => {
        const { bounds, pitchAngle = 0, rollAngle = 0 } = face;
        // Heuristic adjustment based on face rotation
        const angleAdjustment = Math.abs(pitchAngle) + Math.abs(rollAngle);
        const padding = angleAdjustment;

        return (
          <View
            key={index}
            style={{
              position: "absolute",
              right: bounds.x - padding - 50,
              top: bounds.y - padding,
              width: bounds.width + padding * 2,
              height: bounds.height + padding * 2,
              borderColor: "red",
              borderWidth: 4,
              borderRadius: 3,
            }}
          />
        );
      })}
    </View>
  );
}
