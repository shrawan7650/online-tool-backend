import crypto from 'crypto';
import { FileShare, IFileShare } from '../models/FileShare.js';
import pino from 'pino';

const logger = pino();

interface FileData {
  filename: string;
  url: string;
  publicId: string;
  size: number;
  type: string;
}

interface CreateFileShareData {
  files: FileData[];
  expiresIn: string;
  createdIp: string;
}

interface CreateFileShareResult {
  code: string;
  url: string;
  filename: string;
  size: number;
  expiresAt: string;
  previewUrl?: string;
}

interface RetrieveFileShareResult {
  filename: string;
  url: string;
  size: number;
  type: string;
  expiresAt: string;
  previewUrl?: string;
}

// Generate unique 6-digit code
const generateUniqueCode = async (): Promise<string> => {
  const maxRetries = 10;
  
  for (let i = 0; i < maxRetries; i++) {
    const code = Math.floor(Math.random() * 900000 + 100000).toString();
    const existing = await FileShare.findOne({ code });
    if (!existing) {
      return code;
    }
  }
  
  throw new Error('Unable to generate unique code after maximum retries');
};

// Convert expiry string to milliseconds
const parseExpiresIn = (expiresIn: string): number => {
  const units: { [key: string]: number } = {
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000
  };
  
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) {
    throw new Error('Invalid expiresIn format');
  }
  
  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
};

// Create file share
export const createFileShare = async (data: CreateFileShareData): Promise<CreateFileShareResult> => {
  try {
    const code = await generateUniqueCode();
    const ttl = parseExpiresIn(data.expiresIn);
    const expiresAt = new Date(Date.now() + ttl);
    
    // For now, handle single file (can be extended for multiple files)
    const primaryFile = data.files[0];
    
    const fileShare = new FileShare({
      code,
      filename: primaryFile.filename,
      url: primaryFile.url,
      publicId: primaryFile.publicId,
      size: primaryFile.size,
      type: primaryFile.type,
      expiresAt,
      autoDeleteOnRetrieve: data.expiresIn === '5m',
      createdIp: data.createdIp
    });
    
    await fileShare.save();
    
    logger.info(`File share created: ${code} (expires: ${expiresAt.toISOString()})`);
    
    return {
      code,
      url: primaryFile.url,
      filename: primaryFile.filename,
      size: primaryFile.size,
      expiresAt: expiresAt.toISOString(),
      previewUrl: primaryFile.type === 'image' ? primaryFile.url : undefined
    };
  } catch (error) {
    logger.error('Error creating file share:', error);
    throw error;
  }
};

// Retrieve file share
export const retrieveFileShare = async (code: string): Promise<RetrieveFileShareResult | null> => {
  try {
    const fileShare = await FileShare.findOne({ code });
    
    if (!fileShare) {
      logger.info(`File share not found: ${code}`);
      return null;
    }
    
    // Check if expired
    if (fileShare.expiresAt < new Date()) {
      logger.info(`File share expired: ${code}`);
      await FileShare.deleteOne({ _id: fileShare._id });
      return null;
    }
    
    const result: RetrieveFileShareResult = {
      filename: fileShare.filename,
      url: fileShare.url,
      size: fileShare.size,
      type: fileShare.type,
      expiresAt: fileShare.expiresAt.toISOString(),
      previewUrl: fileShare.type === 'image' ? fileShare.url : undefined
    };
    
    // Auto-delete if configured
    if (fileShare.autoDeleteOnRetrieve) {
      await FileShare.deleteOne({ _id: fileShare._id });
      logger.info(`File share auto-deleted after retrieval: ${code}`);
    }
    
    logger.info(`File share retrieved: ${code}`);
    return result;
  } catch (error) {
    logger.error('Error retrieving file share:', error);
    throw error;
  }
};