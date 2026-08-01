import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { faqs } from '../data/mockData.js';

/**
 * Lightweight keyword search over FAQs. This is intentionally simple
 * (no vector search) — good enough for a small, curated FAQ set, and cheap
 * to run for every general enquiry before falling back to the LLM's own
 * general knowledge or escalation.
 */
export async function searchFaqs(query) {
  const q = (query || '').toLowerCase();

  if (isDatabaseConfigured) {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .or(`question.ilike.%${q}%,answer.ilike.%${q}%`);
    if (error) throw new Error(`faqs query failed: ${error.message}`);
    return data;
  }

  return faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(q) ||
      f.keywords.some((k) => q.includes(k))
  );
}
