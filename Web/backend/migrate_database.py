#!/usr/bin/env python3
"""
Script để migrate database với schema mới
"""

import database
import models
from sqlalchemy import text, inspect

def check_column_exists(db, table_name, column_name):
    """Kiểm tra xem cột có tồn tại không"""
    inspector = inspect(database.engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def migrate_database():
    """Migrate database với schema mới"""
    print("Bắt đầu migrate database...")
    
    # Tạo tất cả bảng mới
    database.Base.metadata.create_all(bind=database.engine)
    
    # Cập nhật dữ liệu cũ nếu cần
    with database.SessionLocal() as db:
        try:
            # Kiểm tra xem bảng users có tồn tại không
            inspector = inspect(database.engine)
            if 'users' not in inspector.get_table_names():
                print("Bảng users chưa tồn tại, tạo mới...")
                return
            
            # Kiểm tra và thêm cột created_at cho bảng users
            if not check_column_exists(db, 'users', 'created_at'):
                print("Thêm cột created_at cho bảng users...")
                db.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
                # Cập nhật giá trị mặc định cho các bản ghi hiện có
                db.execute(text("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL"))
                db.commit()
                print("Đã thêm cột created_at!")
            
            # Kiểm tra xem bảng emotion_results có tồn tại không
            if 'emotion_results' not in inspector.get_table_names():
                print("Bảng emotion_results chưa tồn tại, tạo mới...")
                return
            
            # Kiểm tra xem cột faces_detected đã tồn tại chưa
            if not check_column_exists(db, 'emotion_results', 'faces_detected'):
                print("Cột faces_detected chưa tồn tại, thêm các cột mới...")
                
                # Thêm các cột mới
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN faces_detected INTEGER DEFAULT 1"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN dominant_emotion VARCHAR"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN dominant_emotion_vn VARCHAR"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN dominant_emotion_score FLOAT"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN engagement VARCHAR"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN emotions_scores TEXT"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN emotions_scores_vn TEXT"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN image_quality FLOAT"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN face_position TEXT"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN analysis_duration FLOAT"))
                db.execute(text("ALTER TABLE emotion_results ADD COLUMN confidence_level FLOAT"))
                
                db.commit()
                print("Đã thêm các cột mới cho emotion_results!")
            
            # Cập nhật dữ liệu cũ
            result = db.execute(text("SELECT COUNT(*) FROM emotion_results WHERE faces_detected IS NULL"))
            old_records_count = result.scalar()
            
            if old_records_count > 0:
                print(f"Tìm thấy {old_records_count} bản ghi cũ, đang cập nhật...")
                
                # Cập nhật các bản ghi cũ
                db.execute(text("""
                    UPDATE emotion_results 
                    SET faces_detected = 1,
                        dominant_emotion = emotion,
                        dominant_emotion_score = COALESCE(score, 0.5),
                        image_quality = COALESCE(score, 0.5),
                        confidence_level = COALESCE(score, 0.5)
                    WHERE faces_detected IS NULL
                """))
                
                db.commit()
                print("Đã cập nhật xong dữ liệu cũ!")
            else:
                print("Không có dữ liệu cũ cần migrate.")
                
        except Exception as e:
            print(f"Lỗi khi migrate: {e}")
            db.rollback()
    
    print("Migrate database hoàn tất!")

if __name__ == "__main__":
    migrate_database() 