import { API_BASE_URL } from '../constants';

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  console.log(`API Call: ${endpoint}`, { token: token ? 'exists' : 'missing' });
  
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
    
    console.log(`API Response: ${endpoint}`, { status: response.status, ok: response.ok });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Token expired or invalid, redirecting to login');
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('is_admin');
        window.location.href = '/login';
        return;
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

export const getStats = (period: string) => apiCall(`/stats/${period}`);
export const getDetectionStats = (period: string) => apiCall(`/detection-stats/${period}`);
export const getEngagementStats = (period: string) => apiCall(`/engagement-stats/${period}`);
export const getPerformanceStats = (period: string) => apiCall(`/performance-stats/${period}`);
export const getUserSessions = () => apiCall('/user-sessions');
export const getAdminStats = (period: string) => apiCall(`/admin/stats/${period}`);
export const getAdminPerformanceStats = (period: string) => apiCall(`/admin/performance-stats/${period}`);
export const getUsers = () => apiCall('/admin/users');
export const createUser = (userData: any) => apiCall('/admin/users', {
  method: 'POST',
  body: JSON.stringify(userData),
});
export const updateUser = (userId: number, userData: any) => apiCall(`/admin/users/${userId}`, {
  method: 'PUT',
  body: JSON.stringify(userData),
});
export const predictEmotion = (imageData: any) => apiCall('/predict', {
  method: 'POST',
  body: JSON.stringify(imageData),
});
export const analyzeEmotion = (imageData: any) => apiCall('/analyze-emotion', {
  method: 'POST',
  body: JSON.stringify(imageData),
});
export const analyzeEmotionStream = (frameData: any) => apiCall('/analyze-emotion-stream', {
  method: 'POST',
  body: JSON.stringify(frameData),
});
export const createSampleData = () => apiCall('/sample-data', {
  method: 'POST',
}); 