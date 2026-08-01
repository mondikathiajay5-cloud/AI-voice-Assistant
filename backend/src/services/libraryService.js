import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { libraryHours } from '../data/mockData.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Get library opening hours for a specific day (defaults to today). */
export async function getLibraryHours(dayOfWeek) {
  const day = dayOfWeek || DAYS[new Date().getDay()];

  if (isDatabaseConfigured) {
    const { data, error } = await supabase
      .from('library_hours')
      .select('*')
      .eq('day_of_week', day);
    if (error) throw new Error(`library_hours query failed: ${error.message}`);
    return data[0] || null;
  }

  return libraryHours.find((h) => h.dayOfWeek === day) || null;
}
