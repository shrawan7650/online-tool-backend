import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    profilePicture: {
      type: String,
      default: ''
    },
    isPro: {
      type: Boolean,
      default: false
    },
    isMaxPro: {
      type: Boolean,
      default: false
    },
    subscriptionId: {
      type: String,
      sparse: true
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'expired'
    },
    subscriptionExpiry: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for performance
UserSchema.index({ email: 1, googleId: 1 });
UserSchema.index({ subscriptionExpiry: 1 });

export const User = model('User', UserSchema);


