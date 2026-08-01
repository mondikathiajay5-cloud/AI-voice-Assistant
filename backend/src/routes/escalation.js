import { Router } from 'express';
import { listOpenEscalations } from '../services/escalationService.js';
import { getConversationHistory } from '../services/conversationService.js';

const router = Router();

// GET /api/escalations — for an advisor dashboard to see the open queue
router.get('/', async (_req, res) => {
  try {
    res.json(await listOpenEscalations());
  } catch (err) {
    console.error('[GET /api/escalations] error:', err);
    res.status(500).json({ error: 'Failed to fetch escalations.' });
  }
});

// GET /api/escalations/:conversationId/history — full transcript for an advisor
router.get('/:conversationId/history', async (req, res) => {
  try {
    res.json(await getConversationHistory(req.params.conversationId));
  } catch (err) {
    console.error('[GET /api/escalations/:id/history] error:', err);
    res.status(500).json({ error: 'Failed to fetch conversation history.' });
  }
});

export default router;
