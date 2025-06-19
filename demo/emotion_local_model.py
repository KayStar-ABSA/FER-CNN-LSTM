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

# Khởi tạo bộ đếm cho mỗi trạng thái tham gia
engaged_count = 0
neutral_count = 0
disengaged_count = 0

# Theo dõi mức độ tham gia theo thời gian
engagement_over_time = defaultdict(lambda: [0, 0, 0])
time_step = 0

# Thu thập dữ liệu cho CSV
csv_data = []

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

# Tải bộ phân loại cascade cho khuôn mặt
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Bắt đầu quay video
cap = cv2.VideoCapture(0)

# Thiết lập hình và biểu đồ cột
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))

def put_vietnamese_text(img, text, position, font_size=32, color=(255, 255, 255)):
    """Hàm để vẽ text tiếng Việt lên ảnh"""
    try:
        # Chuyển đổi BGR sang RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        
        # Tạo font với kích thước phù hợp
        try:
            # Thử sử dụng font Arial Unicode MS nếu có
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                # Thử sử dụng font mặc định của hệ thống
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                # Sử dụng font mặc định
                font = ImageFont.load_default()
        
        # Tạo draw object
        draw = ImageDraw.Draw(pil_img)
        
        # Vẽ text
        draw.text(position, text, font=font, fill=color)
        
        # Chuyển đổi lại sang BGR
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        return img_bgr
    except Exception as e:
        print(f"Lỗi khi vẽ text tiếng Việt: {e}")
        # Fallback: sử dụng cv2.putText với tiếng Anh
        cv2.putText(img, text, position, cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        return img

def preprocess_face(face_img):
    """Tiền xử lý ảnh khuôn mặt cho model"""
    # Resize về 48x48 (kích thước input của model)
    face_img = cv2.resize(face_img, (48, 48))
    
    # Chuyển sang grayscale
    if len(face_img.shape) == 3:
        face_img = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
    
    # Normalize pixel values
    face_img = face_img.astype('float32') / 255.0
    
    # Reshape cho model input (48, 48, 1)
    face_img = np.expand_dims(face_img, axis=-1)
    face_img = np.expand_dims(face_img, axis=0)
    
    return face_img

def predict_emotion(face_img):
    """Dự đoán cảm xúc sử dụng model local"""
    if emotion_model is None:
        return None, None
    
    try:
        # Tiền xử lý ảnh
        processed_img = preprocess_face(face_img)
        
        # Dự đoán
        predictions = emotion_model.predict(processed_img, verbose=0)
        
        # Lấy kết quả
        emotion_scores = predictions[0]
        dominant_emotion_idx = np.argmax(emotion_scores)
        dominant_emotion = EMOTIONS[dominant_emotion_idx]
        
        # Tạo dict kết quả tương tự DeepFace
        emotions_dict = {emotion: float(score) * 100 for emotion, score in zip(EMOTIONS, emotion_scores)}
        
        return emotions_dict, dominant_emotion
    except Exception as e:
        print(f"Error predicting emotion: {e}")
        return None, None

# Hàm cập nhật biểu đồ
def update_chart(frame):
    global engaged_count, neutral_count, disengaged_count, time_step

    # Quay từng khung hình
    ret, frame = cap.read()
    if not ret:
        return

    # Chuyển đổi khung hình sang thang xám
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Chuyển đổi khung hình xám sang định dạng RGB
    rgb_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2RGB)

    # Phát hiện khuôn mặt trong khung hình
    faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    for (x, y, w, h) in faces:
        try:
            # Trích xuất vùng quan tâm của khuôn mặt (ROI)
            face_roi = rgb_frame[y:y + h, x:x + w]

            # Thực hiện phân tích cảm xúc sử dụng model local
            emotions, dominant_emotion = predict_emotion(face_roi)
            
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
                emotion_text = f'{emotion_vn} ({emotions[dominant_emotion]:.2f}%)'
                frame = put_vietnamese_text(frame, emotion_text, (x, y - 10), 24, (0, 0, 255))
                
                # Hiển thị mức độ tham gia bằng tiếng Việt
                frame = put_vietnamese_text(frame, engagement, (x, y - 40), 24, (255, 0, 0))

                # Hiển thị phần trăm cảm xúc ở bên cạnh bằng tiếng Việt
                y0, dy = 30, 30
                for i, (emo, perc) in enumerate(emotions.items()):
                    emo_vn = translate_emotion(emo)
                    text = f'{emo_vn}: {perc:.2f}%'
                    frame = put_vietnamese_text(frame, text, (10, y0 + i * dy), 16, (0, 255, 0))
        except Exception as e:
            print(f"Error processing face: {e}")
            continue

    # Hiển thị khung hình kết quả
    cv2.imshow('Real-time emotion detection (Local Model)', frame)

    # Cập nhật biểu đồ mỗi giây (gần đúng)
    if time_step % 10 == 0:
        ax1.clear()
        ax1.set_title('Biểu đồ mức độ tham gia')
        ax1.set_xlabel('Thời gian (giây)')
        ax1.set_ylabel('Số học sinh tham gia')
        times = sorted(engagement_over_time.keys())
        engaged = [engagement_over_time[t][0] for t in times]
        neutral = [engagement_over_time[t][1] for t in times]
        disengaged = [engagement_over_time[t][2] for t in times]
        ax1.stackplot(times, disengaged, neutral, engaged, labels=['Không tích cực', 'Tích cực', 'Rất tích cực'], colors=['blue', 'orange', 'green'])
        ax1.legend(loc='upper left')

        ax2.clear()
        ax2.set_title('Biểu đồ phân bố học sinh')
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
        cap.release()
        cv2.destroyAllWindows()

        # Lưu hình trước khi đóng
        plt.savefig('engagement_chart.png')

        # Ghi dữ liệu vào file CSV
        with open('engagement_data.csv', 'w', newline='', encoding='utf-8') as csvfile:
            csvwriter = csv.writer(csvfile)
            csvwriter.writerow(['Bước thời gian', 'Cảm xúc chủ đạo', 'Phần trăm cảm xúc', 'Mức độ tham gia'])
            csvwriter.writerows(csv_data)

        plt.close(fig)
        return

# Tạo animation
ani = FuncAnimation(fig, update_chart, interval=100, blit=False)

plt.tight_layout()
plt.show()

# Cleanup
cap.release()
cv2.destroyAllWindows() 