import mongoose, { Schema, Document } from 'mongoose';

/**
 * Lake — static metadata document per lake.
 * Seeded from lakeRegistry.ts on first run.
 */
export interface ILake extends Document {
  slug: string;
  nameEn: string;
  nameHi: string;
  district: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  baselineAreaHa: number;
  builtYear?: number;
  catchmentKm2?: number;
  description: string;
  descriptionHi: string;
  createdAt: Date;
  updatedAt: Date;
}

const LakeSchema = new Schema<ILake>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    nameEn: { type: String, required: true },
    nameHi: { type: String, default: '' },
    district: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    baselineAreaHa: { type: Number, default: 0 },
    builtYear: { type: Number },
    catchmentKm2: { type: Number },
    description: { type: String, default: '' },
    descriptionHi: { type: String, default: '' },
  },
  { timestamps: true }
);

// 2dsphere index for geo-spatial queries
LakeSchema.index({ location: '2dsphere' });

export const LakeModel = mongoose.model<ILake>('Lake', LakeSchema);

