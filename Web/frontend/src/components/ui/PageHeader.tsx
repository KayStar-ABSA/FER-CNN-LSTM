import React from 'react';
import { Typography, Space } from 'antd';
import { ReactNode } from 'react';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <Title level={2}>{title}</Title>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {subtitle && (
          <Text type="secondary">
            {subtitle}
          </Text>
        )}
        {children && (
          <Space>
            {children}
          </Space>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 