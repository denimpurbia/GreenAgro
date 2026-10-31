import mongoose, { Schema, Document } from 'mongoose';

/**
 * LakeObservation — monthly satellite-derived water quality snapshot.
 * All values are modelled estimates from satellite indices.
 * Never present as laboratory measurements.
 */
export interface ILakeObservation extends Document {
  lakeSlug: string;
  /** ISO month string: e.g. "2025-07" */
  month: string;
  /** Water surface area in hectares from MNDWI/NDWI */
  waterAreaHa?: number;
  /** MNDWI mean value (-1 to 1) */
  mndwi?: number;
  /** NDTI mean value — turbidity proxy (-1 to 1) */
  ndti?: number;
  /** NDCI mean value — chlorophyll/algal bloom proxy (-1 to 1) */
  ndci?: number;
  /** Estimated encroachment area in hectares */
  encroachmentHa?: number;
  /** Calculated lake health score 0-100 */
  healthScore?: number;
  /** Breakdown of health score components */
  healthBreakdown?: {
    waterAreaScore: number;   // 40% weight
    ndtiScore: number;        // 25% weight
    ndciScore: number;        // 25% weight
    encroachmentScore: number; // 10% weight
  };
  /** Whether clear imagery was available */
  clearImageryAvailable: boolean;
  /** Data source */
  source: string;
  dataset: string;
  retrievedAt: Date;
  quality: 'good' | 'fair' | 'poor' | 'unavailable';
  sourceType: 'observed' | 'modelled' | 'derived' | 'unavailable' | 'stale';
  /** Gemini AI explanation (English) */
  aiExplanationEn?: string;
  /** Gemini AI explanation (Hindi) */
  aiExplanationHi?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LakeObservationSchema = new Schema<ILakeObservation>(
  {
    lakeSlug: { type: String, required: true, index: true },
    month: { type: String, required: true },
    waterAreaHa: { type: Number },
    mndwi: { type: Number },
    ndti: { type: Number },
    ndci: { type: Number },
    encroachmentHa: { type: Number, default: 0 },
    healthScore: { type: Number },
    healthBreakdown: {
      waterAreaScore: { type: Number },
      ndtiScore: { type: Number },
      ndciScore: { type: Number },
      encroachmentScore: { type: Number },
    },
    clearImageryAvailable: { type: Boolean, default: false },
    source: { type: String, default: 'Sentinel-2' },
    dataset: { type: String, default: 'COPERNICUS/S2_SR_HARMONIZED' },
    retrievedAt: { type: Date, default: Date.now },
    quality: {
      type: String,
      enum: ['good', 'fair', 'poor', 'unavailable'],
      default: 'unavailable',
    },
    sourceType: {
      type: String,
      enum: ['observed', 'modelled', 'derived', 'unavailable', 'stale'],
      default: 'unavailable',
    },
    aiExplanationEn: { type: String },
    aiExplanationHi: { type: String },
  },
  { timestamps: true }
);

// Compound index: each lake has one observation per month
LakeObservationSchema.index({ lakeSlug: 1, month: 1 }, { unique: true });

export const LakeObservationModel = mongoose.model<ILakeObservation>(
  'LakeObservation',
  LakeObservationSchema
);

