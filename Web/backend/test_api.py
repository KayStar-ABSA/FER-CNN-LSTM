#!/usr/bin/env python3
"""
Script test API cho hệ thống phân tích cảm xúc
"""

import requests
import base64
import json
from PIL import Image
import numpy as np
import cv2

# Cấu hình
API_BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{API_BASE_URL}/token"
ANALYZE_URL = f"{API_BASE_URL}/analyze-emotion"

def create_test_image():
    """Tạo ảnh test đơn giản"""
    # Tạo ảnh 200x200 với màu xám
    img_array = np.ones((200, 200, 3), dtype=np.uint8) * 128
    
    # Vẽ một hình tròn đơn giản để giả lập khuôn mặt
    cv2.circle(img_array, (100, 100), 50, (255, 255, 255), -1)
    
    # Chuyển thành PIL Image
    img = Image.fromarray(img_array)
    
    # Chuyển thành base64
    import io
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/jpeg;base64,{img_base64}"

def login():
    """Đăng nhập và lấy token"""
    login_data = {
        "username": "admin",
        "password": "123"
    }
    
    try:
        response = requests.post(LOGIN_URL, data=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Đăng nhập thành công")
            return token
        else:
            print(f"❌ Lỗi đăng nhập: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")
        return None

def test_analyze_emotion(token):
    """Test API phân tích cảm xúc"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Tạo ảnh test
    test_image = create_test_image()
    
    data = {
        "image": test_image
    }
    
    try:
        print("🔄 Đang gửi request phân tích cảm xúc...")
        response = requests.post(ANALYZE_URL, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Phân tích thành công!")
            print(f"📊 Số khuôn mặt phát hiện: {result.get('faces_detected', 0)}")
            
            if result.get('results'):
                for i, face_result in enumerate(result['results']):
                    print(f"\n👤 Khuôn mặt {i+1}:")
                    print(f"   Cảm xúc chủ đạo: {face_result.get('dominant_emotion_vn', 'N/A')}")
                    print(f"   Điểm số: {face_result.get('dominant_emotion_score', 0):.2f}%")
                    print(f"   Mức độ tham gia: {face_result.get('engagement', 'N/A')}")
                    
                    print("   Chi tiết cảm xúc:")
                    for emotion, score in face_result.get('emotions_vn', {}).items():
                        print(f"     {emotion}: {score:.2f}%")
            else:
                print("⚠️ Không phát hiện khuôn mặt nào")
                
        else:
            print(f"❌ Lỗi API: {response.status_code}")
            print(f"Chi tiết: {response.text}")
            
    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")

def test_stats(token):
    """Test API thống kê"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print("\n📈 Đang lấy thống kê...")
        response = requests.get(f"{API_BASE_URL}/stats/week", headers=headers)
        
        if response.status_code == 200:
            stats = response.json()
            print("✅ Lấy thống kê thành công!")
            print(f"📊 Tổng số cảm xúc: {stats.get('total_emotions', 0)}")
            
            if stats.get('emotion_counts'):
                print("Phân bố cảm xúc:")
                for emotion, count in stats['emotion_counts'].items():
                    print(f"  {emotion}: {count}")
        else:
            print(f"❌ Lỗi thống kê: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Lỗi kết nối thống kê: {e}")

def main():
    """Hàm chính"""
    print("🚀 Bắt đầu test API FER-CNN-LSTM")
    print("=" * 50)
    
    # Test đăng nhập
    token = login()
    if not token:
        print("❌ Không thể đăng nhập, dừng test")
        return
    
    # Test phân tích cảm xúc
    print("\n" + "=" * 50)
    test_analyze_emotion(token)
    
    # Test thống kê
    print("\n" + "=" * 50)
    test_stats(token)
    
    print("\n" + "=" * 50)
    print("✅ Hoàn thành test!")

if __name__ == "__main__":
    main() 