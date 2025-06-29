import React from 'react';
import { Avatar, Dropdown, Menu, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { User } from '../../types/user';

const { Text } = Typography;

interface UserAvatarProps {
  user?: User;
  onLogout?: () => void;
  onSettings?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  onLogout,
  onSettings
}) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('username');
    onLogout?.();
  };

  const menu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Text>{user?.username || 'User'}</Text>
        {user?.is_admin && (
          <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
            Administrator
          </Text>
        )}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={onSettings}>
        Cài đặt
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
      <Space style={{ cursor: 'pointer', padding: '8px' }}>
        <Avatar 
          size="large" 
          src={user?.avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: user?.is_admin ? '#f5222d' : '#1890ff' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Text strong style={{ fontSize: '14px', lineHeight: '1' }}>
            {user?.username || 'User'}
          </Text>
          {user?.is_admin && (
            <Text type="secondary" style={{ fontSize: '12px', lineHeight: '1' }}>
              Admin
            </Text>
          )}
        </div>
      </Space>
    </Dropdown>
  );
};

export default UserAvatar; 