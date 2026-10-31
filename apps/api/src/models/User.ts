import mongoose, { Schema, Document } from 'mongoose';

export type PublicUserRole = 'farmer' | 'govt_org';
export type LegacyUserRole = 'farmer' | 'govt_org' | 'government' | 'expert' | 'agronomist' | 'researcher' | 'cooperative';
export type AccountVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  role: LegacyUserRole;
  accountStatus: AccountVerificationStatus;
  isSuperAdmin?: boolean;
  customPermissions?: string[];
  location: string;
  language: 'en' | 'hi';
  avatarUrl: string;
  // Government / Organization fields (only populated for govt_org accounts)
  organizationName?: string;
  designation?: string;
  state?: string;
  district?: string;
  organizationType?: string;
  officialIdInfo?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  suspendedReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  suspendedBy?: string;
  suspendedAt?: Date;
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
      enum: ['farmer', 'govt_org', 'government', 'expert', 'agronomist', 'researcher', 'cooperative'],
      default: 'farmer',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'verified',
      index: true,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    location: { type: String, default: '' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    avatarUrl: { type: String, default: '/images/farmer-hero.jpg' },
    organizationName: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    district: { type: String, default: '', trim: true },
    organizationType: { type: String, default: '', trim: true },
    officialIdInfo: { type: String, default: '', trim: true, select: false },
    verificationNotes: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    suspendedReason: { type: String, default: '' },
    verifiedBy: { type: String, default: '' },
    verifiedAt: { type: Date },
    suspendedBy: { type: String, default: '' },
    suspendedAt: { type: Date },
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
