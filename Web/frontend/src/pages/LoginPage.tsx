import { KeyOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Form, Input, Typography } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginFormData } from '../types';
import { login } from '../utils/api';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      const data = await login(values);
      if (data.success) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('is_admin', data.user.is_admin.toString());
        localStorage.setItem('user_id', data.user.id.toString());
        localStorage.setItem('username', data.user.username);
        
        // Redirect based on user role
        if (data.user.is_admin) {
          navigate('/admin/users');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          minWidth: 370, 
          borderRadius: 16, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <Avatar 
            size={56} 
            icon={<LockOutlined />} 
            style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
          />
          <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
            Đăng nhập hệ thống
          </Title>
        </div>
        
        <Form
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập username!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              autoFocus
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập password!' }]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Password"
            />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ 
                width: '100%', 
                height: 48, 
                borderRadius: 8, 
                fontSize: 16, 
                fontWeight: 600 
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
          
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage; 