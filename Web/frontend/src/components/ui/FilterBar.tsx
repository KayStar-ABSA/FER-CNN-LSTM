import React from 'react';
import { Space, Select } from 'antd';
import { FilterOptions } from '../../types';

const { Option } = Select;

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  showUserFilter?: boolean;
  users?: Array<{ id: number; username: string; is_admin: boolean }>;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  showUserFilter = false,
  users = []
}) => {
  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];
  
  const handlePeriodChange = (period: FilterOptions['period']) => {
    onFilterChange({ ...filters, period });
  };

  const handleUserChange = (userId: number | 'all') => {
    onFilterChange({ ...filters, userId });
  };

  return (
    <Space>
      {showUserFilter && (
        <Select
          value={filters.userId || 'all'}
          onChange={handleUserChange}
          style={{ width: 200 }}
          placeholder="Chọn người dùng"
        >
          <Option value="all">Tất cả người dùng</Option>
          {safeUsers.map(user => (
            <Option key={user.id} value={user.id}>
              {user.username} {user.is_admin ? '(Admin)' : ''}
            </Option>
          ))}
        </Select>
      )}
      <Select value={filters.period} onChange={handlePeriodChange} style={{ width: 120 }}>
        <Option value="day">Hôm nay</Option>
        <Option value="week">Tuần này</Option>
        <Option value="month">Tháng này</Option>
        <Option value="year">Năm nay</Option>
      </Select>
    </Space>
  );
};

export default FilterBar; 