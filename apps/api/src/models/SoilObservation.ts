import mongoose, { Schema, Document } from 'mongoose';

export interface ISoilObservation extends Document {
  userId: string;
  farmId?: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
  score: number;
  rating: 'Poor' | 'Moderate' | 'Good' | 'Excellent';
  nutrients: Array<{
    name: string;
    value: number;
    unit: string;
    status: 'Low' | 'Medium' | 'Good' | 'Optimal';
    color: 'red' | 'amber' | 'green';
  }>;
  limitingFactor: string;
  aiInsight: string;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SoilObservationSchema = new Schema<ISoilObservation>(
  {
    userId: { type: String, required: true, index: true },
    farmId: { type: String, default: '', index: true },
    ph: { type: Number, required: true },
    nitrogen: { type: Number, required: true },
    phosphorus: { type: Number, required: true },
    potassium: { type: Number, required: true },
    organicCarbon: { type: Number, required: true },
    score: { type: Number, required: true },
    rating: {
      type: String,
      enum: ['Poor', 'Moderate', 'Good', 'Excellent'],
      required: true,
    },
    nutrients: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true },
        unit: { type: String, required: true },
        status: { type: String, required: true },
        color: { type: String, required: true },
      },
    ],
    limitingFactor: { type: String, default: '' },
    aiInsight: { type: String, default: '' },
    recommendations: [{ type: String }],
  },
  { timestamps: true }
);

SoilObservationSchema.index({ userId: 1, createdAt: -1 });
SoilObservationSchema.index({ farmId: 1, createdAt: -1 });

export const SoilObservationModel = mongoose.model<ISoilObservation>(
  'SoilObservation',
  SoilObservationSchema
);
