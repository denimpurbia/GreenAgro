import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvisoryMessage extends Document {
  userId: string;
  farmId?: string;
  role: 'user' | 'assistant';
  sender: 'user' | 'assistant';
  content: string;
  text: string;
  language: 'en' | 'hi';
  metadata?: Record<string, any>;
  contextSnapshot?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AdvisoryMessageSchema = new Schema<IAdvisoryMessage>(
  {
    userId: { type: String, required: true, index: true },
    farmId: { type: String, default: '', index: true },
    role: { type: String, enum: ['user', 'assistant'], default: 'user' },
    sender: { type: String, enum: ['user', 'assistant'], default: 'user' },
    content: { type: String, default: '' },
    text: { type: String, default: '' },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    metadata: { type: Schema.Types.Mixed },
    contextSnapshot: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AdvisoryMessageSchema.index({ userId: 1, createdAt: 1 });
AdvisoryMessageSchema.index({ farmId: 1, createdAt: 1 });

export const AdvisoryMessageModel = mongoose.model<IAdvisoryMessage>(
  'AdvisoryMessage',
  AdvisoryMessageSchema
);
