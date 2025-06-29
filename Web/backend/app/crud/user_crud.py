from sqlalchemy.orm import Session
from app.models.models import User
from app.core.auth import get_password_hash

def create_user(db: Session, username: str, password: str, is_admin: bool = False):
    """Tạo user mới"""
    hashed_password = get_password_hash(password)
    db_user = User(username=username, password_hash=hashed_password, is_admin=is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    """Lấy user theo username"""
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    """Lấy user theo ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_all_users(db: Session):
    """Lấy tất cả users"""
    return db.query(User).all()

def update_user_password(db: Session, user_id: int, new_password: str):
    """Cập nhật mật khẩu user"""
    user = get_user_by_id(db, user_id)
    if user:
        user.password_hash = get_password_hash(new_password)
        db.commit()
        db.refresh(user)
    return user

def update_user_admin_status(db: Session, user_id: int, is_admin: bool):
    """Cập nhật trạng thái admin của user"""
    user = get_user_by_id(db, user_id)
    if user:
        user.is_admin = is_admin
        db.commit()
        db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    """Xóa user"""
    user = get_user_by_id(db, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False 