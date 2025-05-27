// Create this file: scripts/createAdmin.ts (in your backend folder)

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index';

// Use your existing User model or define it here
interface IUser {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  avatar: { type: String, default: null },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema);

async function createAdmin(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', config.bcryptSaltRounds);

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@servicehub.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });

    await admin.save();
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@servicehub.com');
    console.log('🔑 Password: admin123');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

createAdmin();