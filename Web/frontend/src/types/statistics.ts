// Statistics related types
export interface DetectionStats {
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  average_image_quality: number;
}

export interface EngagementStats {
  average_emotion_score: number;
  total_emotions_analyzed: number;
}

export interface AdminStats {
  [key: string]: number;
}

// Filter and pagination types
export interface FilterOptions {
  period: 'day' | 'week' | 'month' | 'year';
  userId?: number | 'all';
  startDate?: string;
  endDate?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total?: number;
} 