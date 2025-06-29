import {
  CameraOutlined,
  DashboardOutlined,
  LogoutOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types/user';
import UserAvatar from './common/UserAvatar';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/camera', icon: <CameraOutlined />, label: 'Camera' },
  { key: '/stats', icon: <PieChartOutlined />, label: 'Thống kê cảm xúc' },
  { key: '/performance', icon: <ThunderboltOutlined />, label: 'Hiệu suất' },
];

const adminMenu = [
  { key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = localStorage.getItem('is_admin') === 'true';
  const [currentUser, setCurrentUser] = useState<User | undefined>();

  useEffect(() => {
    // Get current user info from localStorage
    const username = localStorage.getItem('username');
    if (username) {
      setCurrentUser({
        id: 1,
        username,
        is_admin: isAdmin,
        avatar: undefined
      });
    }
  }, [isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    navigate('/login');
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const allMenuItems = [...menuItems, ...(isAdmin ? adminMenu : [])];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={220} 
        theme="light"
        style={{ 
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 1000
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 16
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            FER-CNN-LSTM
          </Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={allMenuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
        
        <div style={{ padding: '16px', position: 'absolute', bottom: 0, width: '100%' }}>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            style={{ width: '100%', textAlign: 'left', height: 40 }}
          >
            Đăng xuất
          </Button>
        </div>
      </Sider>
      
      <Layout style={{ marginLeft: 220 }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname === '/camera' && 'Camera'}
            {location.pathname === '/stats' && 'Thống kê cảm xúc'}
            {location.pathname === '/performance' && 'Báo cáo hiệu suất'}
            {location.pathname === '/admin/users' && 'Quản lý người dùng'}
          </Title>
          
          <UserAvatar 
            user={currentUser}
            onLogout={handleLogout}
          />
        </Header>
        
        <Content style={{ 
          margin: '24px', 
          padding: '24px', 
          background: '#fff', 
          borderRadius: 8,
          minHeight: 'calc(100vh - 112px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 