import mongoose, { Schema, Document } from 'mongoose';

/** Daily mandi price record from data.gov.in / Agmarknet */
export interface IMandiPrice extends Document {
  mandiCode: string;
  mandiName: string;
  district: string;
  commodity: string;
  variety?: string;
  /** Date string YYYY-MM-DD */
  priceDate: string;
  minPrice: number;  // Rs/quintal
  maxPrice: number;  // Rs/quintal
  modalPrice: number; // Rs/quintal
  /** Whether this record is older than 3 days */
  isStale: boolean;
  source: string;
  dataset: string;
  retrievedAt: Date;
  sourceType: 'observed' | 'stale' | 'unavailable';
  createdAt: Date;
  updatedAt: Date;
}

const MandiPriceSchema = new Schema<IMandiPrice>(
  {
    mandiCode: { type: String, required: true, index: true },
    mandiName: { type: String, required: true },
    district: { type: String, required: true, index: true },
    commodity: { type: String, required: true, index: true },
    variety: { type: String },
    priceDate: { type: String, required: true },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    modalPrice: { type: Number, required: true },
    isStale: { type: Boolean, default: false },
    source: { type: String, default: 'data.gov.in' },
    dataset: { type: String, default: 'data.gov.in/agmarknet' },
    retrievedAt: { type: Date, default: Date.now },
    sourceType: {
      type: String,
      enum: ['observed', 'stale', 'unavailable'],
      default: 'observed',
    },
  },
  { timestamps: true }
);

MandiPriceSchema.index({ mandiCode: 1, commodity: 1, priceDate: -1 });
MandiPriceSchema.index({ commodity: 1, priceDate: -1 });
// TTL: auto-delete price records older than 120 days
MandiPriceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 * 24 * 3600 });

export const MandiPriceModel = mongoose.model<IMandiPrice>('MandiPrice', MandiPriceSchema);

