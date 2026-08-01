import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import chatRoutes from './routes/chat.js';
import courseRoutes from './routes/courses.js';
import timetableRoutes from './routes/timetable.js';
import libraryRoutes from './routes/library.js';
import roomBookingRoutes from './routes/roomBooking.js';
import feesRoutes from './routes/fees.js';
import itSupportRoutes from './routes/itSupport.js';
import faqRoutes from './routes/faq.js';
import escalationRoutes from './routes/escalation.js';
import { isDatabaseConfigured } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY);
  res.json({
    status: 'ok',
    databaseConfigured: isDatabaseConfigured,
    aiConfigured,
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/rooms', roomBookingRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/it-support', itSupportRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/escalations', escalationRoutes);

// Fallback 404 handler for unmatched API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`HelloBack backend listening on http://localhost:${PORT}`);
  if (!isDatabaseConfigured) {
    console.log('Running with in-memory data store (no Supabase configured).');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.log('Running with keyword-based fallback classifier (no GEMINI_API_KEY configured).');
  }
});
