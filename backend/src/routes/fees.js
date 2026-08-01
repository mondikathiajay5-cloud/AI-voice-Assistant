import { Router } from 'express';
import { getFeeSchedule } from '../services/feesService.js';

const router = Router();

// GET /api/fees?programme=Computer%20Science%20MSc&studentType=Home
router.get('/', async (req, res) => {
  try {
    const results = await getFeeSchedule({ programme: req.query.programme, studentType: req.query.studentType });
    res.json(results);
  } catch (err) {
    console.error('[GET /api/fees] error:', err);
    res.status(500).json({ error: 'Failed to fetch fee schedule.' });
  }
});

export default router;
