// Component prop types
export interface StatisticCardProps {
  title: string;
  value: number;
  suffix?: string;
  precision?: number;
  valueStyle?: React.CSSProperties;
  color?: string;
}

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'default' | 'large';
}

export interface EmotionCategoryCardProps {
  title: string;
  emotions: [string, number][];
  total: number;
  color: string;
  tagColor: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 