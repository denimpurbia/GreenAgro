import mongoose, { Schema, Document } from 'mongoose';

export type AuditActionType =
  | 'SUPER_ADMIN_BOOTSTRAP'
  | 'GOVT_ACCOUNT_APPROVED'
  | 'GOVT_ACCOUNT_REJECTED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED'
  | 'PERMISSIONS_UPDATED';

export interface IAuditLog extends Document {
  action: AuditActionType;
  targetUserId: string;
  targetUserEmail: string;
  targetUserName?: string;
  adminId: string;
  adminEmail: string;
  previousStatus?: string;
  newStatus?: string;
  reasonOrNotes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      enum: [
        'SUPER_ADMIN_BOOTSTRAP',
        'GOVT_ACCOUNT_APPROVED',
        'GOVT_ACCOUNT_REJECTED',
        'ACCOUNT_SUSPENDED',
        'ACCOUNT_REACTIVATED',
        'PERMISSIONS_UPDATED',
      ],
      required: true,
      index: true,
    },
    targetUserId: { type: String, required: true, index: true },
    targetUserEmail: { type: String, required: true, lowercase: true, trim: true },
    targetUserName: { type: String, default: '' },
    adminId: { type: String, required: true, index: true },
    adminEmail: { type: String, required: true, trim: true },
    previousStatus: { type: String, default: '' },
    newStatus: { type: String, default: '' },
    reasonOrNotes: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetUserId: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

