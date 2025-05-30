import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config/index';
import { errorMiddleware, notFound } from './middlewares/error';
import { ApiResponse } from './utils/apiResponse';
import { HTTP_STATUS } from './constants/index';

// Import routes
import authRoutes from './routes/auth.route';
import adminRoutes from './routes/admin.route';
import providerRoutes from './routes/provider.route';
import userRoutes from './routes/user.route';
import commonRoutes from './routes/common.route';
import bookingRoutes from './routes/booking.route'; // Add this line

const app: Application = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Logging - only in development
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Compression
app.use(compression());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json(new ApiResponse(
    HTTP_STATUS.OK,
    {
      name: 'ServiceHub API',
      version: '1.0.0',
      description: 'A comprehensive service booking platform API',
      status: 'Server running successfully',
      endpoints: {
        auth: 'POST /api/v1/auth/*',
        admin: 'GET /api/v1/admin/*',
        provider: 'GET /api/v1/provider/*',
        user: 'GET /api/v1/user/*',
        bookings: 'POST /api/v1/bookings/*', // Add this line
        common: 'GET /api/v1/common/*',
        health: 'GET /health'
      }
    },
    'Welcome to ServiceHub API'
  ));
});

app.get('/health', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json(new ApiResponse(
    HTTP_STATUS.OK,
    {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Connected',
      cloudinary: 'Connected',
      razorpay: 'Connected',
    },
    'Service is healthy'
  ));
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/bookings', bookingRoutes); // Add this line
app.use('/api/v1/common', commonRoutes);

// 404 handler
app.all('*', notFound);

// Error handling
app.use(errorMiddleware);

export default app;