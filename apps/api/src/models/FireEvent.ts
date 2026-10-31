import mongoose, { Schema, Document } from 'mongoose';

/** NASA FIRMS fire event */
export interface IFireEvent extends Document {
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  district?: string;
  detectedAt: Date;
  satellite: string; // MODIS / VIIRS
  confidence: 'low' | 'nominal' | 'high';
  frp?: number; // Fire Radiative Power in MW
  brightness?: number; // Brightness temperature
  acqDate: string; // YYYY-MM-DD
  acqTime: string; // HHMM
  source: string;
  dataset: string;
  retrievedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FireEventSchema = new Schema<IFireEvent>(
  {
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    district: { type: String, index: true },
    detectedAt: { type: Date, required: true },
    satellite: { type: String, default: 'VIIRS' },
    confidence: { type: String, enum: ['low', 'nominal', 'high'], default: 'nominal' },
    frp: { type: Number },
    brightness: { type: Number },
    acqDate: { type: String, required: true },
    acqTime: { type: String, default: '' },
    source: { type: String, default: 'NASA FIRMS' },
    dataset: { type: String, default: 'VIIRS_SNPP_NRT' },
    retrievedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

FireEventSchema.index({ location: '2dsphere' });
FireEventSchema.index({ detectedAt: -1 });
// TTL: auto-delete fire events older than 90 days
FireEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const FireEventModel = mongoose.model<IFireEvent>('FireEvent', FireEventSchema);

