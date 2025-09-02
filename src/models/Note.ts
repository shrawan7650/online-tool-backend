import { Schema, model, Document } from 'mongoose';

export interface INote extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000
  },
  tags: [{
    type: String,
    maxlength: 50,
    trim: true
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
NoteSchema.index({ userId: 1, updatedAt: -1 });
NoteSchema.index({ userId: 1, tags: 1 });
NoteSchema.index({ userId: 1, title: 'text', content: 'text' });

export const Note = model<INote>('Note', NoteSchema);