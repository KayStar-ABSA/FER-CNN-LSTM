import { DeleteOutlined, EditOutlined, EyeOutlined, UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Col, Form, Input, message, Modal, Row, Space, Statistic, Table, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { User } from '../types/user';
import { createUser, getUsers } from '../utils/api';
import { getUserListColumns } from '../utils/tableUtils';

const { Title } = Typography;

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setSelectedUser] = useState<User | null>(null);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [addUserForm] = Form.useForm();
  const [addingUser, setAddingUser] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getUsers();
      
      // Handle the backend response structure: { success: true, users: [...], total_count: ... }
      const usersArray = Array.isArray(usersData) ? usersData : usersData?.users || [];
      
      // Add mock data for demonstration
      const usersWithMockData = usersArray.map((user: any) => ({
        ...user,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: Math.random() > 0.2 ? 'active' : 'inactive'
      }));
      setUsers(usersWithMockData);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Lỗi khi tải danh sách người dùng');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    message.info(`Xem thông tin người dùng: ${user.username}`);
  };

  const handleEditUser = (user: User) => {
    message.info(`Chỉnh sửa người dùng: ${user.username}`);
  };

  const handleDeleteUser = (user: User) => {
    message.warning(`Xóa người dùng: ${user.username}`);
  };

  const handleAddUser = () => {
    setIsAddUserModalVisible(true);
  };

  const handleAddUserSubmit = async (values: any) => {
    setAddingUser(true);
    try {
      const result = await createUser({
        username: values.username,
        password: values.password,
        is_admin: values.is_admin || false
      });
      
      if (result.success) {
        message.success('Tạo người dùng thành công!');
        setIsAddUserModalVisible(false);
        addUserForm.resetFields();
        fetchUsers(); // Refresh user list
      } else {
        message.error(result.error || 'Lỗi khi tạo người dùng');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Xử lý lỗi chi tiết hơn
      if (error.message.includes('422')) {
        message.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      } else if (error.message.includes('409')) {
        message.error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
      } else if (error.message.includes('403')) {
        message.error('Bạn không có quyền tạo người dùng mới.');
      } else {
        message.error(error.message || 'Lỗi khi tạo người dùng');
      }
    } finally {
      setAddingUser(false);
    }
  };

  const handleCancelAddUser = () => {
    setIsAddUserModalVisible(false);
    addUserForm.resetFields();
  };

  const extendedColumns = [
    ...getUserListColumns(),
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record)}
            title="Xem chi tiết"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            title="Chỉnh sửa"
          />
          {!record.is_admin && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record)}
              title="Xóa"
            />
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner message="Đang tải danh sách người dùng..." />;
  }

  const activeUsers = users.filter(user => user.status === 'active');
  const adminUsers = users.filter(user => user.is_admin);
  const regularUsers = users.filter(user => !user.is_admin);

  return (
    <div style={{ padding: '16px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Title level={3}>Quản lý người dùng</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAddUser}
          >
            Thêm người dùng
          </Button>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Tổng số người dùng"
              value={users.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Người dùng hoạt động"
              value={activeUsers.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Quản trị viên"
              value={adminUsers.length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Người dùng thường"
              value={regularUsers.length}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
      <Card>
        <Table
          dataSource={users}
          columns={extendedColumns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
        />
      </Card>

      {/* Add User Modal */}
      <Modal
        title="Thêm người dùng mới"
        open={isAddUserModalVisible}
        onOk={addUserForm.submit}
        onCancel={handleCancelAddUser}
        confirmLoading={addingUser}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form
          form={addUserForm}
          layout="vertical"
          onFinish={handleAddUserSubmit}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập tên đăng nhập" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>
          
          <Form.Item
            name="is_admin"
            valuePropName="checked"
          >
            <Checkbox>Là quản trị viên</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserList; 