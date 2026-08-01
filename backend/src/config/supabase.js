import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

// We fail loudly rather than silently returning a broken client — a student
// service that logs conversations must not run with a misconfigured DB.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[config] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. ' +
    'The app will run using in-memory fallbacks (see services/*Service.js) ' +
    'so you can demo it without a live database, but nothing will persist.'
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

export const isDatabaseConfigured = Boolean(supabase);
