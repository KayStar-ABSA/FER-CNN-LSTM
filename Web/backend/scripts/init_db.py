#!/usr/bin/env python3
"""
Script khởi tạo database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.database import engine, Base
from app.seed.seed_data import create_admin_user
import logging

logger = logging.getLogger(__name__)

def init_database():
    """Khởi tạo database và tạo admin user"""
    try:
        # Tạo tất cả tables
        Base.metadata.create_all(bind=engine)
        logger.info("Đã tạo database tables thành công")
        
        # Tạo admin user
        create_admin_user()
        logger.info("Hoàn tất khởi tạo database")
        
    except Exception as e:
        logger.error(f"Lỗi khởi tạo database: {e}")
        raise

def main():
    """Hàm chính"""
    print("Bắt đầu khởi tạo database...")
    
    try:
        init_database()
        print("Khởi tạo database thành công!")
        
    except Exception as e:
        print(f"Lỗi khởi tạo database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 