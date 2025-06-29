// Performance related types
export interface PerformanceStats {
  avg_processing_time: number;
  avg_fps: number;
  avg_detection_rate: number;
  total_cache_hits: number;
  avg_cache_hit_rate: number;
  total_analyses: number;
}

export interface SessionData {
  id: number;
  session_start: string;
  session_end: string;
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  avg_processing_time: number;
  avg_fps: number;
  total_cache_hits: number;
  cache_hit_rate: number;
}

export interface UserSession {
  id: number;
  session_start: string;
  session_end: string | null;
  total_analyses: number;
  successful_detections: number;
  failed_detections: number;
  detection_rate: number;
  emotions_summary: { [key: string]: number } | null;
  average_engagement: number | null;
  camera_resolution: string | null;
  analysis_interval: number | null;
}

// Performance evaluation types
export type PerformanceMetricType = 'fps' | 'processing' | 'detection' | 'cache';
export type ProgressStatusType = 'success' | 'normal' | 'exception'; 