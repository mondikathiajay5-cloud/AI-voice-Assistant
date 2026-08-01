import { Router } from 'express';
import { searchFaqs } from '../services/faqService.js';

const router = Router();

// GET /api/faq?query=password
router.get('/', async (req, res) => {
  try {
    res.json(await searchFaqs(req.query.query));
  } catch (err) {
    console.error('[GET /api/faq] error:', err);
    res.status(500).json({ error: 'Failed to search FAQs.' });
  }
});

export default router;
