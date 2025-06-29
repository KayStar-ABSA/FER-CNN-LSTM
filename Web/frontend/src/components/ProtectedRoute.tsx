import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from './common/LoadingSpinner';
import { getCurrentUser } from '../utils/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      // Nếu không có token, redirect ngay lập tức
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Kiểm tra nhanh từ localStorage trước
      const storedIsAdmin = localStorage.getItem('is_admin') === 'true';
      setIsAdmin(storedIsAdmin);
      
      // Nếu không cần admin hoặc đã có thông tin admin, không cần gọi API
      if (!requireAdmin || storedIsAdmin !== null) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Thêm timeout để tránh loading vô hạn
      const timeoutId = setTimeout(() => {
        console.warn('Auth check timeout, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('is_admin');
        setIsAuthenticated(false);
        setLoading(false);
      }, 5000); // 5 giây timeout

      try {
        const userData = await getCurrentUser();
        clearTimeout(timeoutId);
        setIsAuthenticated(true);
        setIsAdmin(userData.user.is_admin);
        localStorage.setItem('is_admin', userData.user.is_admin.toString());
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('is_admin');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requireAdmin]);

  // Nếu không có token, redirect ngay lập tức
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <LoadingSpinner message="Đang kiểm tra xác thực..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 