import cv2
from deepface import DeepFace
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from collections import defaultdict
import numpy as np
import csv

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

# Thu thập dữ liệu cho CSV
csv_data = []

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

            # Phân loại mức độ tham gia
            if emotion in ['happy', 'surprise', 'fear'] and emotions[emotion] > 80:
                engagement = 'Highly engaged'
                engaged_count += 1
            elif emotion == 'neutral' and emotions['neutral'] > 50:
                engagement = 'Engaged'
                neutral_count += 1
            else:
                engagement = 'Disengaged'
                disengaged_count += 1

            # Cập nhật mức độ tham gia theo thời gian
            engagement_over_time[time_step][0] += 1 if engagement == 'Highly engaged' else 0
            engagement_over_time[time_step][1] += 1 if engagement == 'Engaged' else 0
            engagement_over_time[time_step][2] += 1 if engagement == 'Disengaged' else 0

            # Thu thập dữ liệu cho CSV
            csv_data.append([time_step, emotion, emotions[emotion], engagement])

            # Vẽ hình chữ nhật xung quanh khuôn mặt và gắn nhãn với cảm xúc dự đoán
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.putText(frame, f'{emotion} ({emotions[emotion]:.2f}%)', (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            cv2.putText(frame, engagement, (x, y - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)

            # Hiển thị phần trăm cảm xúc ở bên cạnh
            y0, dy = 30, 30
            for i, (emo, perc) in enumerate(emotions.items()):
                text = f'{emo}: {perc:.2f}%'
                cv2.putText(frame, text, (10, y0 + i * dy), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        except Exception as e:
            print(f"Error processing face: {e}")
            continue

    # Hiển thị khung hình kết quả
    cv2.imshow('Real-time Emotion Detection', frame)

    # Cập nhật biểu đồ mỗi giây (gần đúng)
    if time_step % 10 == 0:
        ax1.clear()
        ax1.set_title('Engagement Visualization')
        ax1.set_xlabel('Time (sec)')
        ax1.set_ylabel('Student Engagements')
        times = sorted(engagement_over_time.keys())
        engaged = [engagement_over_time[t][0] for t in times]
        neutral = [engagement_over_time[t][1] for t in times]
        disengaged = [engagement_over_time[t][2] for t in times]
        ax1.stackplot(times, disengaged, neutral, engaged, labels=['Disengaged', 'Engaged', 'Highly Engaged'], colors=['blue', 'orange', 'green'])
        ax1.legend(loc='upper left')

        ax2.clear()
        ax2.set_title('Visualization for Student')
        total_counts = engaged_count + neutral_count + disengaged_count
        
        # Validate counts before creating pie chart
        counts = [disengaged_count, neutral_count, engaged_count]
        if all(isinstance(count, (int, float)) and count >= 0 for count in counts) and sum(counts) > 0:
            ax2.pie(counts, labels=['Disengaged', 'Engaged', 'Highly Engaged'], autopct='%1.2f%%', colors=['blue', 'orange', 'green'])
        else:
            # If no valid data, show a message
            ax2.text(0.5, 0.5, 'No data available', ha='center', va='center', transform=ax2.transAxes)
            ax2.set_title('Visualization for Student - No Data')

    # Tăng bước thời gian
    time_step += 1

    # Nhấn 'q' để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        cap.release()
        cv2.destroyAllWindows()

        # Lưu hình trước khi đóng
        plt.savefig('engagement_chart.png')

        # Ghi dữ liệu vào file CSV
        with open('engagement_data.csv', 'w', newline='') as csvfile:
            csvwriter = csv.writer(csvfile)
            csvwriter.writerow(['Time Step', 'Dominant Emotion', 'Emotion Percentage', 'Engagement'])
            csvwriter.writerows(csv_data)

        plt.close(fig)
        return

# Cập nhật biểu đồ mỗi 100 mili giây
ani = FuncAnimation(fig, update_chart, interval=100)

# Hiển thị biểu đồ
plt.show()