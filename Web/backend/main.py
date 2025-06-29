import models
import database
import crud
import auth
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from pydantic import BaseModel
from emotion_service import emotion_service

class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

class UserUpdate(BaseModel):
    password: str = None
    is_admin: bool = None

database.Base.metadata.create_all(bind=database.engine)

# Tạo tài khoản admin mặc định nếu chưa có
with database.SessionLocal() as db:
    if not crud.get_user_by_username(db, "admin"):
        crud.create_user(db, "admin", "123", is_admin=True)

app = FastAPI()

# Cho phép frontend kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"msg": "FER-CNN-LSTM Admin Backend is running!"}

@app.post("/register")
def register(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    if crud.get_user_by_username(db, form_data.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    user = crud.create_user(db, form_data.username, form_data.password)
    return {"msg": "User created successfully"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "is_admin": user.is_admin}

@app.post("/emotion")
def save_emotion(emotion: str, score: float = None, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    result = crud.create_emotion_result(db, user_id=current_user.id, emotion=emotion, score=score)
    return {"msg": "Emotion saved", "id": result.id}

@app.get("/stats/{period}")
def get_stats(period: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    stats = crud.get_emotion_stats(db, user_id=current_user.id, period=period)
    return stats

@app.get("/detection-stats/{period}")
def get_detection_stats(period: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Lấy thống kê tỷ lệ phát hiện khuôn mặt"""
    stats = crud.get_detection_stats(db, user_id=current_user.id, period=period)
    return stats

@app.get("/engagement-stats/{period}")
def get_engagement_stats(period: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Lấy thống kê mức độ tương tác"""
    stats = crud.get_engagement_stats(db, user_id=current_user.id, period=period)
    return stats

@app.get("/user-sessions")
def get_user_sessions(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Lấy danh sách phiên phân tích của user"""
    sessions = crud.get_user_sessions(db, user_id=current_user.id, limit=20)
    return [
        {
            "id": session.id,
            "session_start": session.session_start,
            "session_end": session.session_end,
            "total_analyses": session.total_analyses,
            "successful_detections": session.successful_detections,
            "failed_detections": session.failed_detections,
            "detection_rate": session.detection_rate,
            "emotions_summary": session.emotions_summary,
            "average_engagement": session.average_engagement,
            "camera_resolution": session.camera_resolution,
            "analysis_interval": session.analysis_interval
        }
        for session in sessions
    ]

@app.get("/admin/stats/{period}")
def get_admin_stats(period: str, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(database.get_db)):
    stats = crud.get_all_emotion_stats(db, period=period)
    return stats

@app.get("/admin/user-stats/{user_id}/{period}")
def get_user_stats_by_admin(user_id: int, period: str, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(database.get_db)):
    """Admin xem thống kê của một user cụ thể"""
    # Kiểm tra user có tồn tại không
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Lấy thống kê cảm xúc
    emotion_stats = crud.get_emotion_stats(db, user_id=user_id, period=period)
    detection_stats = crud.get_detection_stats(db, user_id=user_id, period=period)
    engagement_stats = crud.get_engagement_stats(db, user_id=user_id, period=period)
    
    return {
        "user": {"id": user.id, "username": user.username, "is_admin": user.is_admin},
        "emotion_stats": emotion_stats,
        "detection_stats": detection_stats,
        "engagement_stats": engagement_stats
    }

@app.get("/admin/all-users-stats/{period}")
def get_all_users_stats(period: str, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(database.get_db)):
    """Admin xem thống kê tổng hợp của tất cả users"""
    users = crud.get_all_users(db)
    all_stats = []
    
    for user in users:
        emotion_stats = crud.get_emotion_stats(db, user_id=user.id, period=period)
        detection_stats = crud.get_detection_stats(db, user_id=user.id, period=period)
        engagement_stats = crud.get_engagement_stats(db, user_id=user.id, period=period)
        
        all_stats.append({
            "user": {"id": user.id, "username": user.username, "is_admin": user.is_admin},
            "emotion_stats": emotion_stats,
            "detection_stats": detection_stats,
            "engagement_stats": engagement_stats
        })
    
    return all_stats

@app.get("/admin/users")
def get_all_users(current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(database.get_db)):
    users = crud.get_all_users(db)
    return [{"id": u.id, "username": u.username, "is_admin": u.is_admin} for u in users]

@app.get("/admin/users/{user_id}")
def get_user_detail(user_id: int, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username, "is_admin": user.is_admin}

@app.post("/admin/users")
def create_user(user: UserCreate, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(database.get_db)):
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = crud.create_user(db, user.username, user.password, user.is_admin)
    return {"id": new_user.id, "username": new_user.username, "is_admin": new_user.is_admin}

@app.put("/admin/users/{user_id}")
def update_user(user_id: int, user: UserUpdate, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.password:
        db_user.password_hash = auth.get_password_hash(user.password)
    if user.is_admin is not None:
        db_user.is_admin = user.is_admin
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "username": db_user.username, "is_admin": db_user.is_admin}

@app.post("/sample-data")
def create_sample_data(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Tạo dữ liệu mẫu cho testing"""
    import random
    from datetime import datetime, timedelta
    
    emotions = ["happy", "sad", "angry", "surprised", "fear", "disgust", "neutral"]
    
    # Tạo dữ liệu cho 7 ngày qua
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        for _ in range(random.randint(1, 5)):  # 1-5 emotions per day
            emotion = random.choice(emotions)
            crud.create_emotion_result(db, user_id=current_user.id, emotion=emotion, score=random.uniform(0.5, 1.0))
    
    return {"msg": "Sample data created successfully"}

@app.post("/predict")
def predict_emotion(data: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Giải mã ảnh base64
    image_b64 = data.get("image")
    if not image_b64:
        raise HTTPException(status_code=400, detail="No image provided")
    header, encoded = image_b64.split(",", 1) if "," in image_b64 else ("", image_b64)
    img_bytes = base64.b64decode(encoded)
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    # TODO: Tiền xử lý ảnh và chạy model thật
    # Tạm thời trả về emotion giả lập
    fake_emotion = "happy"
    # Lưu kết quả vào DB
    crud.create_emotion_result(db, user_id=current_user.id, emotion=fake_emotion, score=None)
    return {"emotion": fake_emotion}

@app.post("/analyze-emotion")
def analyze_emotion(data: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Phân tích cảm xúc từ ảnh sử dụng model local"""
    try:
        import time
        start_time = time.time()
        
        # Lấy ảnh từ request
        image_data = data.get("image")
        if not image_data:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Kiểm tra có lưu vào database không
        save_to_db = data.get("save_to_db", True)  # Mặc định là True
        
        # Lấy thông tin session từ request
        session_id = data.get("session_id")
        camera_resolution = data.get("camera_resolution")
        analysis_interval = data.get("analysis_interval")
        
        # Tạo session mới nếu chưa có
        if not session_id:
            session = crud.create_analysis_session(
                db, 
                user_id=current_user.id,
                camera_resolution=camera_resolution,
                analysis_interval=analysis_interval
            )
            session_id = session.id
        
        # Phân tích cảm xúc
        result = emotion_service.analyze_image(image_data)
        
        analysis_duration = (time.time() - start_time) * 1000  # Chuyển sang milliseconds
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))
        
        # Lưu kết quả vào database nếu có kết quả và được yêu cầu lưu
        if save_to_db and result["results"]:
            for face_result in result["results"]:
                # Tính chất lượng ảnh dựa trên độ tin cậy
                image_quality = face_result.get("dominant_emotion_score", 0.5)
                
                crud.create_emotion_result(
                    db, 
                    user_id=current_user.id, 
                    emotion=face_result["dominant_emotion"], 
                    score=face_result["dominant_emotion_score"],
                    faces_detected=result["faces_detected"],
                    dominant_emotion=face_result["dominant_emotion"],
                    dominant_emotion_vn=face_result.get("dominant_emotion_vn"),
                    dominant_emotion_score=face_result["dominant_emotion_score"],
                    engagement=face_result.get("engagement"),
                    emotions_scores=face_result.get("emotions"),
                    emotions_scores_vn=face_result.get("emotions_vn"),
                    image_quality=image_quality,
                    face_position=face_result.get("face_position"),
                    analysis_duration=analysis_duration,
                    confidence_level=face_result["dominant_emotion_score"]
                )
        elif save_to_db:
            # Lưu kết quả thất bại (không phát hiện khuôn mặt)
            crud.create_emotion_result(
                db,
                user_id=current_user.id,
                emotion="no_face_detected",
                score=0.0,
                faces_detected=0,
                analysis_duration=analysis_duration,
                confidence_level=0.0
            )
        
        # Cập nhật session với thống kê mới
        if session_id:
            # Lấy thống kê hiện tại của session
            session_stats = crud.get_session_stats(db, session_id)
            if session_stats:
                # Cập nhật session với thống kê mới
                crud.update_analysis_session(
                    db,
                    session_id=session_id,
                    total_analyses=session_stats['total_analyses'] + 1,
                    successful_detections=session_stats['successful_detections'] + (1 if result["faces_detected"] > 0 else 0),
                    failed_detections=session_stats['failed_detections'] + (1 if result["faces_detected"] == 0 else 0),
                    detection_rate=((session_stats['successful_detections'] + (1 if result["faces_detected"] > 0 else 0)) / (session_stats['total_analyses'] + 1)) * 100,
                    emotions_summary=crud.get_session_emotions_summary(db, session_id),
                    average_engagement=crud.get_session_average_engagement(db, session_id)
                )
        
        # Thêm session_id vào response
        result["session_id"] = session_id
        
        return result
        
    except Exception as e:
        print(f"Error in analyze_emotion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-emotion-stream")
def analyze_emotion_stream(data: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Phân tích cảm xúc từ stream video (frame)"""
    try:
        # Lấy frame từ request
        frame_data = data.get("frame")
        if not frame_data:
            raise HTTPException(status_code=400, detail="No frame provided")
        
        # Phân tích cảm xúc
        result = emotion_service.analyze_image(frame_data)
        
        if not result.get("success", False):
            return {"error": result.get("error", "Analysis failed"), "success": False}
        
        # Lưu kết quả vào database nếu có kết quả (tùy chọn cho stream)
        save_to_db = data.get("save_to_db", False)
        if save_to_db and result["results"]:
            for face_result in result["results"]:
                crud.create_emotion_result(
                    db, 
                    user_id=current_user.id, 
                    emotion=face_result["dominant_emotion"], 
                    score=face_result["dominant_emotion_score"]
                )
        
        return result
        
    except Exception as e:
        print(f"Error in analyze_emotion_stream: {e}")
        return {"error": str(e), "success": False} 