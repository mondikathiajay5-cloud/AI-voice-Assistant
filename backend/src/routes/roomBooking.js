import { Router } from 'express';
import { listRooms, bookRoom } from '../services/roomBookingService.js';

const router = Router();

// GET /api/rooms
router.get('/', async (_req, res) => {
  try {
    res.json(await listRooms());
  } catch (err) {
    console.error('[GET /api/rooms] error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms.' });
  }
});

// POST /api/rooms/book
// body: { roomName, date, startTime, endTime, studentId? }
router.post('/book', async (req, res) => {
  const { roomName, date, startTime, endTime, studentId } = req.body;
  if (!roomName || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'roomName, date, startTime, and endTime are required.' });
  }
  try {
    const result = await bookRoom({ roomName, date, startTime, endTime, studentId });
    res.status(result.success ? 201 : 409).json(result);
  } catch (err) {
    console.error('[POST /api/rooms/book] error:', err);
    res.status(500).json({ error: 'Failed to book room.' });
  }
});

export default router;
