import asyncio
from database import engine, Base
from models import User
from auth import get_password_hash
from sqlalchemy.orm import sessionmaker

async def create_test_user():
    # Tạo bảng
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Tạo session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Kiểm tra xem user đã tồn tại chưa
        existing_user = db.query(User).filter(User.username == "admin").first()
        if existing_user:
            print("User 'admin' đã tồn tại!")
            return
        
        # Tạo user admin
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            is_admin=True
        )
        
        # Tạo user thường
        regular_user = User(
            username="user",
            hashed_password=get_password_hash("user123"),
            is_admin=False
        )
        
        db.add(admin_user)
        db.add(regular_user)
        db.commit()
        
        print("Đã tạo thành công:")
        print("- Admin user: username='admin', password='admin123'")
        print("- Regular user: username='user', password='user123'")
        
    except Exception as e:
        print(f"Lỗi: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_test_user()) 