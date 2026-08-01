import { Router } from 'express';
import { createItSupportRequest } from '../services/itSupportService.js';

const router = Router();

// POST /api/it-support
// body: { category, description, studentId? }
router.post('/', async (req, res) => {
  const { category, description, studentId } = req.body;
  if (!category || !description) {
    return res.status(400).json({ error: 'category and description are required.' });
  }
  try {
    const result = await createItSupportRequest({ studentId, category, description });
    res.status(201).json(result);
  } catch (err) {
    console.error('[POST /api/it-support] error:', err);
    res.status(500).json({ error: 'Failed to create IT support request.' });
  }
});

export default router;
