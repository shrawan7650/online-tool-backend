import { Schema, model } from 'mongoose';

const ClipboardNoteSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{6}$/,
      index: true
    },
    textEnc: {
      type: Buffer,
      required: true
    },
    iv: {
      type: Buffer,
      required: true
    },
    authTag: {
      type: Buffer,
      required: true
    },
    pinHash: {
      type: String,
      required: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 } // TTL index for automatic deletion
    },
    remainingReads: {
      type: Number,
      required: true,
      default: 3,
      min: 0
    },
    createdIp: {
      type: String,
      required: true,
      maxlength: 45 // IPv6 max length
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Additional indexes for performance
ClipboardNoteSchema.index({ createdAt: -1 });
ClipboardNoteSchema.index({ expiresAt: 1 });

export const ClipboardNote = model('ClipboardNote', ClipboardNoteSchema);


