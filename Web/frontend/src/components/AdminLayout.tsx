import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button } from 'antd';
import { 
  DashboardOutlined, 
  CameraOutlined, 
  LogoutOutlined, 
  UserOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/camera', icon: <CameraOutlined />, label: 'Camera' },
  { key: '/stats', icon: <PieChartOutlined />, label: 'Thống kê cảm xúc' },
];

const adminMenu = [
  { key: '/admin', icon: <BarChartOutlined />, label: 'Thống kê tổng hợp' },
  { key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
];

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = localStorage.getItem('is_admin') === 'true';

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
          zIndex: 999
        }}>
          <Title level={4} style={{ margin: 0, lineHeight: '64px' }}>
            Admin Panel
          </Title>
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