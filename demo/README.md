# Nhận diện cảm xúc khuôn mặt real-time với OpenCV và DeepFace

Dự án này triển khai hệ thống nhận diện cảm xúc khuôn mặt theo thời gian thực sử dụng thư viện `deepface` và OpenCV. Hệ thống sẽ mở webcam, phát hiện khuôn mặt và dự đoán cảm xúc cho từng khuôn mặt, hiển thị nhãn cảm xúc trực tiếp trên khung hình.

## Phụ thuộc

- [deepface](https://github.com/serengil/deepface): Thư viện phân tích khuôn mặt sử dụng deep learning, cung cấp mô hình nhận diện cảm xúc đã huấn luyện sẵn.
- [OpenCV](https://opencv.org/): Thư viện xử lý ảnh và video mã nguồn mở.
- [matplotlib, numpy]: Hỗ trợ trực quan hóa và xử lý dữ liệu.

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
   - Sử dụng lệnh:
     ```bash
     python -m pip install --upgrade pip
     pip install -r demo/requirements.txt
     ```
   - Hoặc cài đặt từng thư viện:
     ```bash
     pip install deepface opencv-python matplotlib numpy
     ```
4. **Tải file Haar Cascade để nhận diện khuôn mặt:**
   - Tải file `haarcascade_frontalface_default.xml` từ [OpenCV GitHub](https://github.com/opencv/opencv/tree/master/data/haarcascades) và đặt vào thư mục dự án.

## Hướng dẫn sử dụng

1. **Chạy chương trình nhận diện cảm xúc real-time:**
   - Mở terminal/cmd và chuyển vào thư mục này:
     ```bash
     cd demo
     ```
   - Chạy file Python:
     ```bash
     python emotion.py
     ```
   - Hoặc:
     ```bash
     python emotion1.py
     ```
   - Webcam sẽ mở, cảm xúc sẽ được hiển thị trực tiếp trên khung hình quanh các khuôn mặt phát hiện được.
   - Nhấn phím `q` để thoát chương trình.

## Mô tả thuật toán

1. Import các thư viện cần thiết: `cv2` cho xử lý video, `deepface` cho mô hình nhận diện cảm xúc.
2. Tải bộ phân loại Haar Cascade để phát hiện khuôn mặt.
3. Mở webcam và đọc từng khung hình.
4. Chuyển đổi khung hình sang thang xám, phát hiện khuôn mặt.
5. Trích xuất vùng khuôn mặt, dự đoán cảm xúc bằng DeepFace.
6. Vẽ hình chữ nhật và nhãn cảm xúc lên khung hình.
7. Hiển thị khung hình kết quả, nhấn `q` để thoát.

## Đóng góp
Nếu bạn có ý tưởng hoặc muốn đóng góp cho dự án, hãy tạo pull request hoặc liên hệ trực tiếp qua email.

---

![image](https://github.com/manish-9245/Facial-Emotion-Recognition-using-OpenCV-and-Deepface/assets/69393822/57c41270-7575-4bc7-ae7a-99d67239a5ab)



