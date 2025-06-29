// User related types
export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  created_at?: string;
  last_login?: string;
  status?: string;
  avatar?: string;
}

export interface UserStats {
  user: User;
  emotion_stats: { [key: string]: number };
  detection_stats: {
    total_analyses: number;
    successful_detections: number;
    failed_detections: number;
    detection_rate: number;
    average_image_quality: number;
  };
  engagement_stats: {
    average_emotion_score: number;
    total_emotions_analyzed: number;
  };
}

// Form types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
}

// API Response types
export interface LoginResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    is_admin: boolean;
    created_at: string;
  };
}

export interface UserInfoResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
    is_admin: boolean;
    created_at: string;
    last_login?: string;
  };
} 