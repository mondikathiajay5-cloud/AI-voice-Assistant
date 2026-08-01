import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { timetableEntries } from '../data/mockData.js';

/**
 * Get timetable entries, optionally filtered by course code and/or day.
 */
export async function getTimetable({ courseCode, dayOfWeek } = {}) {
  if (isDatabaseConfigured) {
    let query = supabase
      .from('timetable_entries')
      .select('*, courses(code, title)');
    if (dayOfWeek) query = query.eq('day_of_week', dayOfWeek);
    const { data, error } = await query;
    if (error) throw new Error(`timetable query failed: ${error.message}`);
    return courseCode
      ? data.filter((row) => row.courses?.code?.toLowerCase() === courseCode.toLowerCase())
      : data;
  }

  let results = timetableEntries;
  if (courseCode) {
    results = results.filter((e) => e.courseCode.toLowerCase() === courseCode.toLowerCase());
  }
  if (dayOfWeek) {
    results = results.filter((e) => e.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase());
  }
  return results;
}
