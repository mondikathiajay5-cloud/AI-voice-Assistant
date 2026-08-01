import { v4 as uuidv4 } from 'uuid';
import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { escalations } from '../data/mockData.js';
import { markConversationEscalated } from './conversationService.js';

/**
 * Reasons an escalation can be triggered — kept as an enum so the frontend
 * and any analytics dashboard can rely on stable values.
 */
export const ESCALATION_REASONS = {
  LOW_CONFIDENCE: 'low_confidence',
  EXPLICIT_REQUEST: 'explicit_request',
  SENSITIVE_TOPIC: 'sensitive_topic',
  REPEATED_FAILURE: 'repeated_failure',
};

const PRIORITY_BY_REASON = {
  [ESCALATION_REASONS.SENSITIVE_TOPIC]: 'urgent',
  [ESCALATION_REASONS.EXPLICIT_REQUEST]: 'normal',
  [ESCALATION_REASONS.LOW_CONFIDENCE]: 'normal',
  [ESCALATION_REASONS.REPEATED_FAILURE]: 'high',
};

export async function createEscalation({ conversationId, reason }) {
  const priority = PRIORITY_BY_REASON[reason] || 'normal';
  await markConversationEscalated(conversationId);

  if (isDatabaseConfigured) {
    const { data, error } = await supabase
      .from('escalations')
      .insert({ conversation_id: conversationId, reason, priority, status: 'open' })
      .select()
      .single();
    if (error) throw new Error(`escalations insert failed: ${error.message}`);
    return data;
  }

  const escalation = {
    id: uuidv4(),
    conversationId,
    reason,
    priority,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  escalations.push(escalation);
  return escalation;
}

export async function listOpenEscalations() {
  if (isDatabaseConfigured) {
    const { data, error } = await supabase.from('escalations').select('*').eq('status', 'open');
    if (error) throw new Error(`escalations query failed: ${error.message}`);
    return data;
  }
  return escalations.filter((e) => e.status === 'open');
}
