import mongoose, { Schema, Document } from 'mongoose';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory =
  | 'water_stress'
  | 'severe_erosion'
  | 'heavy_rainfall'
  | 'lake_water_drop'
  | 'ndci_increase'
  | 'fire_nearby'
  | 'land_disturbance'
  | 'mandi_below_msp'
  | 'target_price_reached';

export interface IAlert extends Document {
  userId?: string; // Optional: specific to a user/farm or global broadcast
  farmId?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    userId: { type: String, index: true },
    farmId: { type: String, index: true },
    category: {
      type: String,
      required: true,
      enum: [
        'water_stress',
        'severe_erosion',
        'heavy_rainfall',
        'lake_water_drop',
        'ndci_increase',
        'fire_nearby',
        'land_disturbance',
        'mandi_below_msp',
        'target_price_reached',
      ],
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
    },
    title: { type: String, required: true },
    titleHi: { type: String, default: '' },
    message: { type: String, required: true },
    messageHi: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AlertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
AlertSchema.index({ createdAt: -1 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);

