# Nhận diện cảm xúc từ chuỗi biểu cảm khuôn mặt

Hệ thống FER (Facial Emotion Recognition) được phát triển dựa trên mô hình CNN-LSTM (Bi-LSTM), sử dụng chuỗi các biểu cảm khuôn mặt để nhận diện cảm xúc. Kiến trúc đề xuất được trình bày bên dưới, kết quả được lưu trong file FER-LSTM (Bi-LSTM). Công trình này cũng đã được công bố trên tạp chí khoa học, bạn có thể đọc thêm tại [CNN-LSTM (Bi-LSTM)](https://github.com/Mohana-Murugan/FER-CNN-LSTM/blob/main/CNN-LSTM.pdf).

## Liên kết
- [Tài liệu tham khảo](www.google.com)
- ![image](https://github.com/Mohana-Murugan/FER-CNN-LSTM/blob/main/Images/CNN-LSTM(Bi-LSTM).png)

## Hướng dẫn cài đặt

1. **Cài đặt Python** (khuyến nghị Python 3.7 trở lên).
2. **Tạo môi trường ảo Python (khuyến nghị):**
   - Trên Windows:
     ```bash
     python -m venv venv
     source venv/Scripts/activate
     ```
   - Trên macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. **Cài đặt các thư viện cần thiết:**
   - Sử dụng lệnh sau để cài đặt các thư viện:
     ```bash
     pip install -r requirements.txt
     ```
   - Hoặc cài đặt từng thư viện:
     ```bash
     pip install tensorflow keras opencv-python deepface matplotlib numpy
     ```
4. **Tải file Haar Cascade để nhận diện khuôn mặt:**
   - Tải file `haarcascade_frontalface_default.xml` từ [OpenCV GitHub](https://github.com/opencv/opencv/tree/master/data/haarcascades).

## Hướng dẫn sử dụng

1. **Huấn luyện mô hình:**
   - Chạy notebook `FER_LSTM (BiLSTM).ipynb` để huấn luyện mô hình nhận diện cảm xúc từ chuỗi biểu cảm khuôn mặt.
   - Kết quả mô hình sẽ được lưu lại để sử dụng cho nhận diện real-time.

2. **Nhận diện cảm xúc real-time:**
   - Chuyển sang thư mục `FER-Real-time-Testing`.
   - Chạy file `emotion.py` hoặc `emotion1.py` để nhận diện cảm xúc qua webcam:
     ```bash
     python emotion.py
     ```
   - Cảm xúc sẽ được hiển thị trực tiếp trên khung hình webcam.

3. **Tùy chỉnh và mở rộng:**
   - Có thể thay đổi các tham số trong code để phù hợp với dữ liệu hoặc mục đích sử dụng của bạn.

## Đóng góp
Nếu bạn có ý tưởng hoặc muốn đóng góp cho dự án, hãy tạo pull request hoặc liên hệ trực tiếp qua email.


