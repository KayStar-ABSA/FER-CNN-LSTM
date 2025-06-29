import { API_BASE_URL } from '../constants';
import { LoginFormData, LoginResponse, RegisterFormData, UserInfoResponse } from '../types';

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
export const login = async (formData: LoginFormData): Promise<LoginResponse> => {
  const body = new URLSearchParams();
  body.append('username', formData.username);
  body.append('password', formData.password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  return response.json();
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

// Stats API calls - using actual backend endpoints
export const getEmotionStats = (period: string = 'day') => {
  return apiCall(`/stats/emotion?period=${period}`);
};

export const getEmotionHistory = (limit: number = 100) => {
  return apiCall(`/stats/history?limit=${limit}`);
};

export const getPerformanceStats = (period: string = 'day') => {
  return apiCall(`/stats/performance?period=${period}`);
};

export const getStatsSummary = () => {
  return apiCall('/stats/summary');
};

// Admin API calls
export const getAdminStats = (period: string) => apiCall(`/admin/statistics?period=${period}`);
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