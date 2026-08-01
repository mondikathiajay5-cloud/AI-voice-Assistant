import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { courses as mockCourses } from '../data/mockData.js';

/**
 * Search courses by free-text (matches code, title, or department).
 * Falls back to in-memory mock data if Supabase isn't configured, so the
 * project is runnable without any external setup during review/demo.
 */
export async function searchCourses(query) {
  const q = (query || '').toLowerCase().trim();

  if (isDatabaseConfigured) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .or(`title.ilike.%${q}%,code.ilike.%${q}%,department.ilike.%${q}%`);
    if (error) throw new Error(`courses query failed: ${error.message}`);
    return data;
  }

  if (!q) return mockCourses;
  return mockCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
  );
}

export async function getCourseByCode(code) {
  const results = await searchCourses(code);
  return results.find((c) => c.code.toLowerCase() === code.toLowerCase()) || null;
}
