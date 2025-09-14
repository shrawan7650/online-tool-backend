import { Schema, model, Document } from 'mongoose';

export interface IScheduledContent extends Document {
  code: string;
  type: 'text' | 'file';
  content: string;
  title?: string;
  unlockAt: Date;
  expiresAt: Date;
  createdIp: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledContentSchema = new Schema<IScheduledContent>({
  code: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{6}$/,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'file']
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  title: {
    type: String,
    maxlength: 200
  },
  unlockAt: {
    type: Date,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  createdIp: {
    type: String,
    required: true,
    maxlength: 45
  }
}, {
  timestamps: true,
  versionKey: false
});

// Additional indexes
ScheduledContentSchema.index({ createdAt: -1 });
ScheduledContentSchema.index({ unlockAt: 1 });

export const ScheduledContent = model<IScheduledContent>('ScheduledContent', ScheduledContentSchema);