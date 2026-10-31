import mongoose, { Schema, Document } from 'mongoose';

/**
 * FarmTerrain — cached terrain analysis results for a farm polygon.
 * Recomputed by background job; never calculated inline in request handlers.
 */
export interface IFarmTerrain extends Document {
  farmId: string;
  ownerId: string;
  /** Mean elevation in metres (SRTM) */
  elevationMeanM?: number;
  /** Mean slope in degrees */
  slopeMeanDeg?: number;
  /** Max slope in degrees */
  slopeMaxDeg?: number;
  /** Dominant aspect (N/NE/E/SE/S/SW/W/NW) */
  dominantAspect?: string;
  /** Slope class: flat/gentle/moderate/steep/very_steep */
  slopeClass?: 'flat' | 'gentle' | 'moderate' | 'steep' | 'very_steep';
  /** RUSLE-lite erosion risk */
  erosionRisk?: 'low' | 'moderate' | 'high' | 'severe';
  /** RUSLE factor A (t/ha/year estimate) */
  rusleA?: number;
  rusleR?: number; // Rainfall erosivity
  rusleK?: number; // Soil erodibility
  rusleLS?: number; // Slope length-steepness
  rusleC?: number; // Vegetation cover
  rusleP?: number; // Conservation practices
  /** Recommended conservation measures */
  recommendations?: string[];
  recommendationsHi?: string[];
  /** Nearest downstream lake slug */
  downstreamLakeSlug?: string;
  /** Distance to nearest lake in km */
  downstreamLakeDistKm?: number;
  source: string;
  dataset: string;
  retrievedAt: Date;
  quality: 'good' | 'fair' | 'poor' | 'unavailable';
  sourceType: 'observed' | 'modelled' | 'derived' | 'unavailable' | 'stale';
  createdAt: Date;
  updatedAt: Date;
}

const FarmTerrainSchema = new Schema<IFarmTerrain>(
  {
    farmId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    elevationMeanM: { type: Number },
    slopeMeanDeg: { type: Number },
    slopeMaxDeg: { type: Number },
    dominantAspect: { type: String },
    slopeClass: {
      type: String,
      enum: ['flat', 'gentle', 'moderate', 'steep', 'very_steep'],
    },
    erosionRisk: {
      type: String,
      enum: ['low', 'moderate', 'high', 'severe'],
    },
    rusleA: { type: Number },
    rusleR: { type: Number },
    rusleK: { type: Number },
    rusleLS: { type: Number },
    rusleC: { type: Number },
    rusleP: { type: Number },
    recommendations: [{ type: String }],
    recommendationsHi: [{ type: String }],
    downstreamLakeSlug: { type: String },
    downstreamLakeDistKm: { type: Number },
    source: { type: String, default: 'SRTM+CHIRPS+SoilGrids' },
    dataset: { type: String, default: 'USGS/SRTMGL1_003' },
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
  },
  { timestamps: true }
);

FarmTerrainSchema.index({ farmId: 1 }, { unique: true });

export const FarmTerrainModel = mongoose.model<IFarmTerrain>('FarmTerrain', FarmTerrainSchema);

