import cv2
from deepface import DeepFace
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from collections import defaultdict
import numpy as np
from emotion_translations import translate_emotion, get_engagement_vietnamese

# Khởi tạo bộ đếm cho mỗi trạng thái tham gia
engaged_count = 0
neutral_count = 0
disengaged_count = 0

# Theo dõi mức độ tham gia theo thời gian
engagement_over_time = defaultdict(lambda: [0, 0, 0])
time_step = 0

# Tải bộ phân loại cascade cho khuôn mặt
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Bắt đầu quay video
cap = cv2.VideoCapture(0)

# Thiết lập hình và biểu đồ cột
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))

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

            # Thực hiện phân tích cảm xúc trên vùng khuôn mặt
            result = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)

            # Lấy dự đoán cảm xúc
            emotions = result[0]['emotion']

            # Xác định cảm xúc chủ đạo
            emotion = result[0]['dominant_emotion']
            emotion_vn = translate_emotion(emotion)

            # Phân loại mức độ tham gia bằng tiếng Việt
            engagement = get_engagement_vietnamese(emotion, emotions[emotion])
            
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

            # Vẽ hình chữ nhật xung quanh khuôn mặt
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
            
            # Hiển thị cảm xúc bằng tiếng Việt (sử dụng cv2.putText với font Unicode)
            emotion_text = f'{emotion_vn} ({emotions[emotion]:.2f}%)'
            cv2.putText(frame, emotion_text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            
            # Hiển thị mức độ tham gia bằng tiếng Việt
            cv2.putText(frame, engagement, (x, y - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)

            # Hiển thị phần trăm cảm xúc ở bên cạnh bằng tiếng Việt
            y0, dy = 30, 30
            for i, (emo, perc) in enumerate(emotions.items()):
                emo_vn = translate_emotion(emo)
                text = f'{emo_vn}: {perc:.2f}%'
                cv2.putText(frame, text, (10, y0 + i * dy), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        except Exception as e:
            print(f"Error processing face: {e}")
            continue

    # Hiển thị khung hình kết quả
    cv2.imshow('Phát hiện cảm xúc thời gian thực', frame)

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

    # Tăng bước thời gian
    time_step += 1

    # Nhấn 'q' để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        cap.release()
        cv2.destroyAllWindows()
        plt.close(fig)
        return

# Cập nhật biểu đồ mỗi 100 mili giây
ani = FuncAnimation(fig, update_chart, interval=100)

# Hiển thị biểu đồ
plt.show() 