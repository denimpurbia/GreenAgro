import mongoose, { Schema, Document } from 'mongoose';

export interface ICacheEntry extends Document {
  key: string;
  data: any;
  expiresAt: Date;
  createdAt: Date;
}

const CacheEntrySchema = new Schema<ICacheEntry>(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL index
  },
  { timestamps: true }
);

export const CacheEntryModel = mongoose.model<ICacheEntry>('CacheEntry', CacheEntrySchema);

