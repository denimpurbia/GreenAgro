import mongoose, { Schema, Document } from 'mongoose';

/** Minimum Support Price (MSP) rate record */
export interface IMspRate extends Document {
  commodity: string;
  season: 'Kharif' | 'Rabi' | 'Commercial';
  year: string; // e.g. "2024-25"
  mspPrice: number; // Rs/quintal
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const MspRateSchema = new Schema<IMspRate>(
  {
    commodity: { type: String, required: true, index: true },
    season: { type: String, enum: ['Kharif', 'Rabi', 'Commercial'], default: 'Kharif' },
    year: { type: String, required: true },
    mspPrice: { type: Number, required: true },
    source: { type: String, default: 'CACP / Ministry of Agriculture' },
  },
  { timestamps: true }
);

MspRateSchema.index({ commodity: 1, year: -1 });

export const MspRateModel = mongoose.model<IMspRate>('MspRate', MspRateSchema);

