// import { Router } from 'express';
// import Razorpay from 'razorpay';
// import crypto from 'crypto';
// import { User } from '../models/User.js';
// import { Subscription } from '../models/Subscription.js';
// import { authMiddleware, AuthRequest } from '../middleware/auth.js';
// import asyncHandler from 'express-async-handler';
// import { z } from 'zod';
// import pino from 'pino';

// const router = Router();
// const logger = pino();

// // Initialize Razorpay
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!
// });

// // Subscription plans
// const PLANS = {
//   pro: {
//     id: process.env.RAZORPAY_PRO_PLAN_ID!,
//     name: 'Pro',
//     amount: 19900, // ₹199 in paise
//     currency: 'INR',
//     interval: 1,
//     period: 'monthly'
//   },
//   maxpro: {
//     id: process.env.RAZORPAY_MAX_PRO_PLAN_ID!,
//     name: 'Max Pro',
//     amount: 29900, // ₹299 in paise
//     currency: 'INR',
//     interval: 1,
//     period: 'monthly'
//   }
// };

// // Validation schemas
// const CreateSubscriptionSchema = z.object({
//   planType: z.enum(['pro', 'maxpro'])
// });

// const VerifyPaymentSchema = z.object({
//   razorpay_payment_id: z.string(),
//   razorpay_subscription_id: z.string(),
//   razorpay_signature: z.string()
// });

// // Get subscription plans
// router.post('/create', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
//   const { planType } = CreateSubscriptionSchema.parse(req.body);
//   const user = req.user as IUser; // Cast user to IUser

//   try {
//     const plan = PLANS[planType];
    
//     // Create customer in Razorpay if not exists
//     let customer;
//     try {
//       customer = await razorpay.customers.create({
//         name: user.name,
//         email: user.email,
//         contact: '', // Optional phone number
//         fail_existing: '0'
//       });
//     } catch (error: any) {
//       if (error.error?.code === 'BAD_REQUEST_ERROR' && error.error?.description?.includes('already exists')) {
//         // Customer already exists, fetch it
//         const customers = await razorpay.customers.all({
//           email: user.email
//         });
//         customer = customers.items[0];
//       } else {
//         throw error;
//       }
//     }

//     // Create subscription
//     const subscription = await razorpay.subscriptions.create({
//       plan_id: plan.id,
//       customer_id: customer.id,
//       quantity: 1,
//       total_count: 12, // 12 months
//       addons: [],
//       notes: {
//         userId: user._id.toString(),
//         planType
//       }
//     });

//     // Save subscription to database
//     const dbSubscription = new Subscription({
//       userId: user._id,
//       razorpaySubscriptionId: subscription.id,
//       razorpayCustomerId: customer.id,
//       planId: plan.id,
//       planName: plan.name as 'Pro' | 'Max Pro',
//       amount: plan.amount,
//       currency: plan.currency,
//       status: subscription.status,
//       currentStart: new Date(subscription.current_start * 1000),
//       currentEnd: new Date(subscription.current_end * 1000),
//       totalCount: subscription.total_count,
//       paidCount: subscription.paid_count,
//       remainingCount: subscription.remaining_count
//     });

//     await dbSubscription.save();

//     res.json({
//       ok: true,
//       subscription: {
//         id: subscription.id,
//         status: subscription.status,
//         planName: plan.name,
//         amount: plan.amount / 100, // Convert to rupees
//         currency: plan.currency
//       }
//     });

//   } catch (error) {
//     logger.error('Subscription creation error:', error);
//     res.status(500).json({
//       ok: false,
//       error: {
//         code: 'SUBSCRIPTION_CREATION_FAILED',
//         message: 'Failed to create subscription'
//       }
//     });
//   }
// }));

// // Verify payment
// router.post('/verify', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
//   const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = VerifyPaymentSchema.parse(req.body);
//   const user = req.user as IUser; // Cast user to IUser

//   try {
//     // Verify signature
//     const body = razorpay_payment_id + '|' + razorpay_subscription_id;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//       .update(body.toString())
//       .digest('hex');

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         ok: false,
//         error: {
//           code: 'INVALID_SIGNATURE',
//           message: 'Payment verification failed'
//         }
//       });
//     }

//     // Update subscription status
//     const subscription = await Subscription.findOne({
//       razorpaySubscriptionId: razorpay_subscription_id,
//       userId: user._id
//     });

//     if (!subscription) {
//       return res.status(404).json({
//         ok: false,
//         error: {
//           code: 'SUBSCRIPTION_NOT_FOUND',
//           message: 'Subscription not found'
//         }
//       });
//     }

//     // Update subscription status
//     subscription.status = 'active';
//     await subscription.save();

//     // Update user subscription status
//     user.isPro = true;
//     user.isMaxPro = subscription.planName === 'Max Pro';
//     user.subscriptionId = razorpay_subscription_id;
//     user.subscriptionStatus = 'active';
//     user.subscriptionExpiry = subscription.currentEnd;
//     await user.save();

//     logger.info(`Subscription activated for user: ${user.email}, plan: ${subscription.planName}`);

//     res.json({
//       ok: true,
//       message: 'Payment verified and subscription activated',
//       subscription: {
//         status: 'active',
//         planName: subscription.planName,
//         expiresAt: subscription.currentEnd
//       }
//     });

//   } catch (error) {
//     logger.error('Payment verification error:', error);
//     res.status(500).json({
//       ok: false,
//       error: {
//         code: 'PAYMENT_VERIFICATION_FAILED',
//         message: 'Payment verification failed'
//       }
//     });
//   }
// }));

// // Razorpay webhook
// router.post('/webhook', asyncHandler(async (req, res) => {
//   const signature = req.headers['x-razorpay-signature'] as string;
//   const body = JSON.stringify(req.body);

//   try {
//     // Verify webhook signature
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
//       .update(body)
//       .digest('hex');

//     if (expectedSignature !== signature) {
//       logger.warn('Invalid webhook signature');
//       return res.status(400).json({ error: 'Invalid signature' });
//     }

//     const event = req.body;
//     logger.info(`Webhook received: ${event.event}`);

//     switch (event.event) {
//       case 'subscription.activated':
//         await handleSubscriptionActivated(event.payload.subscription.entity);
//         break;
      
//       case 'subscription.charged':
//         await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity);
//         break;
      
//       case 'subscription.cancelled':
//         await handleSubscriptionCancelled(event.payload.subscription.entity);
//         break;
      
//       case 'subscription.completed':
//         await handleSubscriptionCompleted(event.payload.subscription.entity);
//         break;
      
//       case 'subscription.paused':
//         await handleSubscriptionPaused(event.payload.subscription.entity);
//         break;
      
//       case 'subscription.resumed':
//         await handleSubscriptionResumed(event.payload.subscription.entity);
//         break;
      
//       default:
//         logger.info(`Unhandled webhook event: ${event.event}`);
//     }

//     res.json({ status: 'ok' });

//   } catch (error) {
//     logger.error('Webhook processing error:', error);
//     res.status(500).json({ error: 'Webhook processing failed' });
//   }
// }));

// // Webhook handlers
// async function handleSubscriptionActivated(subscription: any) {
//   const dbSubscription = await Subscription.findOne({
//     razorpaySubscriptionId: subscription.id
//   });

//   if (dbSubscription) {
//     dbSubscription.status = 'active';
//     dbSubscription.currentStart = new Date(subscription.current_start * 1000);
//     dbSubscription.currentEnd = new Date(subscription.current_end * 1000);
//     await dbSubscription.save();

//     // Update user
//     const user = await User.findById(dbSubscription.userId);
//     if (user) {
//       user.isPro = true;
//       user.isMaxPro = dbSubscription.planName === 'Max Pro';
//       user.subscriptionStatus = 'active';
//       user.subscriptionExpiry = dbSubscription.currentEnd;
//       await user.save();
//     }
//   }
// }

// async function handleSubscriptionCharged(subscription: any, payment: any) {
//   const dbSubscription = await Subscription.findOne({
//     razorpaySubscriptionId: subscription.id
//   });

//   if (dbSubscription) {
//     dbSubscription.paidCount = subscription.paid_count;
//     dbSubscription.remainingCount = subscription.remaining_count;
//     dbSubscription.currentEnd = new Date(subscription.current_end * 1000);
//     await dbSubscription.save();

//     // Update user expiry
//     const user = await User.findById(dbSubscription.userId);
//     if (user) {
//       user.subscriptionExpiry = dbSubscription.currentEnd;
//       await user.save();
//     }
//   }
// }

// async function handleSubscriptionCancelled(subscription: any) {
//   const dbSubscription = await Subscription.findOne({
//     razorpaySubscriptionId: subscription.id
//   });

//   if (dbSubscription) {
//     dbSubscription.status = 'cancelled';
//     await dbSubscription.save();

//     // Update user - keep access until current period ends
//     const user = await User.findById(dbSubscription.userId);
//     if (user) {
//       user.subscriptionStatus = 'cancelled';
//       await user.save();
//     }
//   }
// }

// async function handleSubscriptionCompleted(subscription: any) {
//   const dbSubscription = await Subscription.findOne({
//     razorpaySubscriptionId: subscription.id
//   });

//   if (dbSubscription) {
//     dbSubscription.status = 'completed';
//     await dbSubscription.save();

//     // Remove user access
//     const user = await User.findById(dbSubscription.userId);
//     if (user) {
//       user.isPro = false;
//       user.isMaxPro = false;
//       user.subscriptionStatus = 'expired';
//       await user.save();
//     }
//   }
// }

// async function handleSubscriptionPaused(subscription: any) {
//   const dbSubscription = await Subscription.findOne({
//     razorpaySubscriptionId: subscription.id
//   });

//   if (dbSubscription) {
//     dbSubscription.status = 'paused';
//     await dbSubscription.save();

//     // Update user
//     const user = await User.findById(dbSubscription.userId);
//     if (user) {
//       user.subscriptionStatus = 'paused';
//       await user.save();
//     }
//   }
// }

// async function handleSubscriptionResumed(subscription: any) {
//   const dbSubscription = await Subscription.findOne({
//     razorpaySubscriptionId: subscription.id
//   });

//   if (dbSubscription) {
//     dbSubscription.status = 'active';
//     await dbSubscription.save();

//     // Update user
//     const user = await User.findById(dbSubscription.userId);
//     if (user) {
//       user.subscriptionStatus = 'active';
//       await user.save();
//     }
//   }
// }

// // Get user subscription
// router.get('/status', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
//   const user = req.user!;
  
//   const subscription = await Subscription.findOne({
//     userId: user._id,
//     status: { $in: ['active', 'cancelled'] }
//   }).sort({ createdAt: -1 });

//   res.json({
//     ok: true,
//     subscription: subscription ? {
//       id: subscription.razorpaySubscriptionId,
//       planName: subscription.planName,
//       status: subscription.status,
//       currentEnd: subscription.currentEnd,
//       amount: subscription.amount / 100,
//       currency: subscription.currency
//     } : null,
//     user: {
//       isPro: user.isPro,
//       isMaxPro: user.isMaxPro,
//       subscriptionStatus: user.subscriptionStatus,
//       subscriptionExpiry: user.subscriptionExpiry
//     }
//   });
// }));

// // Cancel subscription
// router.post('/cancel', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
//   const user = req.user!;

//   try {
//     const subscription = await Subscription.findOne({
//       userId: user._id,
//       status: 'active'
//     });

//     if (!subscription) {
//       return res.status(404).json({
//         ok: false,
//         error: {
//           code: 'NO_ACTIVE_SUBSCRIPTION',
//           message: 'No active subscription found'
//         }
//       });
//     }

//     // Cancel subscription in Razorpay
//     await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
//       cancel_at_cycle_end: 1 // Cancel at the end of current billing cycle
//     });

//     // Update subscription status
//     subscription.status = 'cancelled';
//     await subscription.save();

//     // Update user status
//     user.subscriptionStatus = 'cancelled';
//     await user.save();

//     res.json({
//       ok: true,
//       message: 'Subscription cancelled successfully. Access will continue until the end of current billing cycle.'
//     });

//   } catch (error) {
//     logger.error('Subscription cancellation error:', error);
//     res.status(500).json({
//       ok: false,
//       error: {
//         code: 'CANCELLATION_FAILED',
//         message: 'Failed to cancel subscription'
//       }
//     });
//   }
// }));

// export default router;