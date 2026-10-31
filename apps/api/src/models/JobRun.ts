import mongoose, { Schema, Document } from 'mongoose';

export interface IJobRun extends Document {
  jobName: string;
  status: 'running' | 'success' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

const JobRunSchema = new Schema<IJobRun>(
  {
    jobName: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['running', 'success', 'failed'],
      default: 'running',
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    recordsProcessed: { type: Number, default: 0 },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

JobRunSchema.index({ jobName: 1, startedAt: -1 });

export const JobRunModel = mongoose.model<IJobRun>('JobRun', JobRunSchema);

