import { Schema, model } from 'mongoose';

const ScheduledContentSchema = new Schema(
  {
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
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Additional indexes
ScheduledContentSchema.index({ createdAt: -1 });
ScheduledContentSchema.index({ unlockAt: 1 });

export const ScheduledContent = model('ScheduledContent', ScheduledContentSchema);


