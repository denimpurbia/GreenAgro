import mongoose, { Schema, Document } from 'mongoose';

/** Mandi (market) location */
export interface IMandi extends Document {
  mandiCode: string;
  nameEn: string;
  nameHi: string;
  district: string;
  state: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  eNamLink?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MandiSchema = new Schema<IMandi>(
  {
    mandiCode: { type: String, required: true, unique: true },
    nameEn: { type: String, required: true },
    nameHi: { type: String, default: '' },
    district: { type: String, required: true, index: true },
    state: { type: String, default: 'Rajasthan' },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    eNamLink: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

MandiSchema.index({ location: '2dsphere' }, { sparse: true });

export const MandiModel = mongoose.model<IMandi>('Mandi', MandiSchema);

