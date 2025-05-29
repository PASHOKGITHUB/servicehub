// Alternative: Super minimal app.ts (use if TypeScript errors persist)
import express, { Application, Request, Response } from 'express';
import { ApiResponse } from './utils/apiResponse';
import { HTTP_STATUS } from './constants/index';
import { errorMiddleware, notFound } from './middlewares/error';
import cors from 'cors';

import adminRoutes from './routes/admin.route';
import providerRoutes from './routes/provider.route';
import userRoutes from './routes/user.route';
import commonRoutes from './routes/common.route';

import authRoutes from './routes/auth.route';
import cookieParser from 'cookie-parser';

const app: Application = express();

// Only essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://servicehubdev.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());

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
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/common', commonRoutes);

// Error handling
app.all('*', notFound);
app.use(errorMiddleware);

export default app;