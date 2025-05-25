// Alternative: Super minimal app.ts (use if TypeScript errors persist)
import express, { Application, Request, Response } from 'express';
import { ApiResponse } from './utils/apiResponse';
import { HTTP_STATUS } from './constants/index';
import { errorMiddleware, notFound } from './middlewares/error';

// Import auth routes
import authRoutes from './routes/auth.route';

const app: Application = express();

// Only essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json(new ApiResponse(
    HTTP_STATUS.OK,
    {
      name: 'ServiceHub API',
      version: '1.0.0',
      status: 'Running with authentication',
      endpoints: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        profile: 'GET /api/v1/auth/profile'
      }
    },
    'Welcome to ServiceHub API'
  ));
});

app.get('/health', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json(new ApiResponse(
    HTTP_STATUS.OK,
    { status: 'OK', timestamp: new Date().toISOString() },
    'Service is healthy'
  ));
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// Error handling
app.all('*', notFound);
app.use(errorMiddleware);

export default app;