#!/usr/bin/env python3
"""
Script tạo admin user mặc định
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.database import SessionLocal
from app.crud.user_crud import create_user, get_user_by_username
import logging

logger = logging.getLogger(__name__)

def create_admin_user():
    """Tạo admin user mặc định"""
    db = SessionLocal()
    try:
        # Kiểm tra xem admin đã tồn tại chưa
        admin_user = get_user_by_username(db, "admin")
        if not admin_user:
            # Tạo admin user
            admin_user = create_user(
                db=db,
                username="admin",
                password="123456",
                is_admin=True
            )
            logger.info("Đã tạo admin user thành công")
            logger.info(f"   Username: admin")
            logger.info(f"   Password: 123456")
            logger.info("Hãy đổi mật khẩu sau khi đăng nhập!")
        else:
            logger.info("Admin user đã tồn tại")
        
        return admin_user
    except Exception as e:
        logger.error(f"Lỗi tạo admin user: {e}")
        raise
    finally:
        db.close()

def main():
    """Hàm chính"""
    print("Bắt đầu tạo admin user...")
    
    try:
        create_admin_user()
        print("Hoàn tất tạo admin user!")
        print("Admin user: admin/123456")
        
    except Exception as e:
        print(f"Lỗi tạo admin user: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 