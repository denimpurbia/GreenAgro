import mongoose, { Schema, Document } from 'mongoose';

export interface IDiseaseDiagnosis extends Document {
  userId: string;
  farmId?: string;
  crop: string;
  diagnosis: string;
  diseaseName: string;
  confidence: string;
  confidenceScore: number;
  severity: 'low' | 'medium' | 'high' | 'none';
  symptoms: string[];
  observedSymptoms: string[];
  recommendedActions: string[];
  prevention: string[];
  disclaimer: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiseaseDiagnosisSchema = new Schema<IDiseaseDiagnosis>(
  {
    userId: { type: String, required: true, index: true },
    farmId: { type: String, default: '', index: true },
    crop: { type: String, default: 'General Crop' },
    diagnosis: { type: String, default: '' },
    diseaseName: { type: String, required: true },
    confidence: { type: String, default: 'Moderate' },
    confidenceScore: { type: Number, default: 0 },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'none'],
      default: 'low',
    },
    symptoms: [{ type: String }],
    observedSymptoms: [{ type: String }],
    recommendedActions: [{ type: String }],
    prevention: [{ type: String }],
    disclaimer: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

DiseaseDiagnosisSchema.index({ userId: 1, createdAt: -1 });
DiseaseDiagnosisSchema.index({ farmId: 1, createdAt: -1 });

export const DiseaseDiagnosisModel = mongoose.model<IDiseaseDiagnosis>(
  'DiseaseDiagnosis',
  DiseaseDiagnosisSchema
);
