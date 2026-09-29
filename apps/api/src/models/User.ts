import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  role: 'farmer' | 'expert' | 'government' | 'agronomist' | 'researcher' | 'cooperative';
  location: string;
  language: 'en' | 'hi';
  avatarUrl: string;
  preferences: {
    weatherAlerts: boolean;
    diseaseAlerts: boolean;
    weeklyReports: boolean;
    marketUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    password: { type: String, select: false },
    googleId: { type: String, default: null, index: true, sparse: true },
    role: {
      type: String,
      enum: ['farmer', 'expert', 'government', 'agronomist', 'researcher', 'cooperative'],
      default: 'farmer',
    },
    location: { type: String, default: '' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    avatarUrl: { type: String, default: '/images/farmer-hero.jpg' },
    preferences: {
      weatherAlerts: { type: Boolean, default: true },
      diseaseAlerts: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      marketUpdates: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
