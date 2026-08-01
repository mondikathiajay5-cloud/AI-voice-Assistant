import { v4 as uuidv4 } from 'uuid';
import { supabase, isDatabaseConfigured } from '../config/supabase.js';
import { conversations } from '../data/mockData.js';

/** Start a new conversation, or return the existing one if id is passed. */
export async function getOrCreateConversation({ conversationId, studentId, channel = 'chat' }) {
  if (conversationId) {
    if (isDatabaseConfigured) {
      const { data } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
      if (data) return data;
    } else if (conversations.has(conversationId)) {
      return conversations.get(conversationId);
    }
  }

  const id = conversationId || uuidv4();
  const convo = { id, studentId: studentId || null, channel, status: 'active', startedAt: new Date().toISOString(), messages: [] };

  if (isDatabaseConfigured) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ id, student_id: studentId, channel, status: 'active' })
      .select()
      .single();
    if (error) throw new Error(`conversations insert failed: ${error.message}`);
    return data;
  }

  conversations.set(id, convo);
  return convo;
}

/** Log a single turn (student, assistant, or advisor message). */
export async function logMessage({ conversationId, sender, content, intent = null, confidence = null }) {
  if (isDatabaseConfigured) {
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender,
      content,
      intent,
      confidence,
    });
    if (error) throw new Error(`messages insert failed: ${error.message}`);
    return;
  }

  const convo = conversations.get(conversationId);
  if (convo) {
    convo.messages.push({ sender, content, intent, confidence, createdAt: new Date().toISOString() });
  }
}

export async function getConversationHistory(conversationId) {
  if (isDatabaseConfigured) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`messages query failed: ${error.message}`);
    return data;
  }
  return conversations.get(conversationId)?.messages || [];
}

export async function markConversationEscalated(conversationId) {
  if (isDatabaseConfigured) {
    await supabase.from('conversations').update({ status: 'escalated' }).eq('id', conversationId);
    return;
  }
  const convo = conversations.get(conversationId);
  if (convo) convo.status = 'escalated';
}
