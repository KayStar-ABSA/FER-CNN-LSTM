import { API_BASE_URL } from '../constants';
import { LoginFormData, LoginResponse, RegisterFormData, UserInfoResponse } from '../types';

// Utility function để tạo URL với JSON parameters
export const createUrlWithJsonParams = (endpoint: string, params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        // Nếu là object, stringify và encode
        url.searchParams.set(key, JSON.stringify(value));
      } else {
        // Nếu là primitive value, encode bình thường
        url.searchParams.set(key, String(value));
      }
    }
  });
  
  return url.toString();
};

// Utility function để parse JSON parameters từ URL
export const parseJsonParams = (url: string) => {
  const urlObj = new URL(url);
  const params: Record<string, any> = {};
  
  urlObj.searchParams.forEach((value, key) => {
    try {
      // Thử parse JSON trước
      params[key] = JSON.parse(value);
    } catch {
      // Nếu không phải JSON, giữ nguyên giá trị
      params[key] = value;
    }
  });
  
  return params;
};

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - let the component handle this
        localStorage.removeItem('token');
        localStorage.removeItem('is_admin');
        throw new Error('Token expired or invalid');
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error - backend might be down
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra backend.');
    }
    throw error;
  }
};

// Auth API calls
export const login = (formData: LoginFormData): Promise<LoginResponse> => {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};

export const register = async (userData: RegisterFormData) => {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: userData.username,
      password: userData.password,
    }),
  });
};

export const getCurrentUser = (): Promise<UserInfoResponse> => {
  return apiCall('/auth/me');
};

export const changePassword = (currentPassword: string, newPassword: string) => {
  return apiCall('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
};

// Emotion API calls
export const analyzeEmotion = async (file: File) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/emotion/analyze`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Analysis failed');
  }

  return response.json();
};

// Stats API calls - using JSON.stringify for backend compatibility
export const getEmotionStats = (filters: any = {}) => {
  const queryString = JSON.stringify(filters);
  return apiCall(`/stats/emotion?filters=${encodeURIComponent(queryString)}`);
};

export const getEmotionHistory = (filters: any = {}) => {
  const queryString = JSON.stringify(filters);
  return apiCall(`/stats/history?filters=${encodeURIComponent(queryString)}`);
};

export const getPerformanceStats = (filters: any = {}) => {
  const queryString = JSON.stringify(filters);
  return apiCall(`/stats/performance?filters=${encodeURIComponent(queryString)}`);
};

export const getFaceDetectionStats = (filters: any = {}) => {
  const queryString = JSON.stringify(filters);
  return apiCall(`/emotion/face-detection-stats?filters=${encodeURIComponent(queryString)}`);
};

export const getStatsSummary = () => {
  return apiCall('/stats/summary');
};

// Session API calls
export const startAnalysisSession = (config: any = {}) => {
  return apiCall('/sessions/start', {
    method: 'POST',
    body: JSON.stringify(config),
  });
};

export const endAnalysisSession = () => {
  return apiCall('/sessions/end', {
    method: 'POST',
  });
};

export const getActiveSession = () => {
  return apiCall('/sessions/active');
};

// Admin API calls
export const getAdminStats = (filters: any = {}) => {
  const queryString = JSON.stringify(filters);
  return apiCall(`/admin/statistics?filters=${encodeURIComponent(queryString)}`);
};

export const getUsers = () => {
  return apiCall('/admin/users');
};

export const createUser = (userData: any) => apiCall('/admin/users', {
  method: 'POST',
  body: JSON.stringify(userData),
});

export const updateUser = (userId: number, userData: any) => apiCall(`/admin/users/${userId}`, {
  method: 'PUT',
  body: JSON.stringify(userData),
});

export const deleteUser = (userId: number) => apiCall(`/admin/users/${userId}`, {
  method: 'DELETE',
}); 