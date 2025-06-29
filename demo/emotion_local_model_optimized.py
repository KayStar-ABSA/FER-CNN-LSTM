import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import cv2
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from collections import defaultdict
import csv
from keras.models import model_from_json
from utils.emotion_translations import translate_emotion, get_engagement_vietnamese
from PIL import Image, ImageDraw, ImageFont
import threading
import time
from collections import deque

# Khởi tạo bộ đếm cho mỗi trạng thái tham gia
engaged_count = 0
neutral_count = 0
disengaged_count = 0

# Theo dõi mức độ tham gia theo thời gian
engagement_over_time = defaultdict(lambda: [0, 0, 0])
time_step = 0

# Thu thập dữ liệu cho CSV
csv_data = []

# Cache cho kết quả dự đoán
emotion_cache = {}
cache_size = 10
frame_skip = 2  # Chỉ xử lý 1 frame mỗi 2 frames
frame_count = 0

# Threading cho việc dự đoán cảm xúc
prediction_queue = deque(maxlen=5)
result_queue = deque(maxlen=5)
processing_thread = None
stop_thread = False

# Tải model từ file local
def load_emotion_model():
    """Load model từ file JSON và weights H5"""
    try:
        # Load model structure từ JSON
        with open('facial_expression_model_structure.json', 'r') as f:
            model_json = f.read()
        
        # Tạo model từ JSON
        model = model_from_json(model_json)
        
        # Load weights từ H5
        model.load_weights('facial_expression_model_weights.h5')
        
        print("Model loaded successfully from local files")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

# Load model
emotion_model = load_emotion_model()

# Định nghĩa các cảm xúc
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

# Tải bộ phân loại cascade cho khuôn mặt với tham số tối ưu
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Bắt đầu quay video với độ phân giải thấp hơn để tăng tốc
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Giảm độ phân giải
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)  # Giới hạn FPS

# Thiết lập hình và biểu đồ cột
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))

def put_vietnamese_text(img, text, position, font_size=32, color=(255, 255, 255)):
    """Hàm để vẽ text tiếng Việt lên ảnh - tối ưu hóa"""
    try:
        # Chuyển đổi BGR sang RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        
        # Tạo font với kích thước phù hợp
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        # Tạo draw object
        draw = ImageDraw.Draw(pil_img)
        
        # Vẽ text
        draw.text(position, text, font=font, fill=color)
        
        # Chuyển đổi lại sang BGR
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        return img_bgr
    except Exception as e:
        # Fallback: sử dụng cv2.putText với tiếng Anh
        cv2.putText(img, text, position, cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        return img

def preprocess_face_optimized(face_img):
    """Tiền xử lý ảnh khuôn mặt cho model - tối ưu hóa"""
    # Resize về 48x48 (kích thước input của model)
    face_img = cv2.resize(face_img, (48, 48), interpolation=cv2.INTER_AREA)
    
    # Chuyển sang grayscale
    if len(face_img.shape) == 3:
        face_img = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
    
    # Normalize pixel values
    face_img = face_img.astype('float32') / 255.0
    
    # Reshape cho model input (48, 48, 1)
    face_img = np.expand_dims(face_img, axis=-1)
    face_img = np.expand_dims(face_img, axis=0)
    
    return face_img

def predict_emotion_optimized(face_img):
    """Dự đoán cảm xúc sử dụng model local - tối ưu hóa"""
    if emotion_model is None:
        return None, None
    
    try:
        # Tạo hash cho face_img để cache
        face_hash = hash(face_img.tobytes())
        
        # Kiểm tra cache
        if face_hash in emotion_cache:
            return emotion_cache[face_hash]
        
        # Tiền xử lý ảnh
        processed_img = preprocess_face_optimized(face_img)
        
        # Dự đoán
        predictions = emotion_model.predict(processed_img, verbose=0)
        
        # Lấy kết quả
        emotion_scores = predictions[0]
        dominant_emotion_idx = np.argmax(emotion_scores)
        dominant_emotion = EMOTIONS[dominant_emotion_idx]
        
        # Tạo dict kết quả
        emotions_dict = {emotion: float(score) * 100 for emotion, score in zip(EMOTIONS, emotion_scores)}
        
        result = (emotions_dict, dominant_emotion)
        
        # Lưu vào cache
        if len(emotion_cache) >= cache_size:
            emotion_cache.pop(next(iter(emotion_cache)))
        emotion_cache[face_hash] = result
        
        return result
    except Exception as e:
        print(f"Error predicting emotion: {e}")
        return None, None

def emotion_prediction_worker():
    """Worker thread để xử lý dự đoán cảm xúc"""
    global stop_thread
    while not stop_thread:
        if prediction_queue:
            try:
                face_roi = prediction_queue.popleft()
                result = predict_emotion_optimized(face_roi)
                result_queue.append(result)
            except IndexError:
                pass
        time.sleep(0.01)  # Giảm CPU usage

# Khởi động worker thread
processing_thread = threading.Thread(target=emotion_prediction_worker, daemon=True)
processing_thread.start()

def detect_faces_optimized(gray_frame):
    """Phát hiện khuôn mặt với tham số tối ưu"""
    # Tham số tối ưu cho face detection
    faces = face_cascade.detectMultiScale(
        gray_frame, 
        scaleFactor=1.05,  # Giảm từ 1.1 xuống 1.05 để tăng độ chính xác
        minNeighbors=3,    # Giảm từ 5 xuống 3 để tăng tốc độ
        minSize=(40, 40),  # Tăng kích thước tối thiểu
        maxSize=(300, 300) # Giới hạn kích thước tối đa
    )
    return faces

# Hàm cập nhật biểu đồ tối ưu hóa
def update_chart_optimized(frame):
    global engaged_count, neutral_count, disengaged_count, time_step, frame_count

    # Quay từng khung hình
    ret, frame = cap.read()
    if not ret:
        return

    frame_count += 1
    
    # Skip frames để tăng tốc độ
    if frame_count % frame_skip != 0:
        cv2.imshow('Real-time emotion detection (Optimized)', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            return 'quit'
        return

    # Giảm kích thước frame để tăng tốc độ xử lý
    frame = cv2.resize(frame, (640, 480), interpolation=cv2.INTER_AREA)
    
    # Chuyển đổi khung hình sang thang xám
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Phát hiện khuôn mặt trong khung hình với tham số tối ưu
    faces = detect_faces_optimized(gray_frame)

    # Xử lý kết quả từ queue
    current_results = []
    while result_queue:
        current_results.append(result_queue.popleft())

    for i, (x, y, w, h) in enumerate(faces):
        try:
            # Trích xuất vùng quan tâm của khuôn mặt (ROI)
            face_roi = gray_frame[y:y + h, x:x + w]
            
            # Chuyển sang RGB cho model
            face_roi_rgb = cv2.cvtColor(face_roi, cv2.COLOR_GRAY2RGB)

            # Thêm vào queue để xử lý song song
            if len(prediction_queue) < 3:  # Giới hạn queue size
                prediction_queue.append(face_roi_rgb)

            # Sử dụng kết quả từ queue hoặc dự đoán trực tiếp
            if current_results and i < len(current_results):
                emotions, dominant_emotion = current_results[i]
            else:
                emotions, dominant_emotion = predict_emotion_optimized(face_roi_rgb)
            
            if emotions and dominant_emotion:
                # Dịch cảm xúc sang tiếng Việt
                emotion_vn = translate_emotion(dominant_emotion)

                # Phân loại mức độ tham gia bằng tiếng Việt
                engagement = get_engagement_vietnamese(dominant_emotion, emotions[dominant_emotion])
                
                # Cập nhật bộ đếm
                if engagement == 'Rất tích cực':
                    engaged_count += 1
                elif engagement == 'Tích cực':
                    neutral_count += 1
                else:
                    disengaged_count += 1

                # Cập nhật mức độ tham gia theo thời gian
                engagement_over_time[time_step][0] += 1 if engagement == 'Rất tích cực' else 0
                engagement_over_time[time_step][1] += 1 if engagement == 'Tích cực' else 0
                engagement_over_time[time_step][2] += 1 if engagement == 'Không tích cực' else 0

                # Thu thập dữ liệu cho CSV
                csv_data.append([time_step, emotion_vn, emotions[dominant_emotion], engagement])

                # Vẽ hình chữ nhật xung quanh khuôn mặt
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                
                # Hiển thị cảm xúc bằng tiếng Việt
                emotion_text = f'{emotion_vn} ({emotions[dominant_emotion]:.1f}%)'
                frame = put_vietnamese_text(frame, emotion_text, (x, y - 10), 20, (0, 0, 255))
                
                # Hiển thị mức độ tham gia bằng tiếng Việt
                frame = put_vietnamese_text(frame, engagement, (x, y - 35), 20, (255, 0, 0))

                # Hiển thị FPS và thông tin tối ưu
                fps_text = f'FPS: {30//frame_skip} | Frame: {frame_count}'
                cv2.putText(frame, fps_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        except Exception as e:
            print(f"Error processing face: {e}")
            continue

    # Hiển thị khung hình kết quả
    cv2.imshow('Real-time emotion detection (Optimized)', frame)

    # Cập nhật biểu đồ mỗi 2 giây thay vì mỗi giây
    if time_step % 20 == 0:
        ax1.clear()
        ax1.set_title('Biểu đồ mức độ tham gia (Tối ưu)')
        ax1.set_xlabel('Thời gian (giây)')
        ax1.set_ylabel('Số học sinh tham gia')
        times = sorted(engagement_over_time.keys())
        engaged = [engagement_over_time[t][0] for t in times]
        neutral = [engagement_over_time[t][1] for t in times]
        disengaged = [engagement_over_time[t][2] for t in times]
        ax1.stackplot(times, disengaged, neutral, engaged, labels=['Không tích cực', 'Tích cực', 'Rất tích cực'], colors=['blue', 'orange', 'green'])
        ax1.legend(loc='upper left')

        ax2.clear()
        ax2.set_title('Biểu đồ phân bố học sinh (Tối ưu)')
        total_counts = engaged_count + neutral_count + disengaged_count
        
        # Validate counts before creating pie chart
        counts = [disengaged_count, neutral_count, engaged_count]
        if all(isinstance(count, (int, float)) and count >= 0 for count in counts) and sum(counts) > 0:
            ax2.pie(counts, labels=['Không tích cực', 'Tích cực', 'Rất tích cực'], autopct='%1.2f%%', colors=['blue', 'orange', 'green'])
        else:
            # If no valid data, show a message
            ax2.text(0.5, 0.5, 'Chưa có dữ liệu', ha='center', va='center', transform=ax2.transAxes)
            ax2.set_title('Biểu đồ phân bố học sinh - Chưa có dữ liệu')

    time_step += 1

    # Dừng nếu nhấn 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        return 'quit'

# Tạo animation với interval ngắn hơn
ani = FuncAnimation(fig, update_chart_optimized, interval=33, blit=False)  # ~30 FPS

plt.tight_layout()
plt.show()

# Cleanup
stop_thread = True
if processing_thread:
    processing_thread.join(timeout=1)
cap.release()
cv2.destroyAllWindows()

# Lưu hình trước khi đóng
plt.savefig('engagement_chart_optimized.png')

# Ghi dữ liệu vào file CSV
with open('engagement_data_optimized.csv', 'w', newline='', encoding='utf-8') as csvfile:
    csvwriter = csv.writer(csvfile)
    csvwriter.writerow(['Bước thời gian', 'Cảm xúc chủ đạo', 'Phần trăm cảm xúc', 'Mức độ tham gia'])
    csvwriter.writerows(csv_data)

plt.close(fig) 