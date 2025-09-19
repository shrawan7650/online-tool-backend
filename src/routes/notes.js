import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authMiddleware } from '../middleware/auth.js';
import { Note } from '../models/Note.js';
import pino from 'pino';

const router = Router();
const logger = pino();

// Create new note
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { title, content, tags = [] } = req.body;

    if (!title || typeof title !== 'string' || title.length > 200) {
      return res.status(400).json({ ok: false, error: { message: 'Invalid title' } });
    }
    if (content && typeof content !== 'string') {
      return res.status(400).json({ ok: false, error: { message: 'Invalid content' } });
    }

    const note = new Note({
      title,
      content,
      tags,
      userId
    });

    await note.save();

    logger.info(`Note created: ${note._id} for user: ${userId}`);

    res.status(201).json({ ok: true, note });
  })
);

// Get all notes
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 }).limit(1000);
    res.json({ ok: true, notes });
  })
);

// Get single note
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOTE_NOT_FOUND', message: 'Note not found' }
      });
    }

    res.json({ ok: true, note });
  })
);

// Update note
router.put(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const noteId = req.params.id;
    const { title, content, tags } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (tags) updateData.tags = tags;
    updateData.updatedAt = new Date();

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      updateData,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOTE_NOT_FOUND', message: 'Note not found' }
      });
    }

    logger.info(`Note updated: ${noteId} for user: ${userId}`);
    res.json({ ok: true, note });
  })
);

// Delete note
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const noteId = req.params.id;

    const note = await Note.findOneAndDelete({ _id: noteId, userId });

    if (!note) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOTE_NOT_FOUND', message: 'Note not found' }
      });
    }

    logger.info(`Note deleted: ${noteId} for user: ${userId}`);
    res.json({ ok: true, message: 'Note deleted successfully' });
  })
);

// Export notes
router.get(
  '/export',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
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
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { notes } = req.body;

    if (!Array.isArray(notes)) {
      return res.status(400).json({ ok: false, error: { message: 'Notes array is required' } });
    }

    if (notes.length > 100) {
      return res.status(400).json({
        ok: false,
        error: { code: 'TOO_MANY_NOTES', message: 'Cannot import more than 100 notes at once' }
      });
    }

    const notesToCreate = notes.map(note => ({ ...note, userId }));
    const createdNotes = await Note.insertMany(notesToCreate);

    logger.info(`Bulk import: ${createdNotes.length} notes for user: ${userId}`);

    res.status(201).json({ ok: true, imported: createdNotes.length, notes: createdNotes });
  })
);

export default router;
