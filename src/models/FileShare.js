import { Schema, model } from 'mongoose';

const FileShareSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{6}$/,
      index: true
    },
    filename: {
      type: String,
      required: true,
      maxlength: 255
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }
    },
    autoDeleteOnRetrieve: {
      type: Boolean,
      default: false
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
FileShareSchema.index({ createdAt: -1 });
FileShareSchema.index({ expiresAt: 1 });

export const FileShare = model('FileShare', FileShareSchema);


