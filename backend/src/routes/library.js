import { Router } from 'express';
import { getLibraryHours } from '../services/libraryService.js';

const router = Router();

// GET /api/library?day=Monday
router.get('/', async (req, res) => {
  try {
    const hours = await getLibraryHours(req.query.day);
    res.json(hours);
  } catch (err) {
    console.error('[GET /api/library] error:', err);
    res.status(500).json({ error: 'Failed to fetch library hours.' });
  }
});

export default router;
