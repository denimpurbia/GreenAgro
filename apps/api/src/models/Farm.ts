import mongoose, { Schema, Document } from 'mongoose';

export interface IFarm extends Document {
  ownerId: string;
  name: string;
  locationName: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  areaAcres: number;
  primaryCrop: string;
  cropVariety: string;
  sowingDate: string;
  growthStage: string;
  soilType: string;
  irrigationMethod: string;
  boundary: Array<{ lat: number; lng: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const FarmSchema = new Schema<IFarm>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, default: 'My Farm' },
    locationName: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    areaAcres: { type: Number, default: 0 },
    primaryCrop: { type: String, default: '' },
    cropVariety: { type: String, default: '' },
    sowingDate: { type: String, default: '' },
    growthStage: { type: String, default: '' },
    soilType: { type: String, default: '' },
    irrigationMethod: { type: String, default: '' },
    boundary: [
      {
        lat: { type: Number },
        lng: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export const FarmModel = mongoose.model<IFarm>('Farm', FarmSchema);
