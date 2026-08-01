import { Router } from 'express';
import { handleStudentMessage } from '../services/intentRouter.js';

const router = Router();

// POST /api/chat
// body: { message: string, conversationId?: string, studentId?: string, channel?: 'voice'|'chat' }
router.post('/', async (req, res) => {
  const { message, conversationId, studentId, channel } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const result = await handleStudentMessage({ message, conversationId, studentId, channel });
    res.json(result);
  } catch (err) {
    console.error('[POST /api/chat] error:', err);
    res.status(500).json({ error: 'Something went wrong processing your message.' });
  }
});

export default router;
