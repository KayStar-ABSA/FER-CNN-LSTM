#!/usr/bin/env python3
"""
Script quản lý database migrations
"""

import sys
import os
import subprocess
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

def run_migration(command):
    """Chạy lệnh migration"""
    try:
        result = subprocess.run(
            ["alembic"] + command.split(),
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(__file__))
        )
        
        if result.returncode == 0:
            print(f"Thành công: {command}")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"Lỗi: {command}")
            print(result.stderr)
            return False
            
        return True
        
    except Exception as e:
        print(f"Lỗi chạy lệnh {command}: {e}")
        return False

def main():
    """Hàm chính"""
    if len(sys.argv) < 2:
        print("Sử dụng:")
        print("  python migrate_db.py upgrade    # Chạy migrations")
        print("  python migrate_db.py downgrade  # Rollback migrations")
        print("  python migrate_db.py revision   # Tạo migration mới")
        print("  python migrate_db.py current    # Xem migration hiện tại")
        print("  python migrate_db.py history    # Xem lịch sử migrations")
        return
    
    command = sys.argv[1]
    
    if command == "upgrade":
        print("Chạy migrations...")
        run_migration("upgrade head")
        
    elif command == "downgrade":
        print("Rollback migrations...")
        run_migration("downgrade -1")
        
    elif command == "revision":
        message = sys.argv[2] if len(sys.argv) > 2 else "Auto migration"
        print(f"Tạo migration mới: {message}")
        run_migration(f'revision --autogenerate -m "{message}"')
        
    elif command == "current":
        print("Migration hiện tại:")
        run_migration("current")
        
    elif command == "history":
        print("Lịch sử migrations:")
        run_migration("history")
        
    else:
        print(f"Lệnh không hợp lệ: {command}")

if __name__ == "__main__":
    main() 