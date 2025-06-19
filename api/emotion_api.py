import os
import numpy as np
from flask import Flask, request, jsonify
from keras.models import model_from_json
from keras.preprocessing.image import img_to_array
import cv2

# Đường dẫn model (giả định copy từ demo sang api hoặc dùng đường dẫn tuyệt đối)
MODEL_JSON = '../demo/facial_expression_model_structure.json'
MODEL_WEIGHTS = '../demo/facial_expression_model_weights.h5'

EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

# Load model

def load_emotion_model():
    try:
        with open(MODEL_JSON, 'r') as f:
            model_json = f.read()
        model = model_from_json(model_json)
        model.load_weights(MODEL_WEIGHTS)
        print('Model loaded successfully')
        return model
    except Exception as e:
        print(f'Error loading model: {e}')
        return None

emotion_model = load_emotion_model()

# Load face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def preprocess_face(face_img):
    face_img = cv2.resize(face_img, (48, 48))
    if len(face_img.shape) == 3:
        face_img = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
    face_img = face_img.astype('float32') / 255.0
    face_img = np.expand_dims(face_img, axis=-1)
    face_img = np.expand_dims(face_img, axis=0)
    return face_img

def predict_emotion(face_img):
    if emotion_model is None:
        return None, None
    processed_img = preprocess_face(face_img)
    predictions = emotion_model.predict(processed_img, verbose=0)
    emotion_scores = predictions[0]
    dominant_emotion_idx = np.argmax(emotion_scores)
    dominant_emotion = EMOTIONS[dominant_emotion_idx]
    emotions_dict = {emotion: float(score) * 100 for emotion, score in zip(EMOTIONS, emotion_scores)}
    return emotions_dict, dominant_emotion

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    # Đọc file ảnh thành mảng numpy
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({'error': 'Invalid image'}), 400
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    results = []
    for (x, y, w, h) in faces:
        face_img = img[y:y+h, x:x+w]
        emotions, dominant_emotion = predict_emotion(face_img)
        if emotions is not None:
            results.append({
                'box': [int(x), int(y), int(w), int(h)],
                'dominant_emotion': dominant_emotion,
                'emotions': emotions
            })
    return jsonify({'faces': results})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 