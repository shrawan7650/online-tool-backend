import { Schema, model, Document } from 'mongoose';

export interface IClipboardNote extends Document {
  code: string;
  textEnc: Buffer;
  iv: Buffer;
  authTag: Buffer;
  pinHash?: string;
  expiresAt: Date;
  remainingReads: number;
  createdIp: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClipboardNoteSchema = new Schema<IClipboardNote>({
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
}, {
  timestamps: true,
  versionKey: false
});

// Additional indexes for performance
ClipboardNoteSchema.index({ createdAt: -1 });
ClipboardNoteSchema.index({ expiresAt: 1 });

export const ClipboardNote = model<IClipboardNote>('ClipboardNote', ClipboardNoteSchema);