import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const testCloudinaryConnection = async (): Promise<void> => {
  try {
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      console.log('✅ Cloudinary connection successful');
    }
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
  }
};

export { cloudinary };