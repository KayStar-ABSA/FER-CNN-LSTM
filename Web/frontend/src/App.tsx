import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CameraPage from './pages/CameraPage';
import EmotionStatsPage from './pages/EmotionStatsPage';
import PerformanceReportPage from './pages/PerformanceReportPage';
import AdminUserList from './pages/AdminUserList';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ConfigProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout><AdminUserList /></AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/camera" 
            element={
              <ProtectedRoute>
                <AdminLayout><CameraPage /></AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stats" 
            element={
              <ProtectedRoute>
                <AdminLayout><EmotionStatsPage /></AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/performance-report" 
            element={
              <ProtectedRoute>
                <AdminLayout><PerformanceReportPage /></AdminLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
