import mongoose, { Schema, Document } from 'mongoose';

export type ReportCategory =
  | 'illegal_mining'
  | 'lake_encroachment'
  | 'waste_dumping'
  | 'tree_cutting'
  | 'forest_fire'
  | 'water_pollution'
  | 'other';

export type ReportStatus = 'pending' | 'verified' | 'rejected';

export interface ICommunityReport extends Document {
  category: ReportCategory;
  description: string;
  /** Private precise coordinates — never exposed publicly */
  preciseLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  /**
   * Rounded to ~500m for public display.
   * Computed on creation, never recomputed from precise.
   */
  publicLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  district?: string;
  /** Cloudinary URL or local path — EXIF stripped */
  photoUrl?: string;
  photoPublicId?: string;
  /** Whether the reporter wants to remain anonymous */
  isAnonymous: boolean;
  /** Reporter user ID — never exposed on public endpoints */
  reporterId?: string;
  status: ReportStatus;
  /** Moderator user ID */
  moderatedBy?: string;
  moderatedAt?: Date;
  rejectionReason?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityReportSchema = new Schema<ICommunityReport>(
  {
    category: {
      type: String,
      enum: ['illegal_mining', 'lake_encroachment', 'waste_dumping', 'tree_cutting', 'forest_fire', 'water_pollution', 'other'],
      required: true,
    },
    description: { type: String, required: true, maxlength: 2000 },
    preciseLocation: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    publicLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    district: { type: String },
    photoUrl: { type: String },
    photoPublicId: { type: String },
    isAnonymous: { type: Boolean, default: false },
    reporterId: { type: String }, // never exposed publicly
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderatedBy: { type: String },
    moderatedAt: { type: Date },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 2dsphere for geo queries on PUBLIC location only
CommunityReportSchema.index({ publicLocation: '2dsphere' });
CommunityReportSchema.index({ district: 1, status: 1 });
CommunityReportSchema.index({ submittedAt: -1 });

export const CommunityReportModel = mongoose.model<ICommunityReport>(
  'CommunityReport',
  CommunityReportSchema
);

