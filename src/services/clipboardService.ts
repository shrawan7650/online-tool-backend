import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ClipboardNote, IClipboardNote } from '../models/ClipboardNote.js';
import pino from 'pino';

const logger = pino();

interface CreateClipboardData {
  text: string;
  pin?: string;
  expiresIn: string;
  createdIp: string;
}

interface CreateClipboardResult {
  code: string;
  ttl: number;
  expiresAt: string;
}

interface RetrieveClipboardResult {
  text: string;
  remainingReads: number;
  expiresAt: string;
}

// Get encryption key from environment
const getEncryptionKey = (): Buffer => {
  const secret = process.env.CLIPBOARD_SECRET;
  if (!secret) {
    throw new Error('CLIPBOARD_SECRET environment variable is required');
  }
  
  // If it's a hex string, convert to buffer, otherwise use as-is and hash
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  
  // Hash the secret to get a 32-byte key
  return crypto.createHash('sha256').update(secret).digest();
};

// Generate unique 6-digit code
const generateUniqueCode = async (): Promise<string> => {
  const maxRetries = 10;
  
  for (let i = 0; i < maxRetries; i++) {
    // Generate random 6-digit number (100000-999999)
    const code = Math.floor(Math.random() * 900000 + 100000).toString();
    
    // Check if code already exists
    const existing = await ClipboardNote.findOne({ code });
    if (!existing) {
      return code;
    }
  }
  
  throw new Error('Unable to generate unique code after maximum retries');
};

// Encrypt text using AES-256-GCM
const encryptText = (text: string): { textEnc: Buffer; iv: Buffer; authTag: Buffer } => {
  const key = getEncryptionKey(); // must be 32 bytes for aes-256-gcm
  const iv = crypto.randomBytes(16); // 16-byte IV required for GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('clipboard-data'));

  let textEnc = cipher.update(text, 'utf8');
  textEnc = Buffer.concat([textEnc, cipher.final()]);
  const authTag = cipher.getAuthTag();

  return { textEnc, iv, authTag };
};

// Decrypt text using AES-256-GCM
const decryptText = (textEnc: Buffer, iv: Buffer, authTag: Buffer): string => {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from('clipboard-data'));
  decipher.setAuthTag(authTag);

  let text = decipher.update(textEnc, undefined, 'utf8');
  text += decipher.final('utf8');

  return text;
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

// Create clipboard note
export const createClipboardNote = async (data: CreateClipboardData): Promise<CreateClipboardResult> => {
  try {
    // Generate unique code
    const code = await generateUniqueCode();
    
    // Encrypt text
    const { textEnc, iv, authTag } = encryptText(data.text);
    
    // Hash PIN if provided
    let pinHash: string | undefined;
    if (data.pin) {
      const saltRounds = parseInt(process.env.PIN_ROUNDS || '10');
      pinHash = await bcrypt.hash(data.pin, saltRounds);
    }
    
    // Calculate expiry
    const ttl = parseExpiresIn(data.expiresIn);
    const expiresAt = new Date(Date.now() + ttl);
    
    // Create note
    const note = new ClipboardNote({
      code,
      textEnc,
      iv,
      authTag,
      pinHash,
      expiresAt,
      remainingReads: 3,
      createdIp: data.createdIp
    });
    
    await note.save();
    
    logger.info(`Clipboard note created: ${code} (expires: ${expiresAt.toISOString()})`);
    
    return {
      code,
      ttl,
      expiresAt: expiresAt.toISOString()
    };
    
  } catch (error) {
    logger.error('Error creating clipboard note:', error);
    throw error;
  }
};

// Retrieve clipboard note
export const retrieveClipboardNote = async (code: string, pin?: string): Promise<RetrieveClipboardResult | null> => {
  try {
    // Find note
    const note = await ClipboardNote.findOne({ code });
    
    if (!note) {
      logger.info(`Clipboard note not found: ${code}`);
      return null;
    }
    
    // Check if expired
    if (note.expiresAt < new Date()) {
      logger.info(`Clipboard note expired: ${code}`);
      await ClipboardNote.deleteOne({ _id: note._id });
      return null;
    }
    
    // Check remaining reads
    if (note.remainingReads <= 0) {
      logger.info(`Clipboard note exhausted: ${code}`);
      await ClipboardNote.deleteOne({ _id: note._id });
      return null;
    }
    
    // Verify PIN if required
    if (note.pinHash) {
      if (!pin) {
        logger.info(`PIN required but not provided: ${code}`);
        return null;
      }
      
      const pinValid = await bcrypt.compare(pin, note.pinHash);
      if (!pinValid) {
        logger.info(`Invalid PIN provided: ${code}`);
        return null;
      }
    }
    
    // Decrypt text
    const text = decryptText(note.textEnc, note.iv, note.authTag);
    
    // Update remaining reads atomically
    const updatedNote = await ClipboardNote.findOneAndUpdate(
      { _id: note._id },
      { $inc: { remainingReads: -1 } },
      { new: true }
    );
    
    if (!updatedNote) {
      throw new Error('Failed to update note');
    }
    
    // Delete if no reads remaining
    if (updatedNote.remainingReads <= 0) {
      await ClipboardNote.deleteOne({ _id: note._id });
      logger.info(`Clipboard note deleted (no reads remaining): ${code}`);
    }
    
    logger.info(`Clipboard note retrieved: ${code} (${updatedNote.remainingReads} reads remaining)`);
    
    return {
      text,
      remainingReads: updatedNote.remainingReads,
      expiresAt: note.expiresAt.toISOString()
    };
    
  } catch (error) {
    logger.error('Error retrieving clipboard note:', error);
    throw error;
  }
};

// Delete clipboard note
export const deleteClipboardNote = async (code: string): Promise<void> => {
  try {
    const result = await ClipboardNote.deleteOne({ code });
    
    if (result.deletedCount > 0) {
      logger.info(`Clipboard note deleted: ${code}`);
    } else {
      logger.info(`Clipboard note not found for deletion: ${code}`);
    }
    
  } catch (error) {
    logger.error('Error deleting clipboard note:', error);
    throw error;
  }
};