import { v4 as uuidv4 } from 'uuid';
import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { itSupportRequests } from '../data/mockData.js';

const SELF_SERVICE_CATEGORIES = {
  password_reset: 'You can reset your password yourself at the IT Self-Service Portal using your student number and registered personal email — no ticket needed.',
  wifi: 'Try forgetting and reconnecting to "eduroam" using your full student email as the username. If that fails, I can log a ticket for you.',
};

/**
 * Create an IT support request. If the category has a known self-service
 * fix, we return that instead of creating a ticket — reduces unnecessary
 * escalations for common issues.
 */
export async function createItSupportRequest({ studentId, category, description }) {
  if (SELF_SERVICE_CATEGORIES[category]) {
    return { ticketCreated: false, selfServiceAdvice: SELF_SERVICE_CATEGORIES[category] };
  }

  if (isDatabaseConfigured) {
    const { data, error } = await supabase
      .from('it_support_requests')
      .insert({ student_id: studentId, category, description })
      .select()
      .single();
    if (error) throw new Error(`it_support_requests insert failed: ${error.message}`);
    return { ticketCreated: true, ticket: data };
  }

  const ticket = {
    id: uuidv4(),
    studentId: studentId || null,
    category,
    description,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  itSupportRequests.push(ticket);
  return { ticketCreated: true, ticket };
}
