import crypto from 'crypto';
import { ScheduledContent, IScheduledContent } from '../models/ScheduledContent.js';
import pino from 'pino';

const logger = pino();

interface CreateScheduledContentData {
  type: 'text' | 'file';
  content: string;
  title?: string;
  unlockAt: Date;
  createdIp: string;
}

interface CreateScheduledContentResult {
  code: string;
  type: 'text' | 'file';
  unlockAt: string;
  expiresAt: string;
  title?: string;
}

interface RetrieveScheduledContentResult {
  content: string;
  type: 'text' | 'file';
  title?: string;
  locked?: boolean;
  unlockAt?: string;
}

// Generate unique 6-digit code
const generateUniqueCode = async (): Promise<string> => {
  const maxRetries = 10;
  
  for (let i = 0; i < maxRetries; i++) {
    const code = Math.floor(Math.random() * 900000 + 100000).toString();
    const existing = await ScheduledContent.findOne({ code });
    if (!existing) {
      return code;
    }
  }
  
  throw new Error('Unable to generate unique code after maximum retries');
};

// Create scheduled content
export const createScheduledContent = async (data: CreateScheduledContentData): Promise<CreateScheduledContentResult> => {
  try {
    const code = await generateUniqueCode();
    
    // Content expires 7 days after unlock time
    const expiresAt = new Date(data.unlockAt.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const scheduledContent = new ScheduledContent({
      code,
      type: data.type,
      content: data.content,
      title: data.title,
      unlockAt: data.unlockAt,
      expiresAt,
      createdIp: data.createdIp
    });
    
    await scheduledContent.save();
    
    logger.info(`Scheduled content created: ${code} (unlocks: ${data.unlockAt.toISOString()})`);
    
    return {
      code,
      type: data.type,
      unlockAt: data.unlockAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      title: data.title
    };
  } catch (error) {
    logger.error('Error creating scheduled content:', error);
    throw error;
  }
};

// Retrieve scheduled content
export const retrieveScheduledContent = async (code: string): Promise<RetrieveScheduledContentResult | null> => {
  try {
    const scheduledContent = await ScheduledContent.findOne({ code });
    
    if (!scheduledContent) {
      logger.info(`Scheduled content not found: ${code}`);
      return null;
    }
    
    // Check if expired
    if (scheduledContent.expiresAt < new Date()) {
      logger.info(`Scheduled content expired: ${code}`);
      await ScheduledContent.deleteOne({ _id: scheduledContent._id });
      return null;
    }
    
    const now = new Date();
    
    // Check if still locked
    if (scheduledContent.unlockAt > now) {
      logger.info(`Scheduled content still locked: ${code}`);
      return {
        content: '',
        type: scheduledContent.type,
        locked: true,
        unlockAt: scheduledContent.unlockAt.toISOString()
      };
    }
    
    // Content is unlocked
    logger.info(`Scheduled content retrieved: ${code}`);
    
    return {
      content: scheduledContent.content,
      type: scheduledContent.type,
      title: scheduledContent.title
    };
  } catch (error) {
    logger.error('Error retrieving scheduled content:', error);
    throw error;
  }
};