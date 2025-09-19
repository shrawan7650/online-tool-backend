import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import  { authMiddleware } from '../middleware/auth.js';
import { Note } from '../models/Note.js';
import pino from 'pino';

const router = Router();
const logger = pino();

// Validation schemas
const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  tags: z.array(z.string().max(50)).max(20).default([])
});

const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional()
});



// Get all notes for authenticated user
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 }).limit(1000);
    res.json({ ok: true, notes });
  })
);

// Create new note
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const validatedData = CreateNoteSchema.parse(req.body);

    const note = new Note({
      ...validatedData,
      userId
    });

    await note.save();

    logger.info(`Note created: ${note._id} for user: ${userId}`);

    res.status(201).json({
      ok: true,
      note
    });
  })
);

// Get single note
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      res.status(404).json({
        ok: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found'
        }
      });
      return;
    }

    res.json({
      ok: true,
      note
    });
  })
);

// Update note
router.put(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const noteId = req.params.id;
    const validatedData = UpdateNoteSchema.parse(req.body);

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { ...validatedData, updatedAt: new Date() },
      { new: true }
    );

    if (!note) {
      res.status(404).json({
        ok: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found'
        }
      });
      return;
    }

    logger.info(`Note updated: ${noteId} for user: ${userId}`);

    res.json({
      ok: true,
      note
    });
  })
);

// Delete note
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const noteId = req.params.id;

    const note = await Note.findOneAndDelete({ _id: noteId, userId });

    if (!note) {
      res.status(404).json({
        ok: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found'
        }
      });
      return;
    }

    logger.info(`Note deleted: ${noteId} for user: ${userId}`);

    res.json({
      ok: true,
      message: 'Note deleted successfully'
    });
  })
);

// Export all notes
router.get(
  '/export',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id;

    const notes = await Note.find({ userId }).sort({ createdAt: -1 });

    res.json({
      ok: true,
      notes,
      exportedAt: new Date().toISOString(),
      totalNotes: notes.length
    });
  })
);

// Bulk import notes
router.post(
  '/import',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!._id;
    const { notes } = z
      .object({
        notes: z.array(CreateNoteSchema)
      })
      .parse(req.body);

    if (notes.length > 100) {
      res.status(400).json({
        ok: false,
        error: {
          code: 'TOO_MANY_NOTES',
          message: 'Cannot import more than 100 notes at once'
        }
      });
      return;
    }

    const notesToCreate = notes.map(note => ({
      ...note,
      userId
    }));

    const createdNotes = await Note.insertMany(notesToCreate);

    logger.info(`Bulk import: ${createdNotes.length} notes for user: ${userId}`);

    res.status(201).json({
      ok: true,
      imported: createdNotes.length,
      notes: createdNotes
    });
  })
);

export default router;

// Example with subscriptionMiddleware
// router.get('/export',
//   authMiddleware,
//   subscriptionMiddleware,
//   asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
//     const userId = req.user!._id;
//     const notes = await Note.find({ userId }).sort({ createdAt: -1 });
//     res.json({
//       ok: true,
//       notes,
//       exportedAt: new Date().toISOString(),
//       totalNotes: notes.length
//     });
//   })
// );
