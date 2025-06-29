# FER-CNN-LSTM Frontend

Frontend application for the Facial Emotion Recognition system using CNN-LSTM architecture.

## Features

- **Real-time Emotion Analysis**: Capture and analyze facial expressions using webcam
- **User Authentication**: Secure login system with JWT tokens
- **Admin Dashboard**: Comprehensive statistics and user management
- **Emotion Statistics**: Detailed charts and analytics for emotion detection
- **Responsive Design**: Modern UI built with Ant Design and React

## Technology Stack

- **React 18** with TypeScript
- **Ant Design 5** for UI components
- **Recharts** for data visualization
- **React Router** for navigation
- **Fetch API** for HTTP requests

## API Integration

The frontend is designed to work with the FastAPI backend and uses the following API endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user info
- `POST /auth/change-password` - Change password

### Emotion Analysis
- `POST /emotion/analyze` - Analyze emotion from image file
- `GET /emotion/stats` - Get emotion statistics
- `GET /emotion/history` - Get analysis history
- `GET /emotion/performance` - Get performance statistics

### Admin Features
- `GET /admin/users` - Get all users
- `POST /admin/users` - Create user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api/v1
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (LoadingSpinner, StatisticCard, etc.)
│   ├── emotion/        # Emotion-specific components
│   ├── performance/    # Performance-related components
│   └── ui/            # UI utility components
├── pages/             # Page components
│   ├── LoginPage.tsx
│   ├── AdminDashboard.tsx
│   ├── CameraPage.tsx
│   ├── EmotionStatsPage.tsx
│   └── AdminUserList.tsx
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
│   ├── api.ts         # API functions
│   ├── emotionUtils.ts
│   └── performanceUtils.ts
└── constants.ts       # Application constants
```

## Key Features

### Camera Analysis
- Real-time face detection and emotion analysis
- Support for both single capture and continuous streaming
- Performance metrics display
- Image quality assessment

### Dashboard
- Comprehensive statistics overview
- Emotion distribution charts
- User performance tracking
- Real-time data updates

### User Management
- User registration and authentication
- Role-based access control (Admin/User)
- User statistics and activity tracking

## API Response Format

The frontend expects the following response format from the backend:

### Emotion Analysis Response
```typescript
{
  success: boolean;
  analysis?: {
    dominant_emotion: string;
    dominant_emotion_vn: string;
    dominant_emotion_score: number;
    emotions_scores: { [key: string]: number };
    emotions_scores_vn: { [key: string]: number };
    engagement: string;
    faces_detected: number;
    image_quality: number;
    processing_time: number;
    confidence_level: number;
  };
  saved_result?: {
    id: number;
    emotion: string;
    emotion_vn: string;
    score: number;
    engagement: string;
    timestamp: string;
  };
  error?: string;
}
```

### Login Response
```typescript
{
  success: boolean;
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    is_admin: boolean;
    created_at: string;
  };
}
```

## Development Notes

- The application uses JWT tokens for authentication
- All API calls include automatic token refresh and error handling
- The UI is fully responsive and supports both desktop and mobile devices
- Emotion analysis supports multiple languages (English and Vietnamese)
- Real-time updates are implemented for live statistics

## Troubleshooting

1. **CORS Issues**: Ensure the backend has CORS properly configured
2. **API Connection**: Verify the backend is running on the correct port
3. **Authentication**: Check that JWT tokens are being properly stored and sent
4. **Camera Access**: Ensure the browser has permission to access the webcam

## Contributing

1. Follow the existing code style and TypeScript conventions
2. Add proper error handling for all API calls
3. Update types when modifying API responses
4. Test all features before submitting changes
