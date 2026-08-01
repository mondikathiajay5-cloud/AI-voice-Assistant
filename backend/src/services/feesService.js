import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { feeSchedules } from '../data/mockData.js';

export async function getFeeSchedule({ programme, studentType }) {
  const p = (programme || '').toLowerCase();
  const st = (studentType || '').toLowerCase();

  if (isDatabaseConfigured) {
    let query = supabase.from('fee_schedules').select('*').ilike('programme', `%${p}%`);
    if (st) query = query.ilike('student_type', st);
    const { data, error } = await query;
    if (error) throw new Error(`fee_schedules query failed: ${error.message}`);
    return data;
  }

  return feeSchedules.filter(
    (f) =>
      f.programme.toLowerCase().includes(p) &&
      (!st || f.studentType.toLowerCase() === st)
  );
}
