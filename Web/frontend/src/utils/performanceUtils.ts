// Performance evaluation utilities
export const getPerformanceColor = (value: number, type: 'fps' | 'processing' | 'detection' | 'cache'): string => {
  switch (type) {
    case 'fps':
      return value >= 10 ? '#52c41a' : value >= 5 ? '#faad14' : '#f5222d';
    case 'processing':
      return value <= 500 ? '#52c41a' : value <= 1000 ? '#faad14' : '#f5222d';
    case 'detection':
      return value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#f5222d';
    case 'cache':
      return value >= 70 ? '#52c41a' : value >= 40 ? '#faad14' : '#f5222d';
    default:
      return '#1890ff';
  }
};

export const getPerformanceStatus = (value: number, type: 'fps' | 'processing' | 'detection' | 'cache'): string => {
  switch (type) {
    case 'fps':
      return value >= 10 ? 'Tuyệt vời' : value >= 5 ? 'Khá' : 'Cần cải thiện';
    case 'processing':
      return value <= 500 ? 'Tuyệt vời' : value <= 1000 ? 'Khá' : 'Cần cải thiện';
    case 'detection':
      return value >= 80 ? 'Tuyệt vời' : value >= 60 ? 'Khá' : 'Cần cải thiện';
    case 'cache':
      return value >= 70 ? 'Tuyệt vời' : value >= 40 ? 'Khá' : 'Cần cải thiện';
    default:
      return 'Bình thường';
  }
};

export const getProgressStatus = (value: number, type: 'detection' | 'cache'): 'success' | 'normal' | 'exception' => {
  switch (type) {
    case 'detection':
      return value >= 80 ? 'success' : value >= 60 ? 'normal' : 'exception';
    case 'cache':
      return value >= 70 ? 'success' : value >= 40 ? 'normal' : 'exception';
    default:
      return 'normal';
  }
};

// Performance statistics calculation
export const calculateAveragePerformance = (sessions: any[]): {
  avg_processing_time: number;
  avg_fps: number;
  avg_detection_rate: number;
  total_cache_hits: number;
  avg_cache_hit_rate: number;
  total_analyses: number;
} => {
  if (!sessions.length) {
    return {
      avg_processing_time: 0,
      avg_fps: 0,
      avg_detection_rate: 0,
      total_cache_hits: 0,
      avg_cache_hit_rate: 0,
      total_analyses: 0
    };
  }

  const totalAnalyses = sessions.reduce((sum, session) => sum + session.total_analyses, 0);
  const totalProcessingTime = sessions.reduce((sum, session) => sum + (session.avg_processing_time * session.total_analyses), 0);
  const totalFps = sessions.reduce((sum, session) => sum + (session.avg_fps * session.total_analyses), 0);
  const totalDetectionRate = sessions.reduce((sum, session) => sum + (session.detection_rate * session.total_analyses), 0);
  const totalCacheHits = sessions.reduce((sum, session) => sum + session.total_cache_hits, 0);
  const totalCacheRate = sessions.reduce((sum, session) => sum + (session.cache_hit_rate * session.total_analyses), 0);

  return {
    avg_processing_time: totalAnalyses > 0 ? totalProcessingTime / totalAnalyses : 0,
    avg_fps: totalAnalyses > 0 ? totalFps / totalAnalyses : 0,
    avg_detection_rate: totalAnalyses > 0 ? totalDetectionRate / totalAnalyses : 0,
    total_cache_hits: totalCacheHits,
    avg_cache_hit_rate: totalAnalyses > 0 ? totalCacheRate / totalAnalyses : 0,
    total_analyses: totalAnalyses
  };
}; 