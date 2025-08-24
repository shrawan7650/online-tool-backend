import { config } from 'dotenv';
import mongoose from 'mongoose';
import { createClipboardNote } from '../services/clipboardService.js';

config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create sample clipboard notes
    const sampleNotes = [
      {
        text: 'Hello, this is a sample clipboard note for testing!',
        expiresIn: '1h',
        createdIp: '127.0.0.1'
      },
      {
        text: 'This is a PIN-protected note. PIN is 1234.',
        pin: '1234',
        expiresIn: '24h',
        createdIp: '127.0.0.1'
      },
      {
        text: 'console.log("Sample code snippet for developers");',
        expiresIn: '7d',
        createdIp: '127.0.0.1'
      }
    ];
    
    console.log('Creating sample clipboard notes...');
    
    for (const noteData of sampleNotes) {
      const result = await createClipboardNote(noteData);
      console.log(`Created note with code: ${result.code}`);
      if (noteData.pin) {
        console.log(`  PIN: ${noteData.pin}`);
      }
    }
    
    console.log('Seed data created successfully!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedData();