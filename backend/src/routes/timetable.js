import { Router } from 'express';
import { getTimetable } from '../services/timetableService.js';

const router = Router();

// GET /api/timetable?courseCode=CN7000&dayOfWeek=Monday
router.get('/', async (req, res) => {
  try {
    const { courseCode, dayOfWeek } = req.query;
    const results = await getTimetable({ courseCode, dayOfWeek });
    res.json(results);
  } catch (err) {
    console.error('[GET /api/timetable] error:', err);
    res.status(500).json({ error: 'Failed to fetch timetable.' });
  }
});

export default router;
