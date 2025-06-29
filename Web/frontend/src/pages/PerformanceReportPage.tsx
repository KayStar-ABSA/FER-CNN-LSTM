import React from 'react';
import { Card } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';

const PerformanceReportPage: React.FC = () => {
  console.log('PerformanceReportPage rendering...');

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '8px' }}>
          <LineChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Báo Cáo Hiệu Suất Hệ Thống
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Thống kê chi tiết về hiệu suất nhận diện cảm xúc và tối ưu hóa hệ thống
        </p>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <h2>Trang hiệu suất đang được phát triển</h2>
        <p>Vui lòng thử lại sau.</p>
      </Card>
    </div>
  );
};

export default PerformanceReportPage; 