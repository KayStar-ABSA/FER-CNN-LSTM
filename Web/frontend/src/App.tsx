import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CameraPage from './pages/CameraPage';
import EmotionStatsPage from './pages/EmotionStatsPage';
import AdminUserList from './pages/AdminUserList';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <ConfigProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<AdminLayout><UserDashboard /></AdminLayout>} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUserList /></AdminLayout>} />
          <Route path="/camera" element={<AdminLayout><CameraPage /></AdminLayout>} />
          <Route path="/stats" element={<AdminLayout><EmotionStatsPage /></AdminLayout>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
