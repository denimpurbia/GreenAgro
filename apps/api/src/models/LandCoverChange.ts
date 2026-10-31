import mongoose, { Schema, Document } from 'mongoose';

/** Land cover change event from satellite (Dynamic World / Hansen) */
export interface ILandCoverChange extends Document {
  district: string;
  /** ISO year string e.g. "2024" */
  year: string;
  /** Change type */
  changeType:
    | 'tree_to_bare'
    | 'tree_to_built'
    | 'vegetation_loss'
    | 'possible_mining'
    | 'water_gain'
    | 'water_loss';
  /** Area affected in hectares */
  areaHa: number;
  /**
   * IMPORTANT: Possible disturbance detections MUST be labelled
   * "possible_disturbance" — never "illegal_mining"
   */
  label: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  source: string;
  dataset: string;
  retrievedAt: Date;
  quality: 'good' | 'fair' | 'poor' | 'unavailable';
  sourceType: 'observed' | 'modelled' | 'derived' | 'unavailable' | 'stale';
  createdAt: Date;
  updatedAt: Date;
}

const LandCoverChangeSchema = new Schema<ILandCoverChange>(
  {
    district: { type: String, required: true, index: true },
    year: { type: String, required: true },
    changeType: {
      type: String,
      enum: [
        'tree_to_bare',
        'tree_to_built',
        'vegetation_loss',
        'possible_mining',
        'water_gain',
        'water_loss',
      ],
      required: true,
    },
    areaHa: { type: Number, default: 0 },
    label: { type: String, default: 'Possible disturbance — field verification required.' },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    source: { type: String, default: 'Google Dynamic World / Hansen GFC' },
    dataset: { type: String, default: 'GOOGLE/DYNAMICWORLD/V1' },
    retrievedAt: { type: Date, default: Date.now },
    quality: { type: String, enum: ['good', 'fair', 'poor', 'unavailable'], default: 'unavailable' },
    sourceType: {
      type: String,
      enum: ['observed', 'modelled', 'derived', 'unavailable', 'stale'],
      default: 'unavailable',
    },
  },
  { timestamps: true }
);

LandCoverChangeSchema.index({ location: '2dsphere' }, { sparse: true });
LandCoverChangeSchema.index({ district: 1, year: 1 });

export const LandCoverChangeModel = mongoose.model<ILandCoverChange>(
  'LandCoverChange',
  LandCoverChangeSchema
);

