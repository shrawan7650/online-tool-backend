// import { Schema, model, Document } from 'mongoose';

// export interface ISubscription extends Document {
//   userId: Schema.Types.ObjectId;
//   razorpaySubscriptionId: string;
//   razorpayCustomerId: string;
//   planId: string;
//   planName: 'Pro' | 'Max Pro';
//   amount: number;
//   currency: string;
//   status: 'created' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelled' | 'completed' | 'expired';
//   currentStart: Date;
//   currentEnd: Date;
//   nextBilling?: Date;
//   totalCount?: number;
//   paidCount: number;
//   remainingCount?: number;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const SubscriptionSchema = new Schema<ISubscription>({
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true
//   },
//   razorpaySubscriptionId: {
//     type: String,
//     required: true,
//     unique: true,
//     index: true
//   },
//   razorpayCustomerId: {
//     type: String,
//     required: true,
//     index: true
//   },
//   planId: {
//     type: String,
//     required: true
//   },
//   planName: {
//     type: String,
//     enum: ['Pro', 'Max Pro'],
//     required: true
//   },
//   amount: {
//     type: Number,
//     required: true
//   },
//   currency: {
//     type: String,
//     default: 'INR'
//   },
//   status: {
//     type: String,
//     enum: ['created', 'authenticated', 'active', 'paused', 'halted', 'cancelled', 'completed', 'expired'],
//     default: 'created'
//   },
//   currentStart: {
//     type: Date,
//     required: true
//   },
//   currentEnd: {
//     type: Date,
//     required: true
//   },
//   nextBilling: {
//     type: Date
//   },
//   totalCount: {
//     type: Number
//   },
//   paidCount: {
//     type: Number,
//     default: 0
//   },
//   remainingCount: {
//     type: Number
//   }
// }, {
//   timestamps: true,
//   versionKey: false
// });

// // Indexes
// SubscriptionSchema.index({ userId: 1, status: 1 });
// SubscriptionSchema.index({ currentEnd: 1 });

// export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);