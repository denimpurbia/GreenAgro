import mongoose, { Schema, Document } from 'mongoose';

export interface IScheme extends Document {
  code: string;
  nameEn: string;
  nameHi: string;
  category: 'soil' | 'solar' | 'insurance' | 'irrigation' | 'subsidy' | 'other';
  descriptionEn: string;
  descriptionHi: string;
  benefitsEn: string;
  benefitsHi: string;
  eligibilityEn: string;
  eligibilityHi: string;
  officialUrl: string;
  isNational: boolean;
  state?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SchemeSchema = new Schema<IScheme>(
  {
    code: { type: String, required: true, unique: true },
    nameEn: { type: String, required: true },
    nameHi: { type: String, default: '' },
    category: {
      type: String,
      enum: ['soil', 'solar', 'insurance', 'irrigation', 'subsidy', 'other'],
      default: 'other',
    },
    descriptionEn: { type: String, required: true },
    descriptionHi: { type: String, default: '' },
    benefitsEn: { type: String, default: '' },
    benefitsHi: { type: String, default: '' },
    eligibilityEn: { type: String, default: '' },
    eligibilityHi: { type: String, default: '' },
    officialUrl: { type: String, default: '' },
    isNational: { type: Boolean, default: true },
    state: { type: String, default: 'Rajasthan' },
  },
  { timestamps: true }
);

export const SchemeModel = mongoose.model<IScheme>('Scheme', SchemeSchema);

