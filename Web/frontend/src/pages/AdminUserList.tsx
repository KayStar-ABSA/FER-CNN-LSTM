import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Switch, 
  Table, 
  Space, 
  Tag,
  message 
} from 'antd';
import { EditOutlined, PlusOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser } from '../utils/api';

const { Title } = Typography;

interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Không thể tải danh sách người dùng');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenAdd = () => {
    setEditUser(null);
    form.resetFields();
    setOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    form.setFieldsValue({
      username: user.username,
      password: '',
      is_admin: user.is_admin
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editUser) {
        await updateUser(editUser.id, { 
          password: values.password || undefined, 
          is_admin: values.is_admin 
        });
        message.success('Cập nhật thành công');
      } else {
        await createUser(values);
        message.success('Thêm thành công');
      }
      
      handleClose();
      fetchUsers();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Vui lòng kiểm tra thông tin');
      } else {
        message.error(error.message || 'Lỗi mạng');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span>{id}</span>,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: User) => (
        <Space>
          {record.is_admin ? <CrownOutlined style={{ color: '#1890ff' }} /> : <UserOutlined />}
          <span>{text}</span>
          {record.is_admin && <Tag color="blue">Admin</Tag>}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_: any, record: User) => (
        <Button 
          type="text" 
          icon={<EditOutlined />} 
          onClick={() => handleOpenEdit(record)}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>Quản lý người dùng</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleOpenAdd}
            size="large"
          >
            Thêm user
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
          style={{ backgroundColor: 'white' }}
        />
      </Card>

      <Modal
        title={editUser ? 'Sửa user' : 'Thêm user'}
        open={open}
        onCancel={handleClose}
        onOk={handleSubmit}
        confirmLoading={loading}
        okText="Lưu"
        cancelText="Hủy"
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Vui lòng nhập username!' }]}
          >
            <Input 
              disabled={!!editUser}
              placeholder="Nhập username"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: !editUser, message: 'Vui lòng nhập password!' },
              { min: 6, message: 'Password phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password 
              placeholder={editUser ? 'Để trống nếu không đổi mật khẩu' : 'Nhập password'}
            />
          </Form.Item>
          
          <Form.Item
            name="is_admin"
            label="Quyền admin"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserList; 