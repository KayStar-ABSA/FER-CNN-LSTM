import cv2
import numpy as np
from keras.models import model_from_json
import os
from PIL import Image
import io
import base64

# Định nghĩa các cảm xúc
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

# Mapping cảm xúc từ tiếng Anh sang tiếng Việt
EMOTION_TRANSLATIONS = {
    'happy': 'Vui vẻ',
    'sad': 'Buồn bã',
    'angry': 'Tức giận',
    'surprise': 'Ngạc nhiên',
    'neutral': 'Bình thường',
    'fear': 'Sợ hãi',
    'disgust': 'Ghê tởm'
}

class EmotionService:
    def __init__(self):
        self.emotion_model = None
        self.face_cascade = None
        self.load_model()
        self.load_face_cascade()
    
    def load_model(self):
        """Load model từ file JSON và weights H5"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'models')
            
            # Load model structure từ JSON
            with open(os.path.join(model_path, 'facial_expression_model_structure.json'), 'r') as f:
                model_json = f.read()
            
            # Tạo model từ JSON
            self.emotion_model = model_from_json(model_json)
            
            # Load weights từ H5
            self.emotion_model.load_weights(os.path.join(model_path, 'facial_expression_model_weights.h5'))
            
            print("Model loaded successfully from local files")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.emotion_model = None
    
    def load_face_cascade(self):
        """Load bộ phân loại cascade cho khuôn mặt"""
        try:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        except Exception as e:
            print(f"Error loading face cascade: {e}")
            self.face_cascade = None
    
    def preprocess_face(self, face_img):
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
    
    def predict_emotion(self, face_img):
        """Dự đoán cảm xúc sử dụng model local"""
        if self.emotion_model is None:
            return None, None
        
        try:
            # Tiền xử lý ảnh
            processed_img = self.preprocess_face(face_img)
            
            # Dự đoán
            predictions = self.emotion_model.predict(processed_img, verbose=0)
            
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
    
    def get_engagement_vietnamese(self, emotion, emotion_percentage):
        """Xác định mức độ tham gia bằng tiếng Việt dựa trên cảm xúc"""
        if emotion in ['happy', 'surprise', 'fear'] and emotion_percentage > 80:
            return 'Rất tích cực'
        elif emotion == 'neutral' and emotion_percentage > 50:
            return 'Tích cực'
        else:
            return 'Không tích cực'
    
    def translate_emotion(self, emotion_en):
        """Chuyển đổi cảm xúc từ tiếng Anh sang tiếng Việt"""
        return EMOTION_TRANSLATIONS.get(emotion_en, emotion_en)
    
    def analyze_image(self, image_data):
        """Phân tích ảnh và trả về kết quả cảm xúc"""
        try:
            # Decode base64 image
            if isinstance(image_data, str):
                if ',' in image_data:
                    header, encoded = image_data.split(",", 1)
                    img_bytes = base64.b64decode(encoded)
                else:
                    img_bytes = base64.b64decode(image_data)
            else:
                img_bytes = image_data
            
            # Convert to PIL Image
            img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            img_array = np.array(img)
            
            # Convert to grayscale for face detection
            gray_img = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            if self.face_cascade is None:
                return {"error": "Face cascade not loaded"}
            
            faces = self.face_cascade.detectMultiScale(
                gray_img, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            
            results = []
            
            for (x, y, w, h) in faces:
                # Extract face ROI
                face_roi = img_array[y:y+h, x:x+w]
                
                # Predict emotion
                emotions, dominant_emotion = self.predict_emotion(face_roi)
                
                if emotions and dominant_emotion:
                    # Translate emotion to Vietnamese
                    emotion_vn = self.translate_emotion(dominant_emotion)
                    
                    # Get engagement level
                    engagement = self.get_engagement_vietnamese(dominant_emotion, emotions[dominant_emotion])
                    
                    # Create result object
                    result = {
                        "face_position": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                        "emotions": emotions,
                        "dominant_emotion": dominant_emotion,
                        "dominant_emotion_vn": emotion_vn,
                        "dominant_emotion_score": emotions[dominant_emotion],
                        "engagement": engagement,
                        "emotions_vn": {self.translate_emotion(emo): score for emo, score in emotions.items()}
                    }
                    
                    results.append(result)
            
            return {
                "faces_detected": len(faces),
                "results": results,
                "success": True
            }
            
        except Exception as e:
            print(f"Error analyzing image: {e}")
            return {"error": str(e), "success": False}

# Tạo instance global
emotion_service = EmotionService() 