import { Router } from 'express';
import { searchCourses } from '../services/coursesService.js';

const router = Router();

// GET /api/courses?query=cloud
router.get('/', async (req, res) => {
  try {
    const results = await searchCourses(req.query.query);
    res.json(results);
  } catch (err) {
    console.error('[GET /api/courses] error:', err);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

export default router;
