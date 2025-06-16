# Hướng dẫn sử dụng hệ thống phát hiện cảm xúc bằng tiếng Việt

## Các file đã được Việt hóa:

### 1. `emotion_translations.py`
File chứa các mapping chuyển đổi cảm xúc từ tiếng Anh sang tiếng Việt:
- `happy` → `Vui vẻ`
- `sad` → `Buồn bã`
- `angry` → `Tức giận`
- `surprise` → `Ngạc nhiên`
- `neutral` → `Bình thường`
- `fear` → `Sợ hãi`
- `disgust` → `Ghê tởm`

### 2. `emotion.py` (Phiên bản gốc)
File demo phát hiện cảm xúc thời gian thực:
- Hiển thị cảm xúc bằng tiếng Anh trong video (để tránh lỗi font)
- Biểu đồ mức độ tham gia bằng tiếng Việt

### 3. `emotion1.py` (Phiên bản gốc)
File demo nâng cao với khả năng lưu dữ liệu CSV:
- Tương tự `emotion.py` nhưng có thêm tính năng lưu dữ liệu
- File CSV được lưu với encoding UTF-8 để hỗ trợ tiếng Việt

### 4. `emotion_vietnamese.py` (PHIÊN BẢN MỚI - Khuyến nghị)
File demo với khả năng hiển thị tiếng Việt trong video:
- Sử dụng PIL để vẽ text tiếng Việt
- Hiển thị cảm xúc và mức độ tham gia bằng tiếng Việt trong video
- Biểu đồ bằng tiếng Việt
- **Yêu cầu**: Cài đặt Pillow: `pip install Pillow`

### 5. `emotion_simple_vietnamese.py` (PHIÊN BẢN ĐƠN GIẢN)
File demo đơn giản hơn:
- Thử hiển thị tiếng Việt trực tiếp với cv2.putText
- Có thể gặp lỗi font trên một số hệ thống
- Biểu đồ bằng tiếng Việt

## Cách sử dụng:

### Chạy demo với tiếng Việt trong video (Khuyến nghị):
```bash
cd demo
pip install Pillow  # Nếu chưa cài
python emotion_vietnamese.py
```

### Chạy demo đơn giản:
```bash
cd demo
python emotion_simple_vietnamese.py
```

### Chạy demo cơ bản (tiếng Anh trong video):
```bash
cd demo
python emotion.py
```

### Chạy demo với lưu dữ liệu:
```bash
cd demo
python emotion1.py
```

## Lưu ý quan trọng:

### Về hiển thị tiếng Việt trong video:
1. **`emotion_vietnamese.py`**: Sử dụng PIL để vẽ text tiếng Việt, ít lỗi nhất
2. **`emotion_simple_vietnamese.py`**: Thử hiển thị trực tiếp, có thể gặp lỗi font
3. **`emotion.py` và `emotion1.py`**: Hiển thị tiếng Anh trong video, tiếng Việt trong biểu đồ

### Nếu gặp lỗi font:
- Sử dụng `emotion_vietnamese.py` (cần cài Pillow)
- Hoặc sử dụng `emotion.py`/`emotion1.py` (tiếng Anh trong video, tiếng Việt trong biểu đồ)

### Cài đặt thêm thư viện:
```bash
pip install Pillow
```

## Sửa notebook:
1. Mở file `FER_LSTM (BiLSTM).ipynb`
2. Thay thế dòng:
   ```python
   label_emotion_mapper = {0:"happy", 1:"neutral", 2:"sleepy", 3:"surprise"}
   ```
   Bằng:
   ```python
   label_emotion_mapper = {0:"Vui vẻ", 1:"Bình thường", 2:"Buồn ngủ", 3:"Ngạc nhiên"}
   ```

3. Thay thế các dòng in ra:
   ```python
   print(f"{k} has {len(v)} samples")
   ```
   Bằng:
   ```python
   vietnamese_names = {"happy": "Vui vẻ", "neutral": "Bình thường", "sleepy": "Buồn ngủ", "surprise": "Ngạc nhiên"}
   print(f"{vietnamese_names.get(k, k)} có {len(v)} mẫu")
   ```

## Lưu ý:
- Đảm bảo webcam hoạt động để chạy demo
- Nhấn 'q' để thoát khỏi demo
- File CSV sẽ được lưu với encoding UTF-8 để hiển thị đúng tiếng Việt
- Các biểu đồ sẽ hiển thị bằng tiếng Việt
- Nếu gặp lỗi font, hãy thử các phiên bản khác nhau 