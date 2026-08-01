import dotenv from 'dotenv';
import { classifyIntent, generateReply } from './geminiService.js';
import { searchCourses } from './coursesService.js';
import { getTimetable } from './timetableService.js';
import { getLibraryHours } from './libraryService.js';
import { createItSupportRequest } from './itSupportService.js';
import { bookRoom } from './roomBookingService.js';
import { getFeeSchedule } from './feesService.js';
import { searchFaqs } from './faqService.js';
import { createEscalation, ESCALATION_REASONS } from './escalationService.js';
import { getOrCreateConversation, logMessage, getConversationHistory } from './conversationService.js';

dotenv.config();
const CONFIDENCE_THRESHOLD = Number(process.env.ESCALATION_CONFIDENCE_THRESHOLD || 0.55);
const REPEATED_FAILURE_LIMIT = 2; // consecutive low-confidence turns before forced escalation

/**
 * Main entry point: given a raw student message, returns the assistant's
 * reply plus routing metadata (intent, confidence, escalated?).
 *
 * Escalation triggers (any one is sufficient):
 *  1. Classifier itself returns intent = 'escalation_request'
 *  2. Classifier confidence is below CONFIDENCE_THRESHOLD
 *  3. This is the Nth consecutive low-confidence turn in the conversation
 */
export async function handleStudentMessage({ message, conversationId, studentId, channel = 'chat' }) {
  const conversation = await getOrCreateConversation({ conversationId, studentId, channel });
  await logMessage({ conversationId: conversation.id, sender: 'student', content: message });

  const { intent, confidence, entities } = await classifyIntent(message);

  const recentHistory = await getConversationHistory(conversation.id);
  const recentLowConfidenceStreak = countTrailingLowConfidence(recentHistory, CONFIDENCE_THRESHOLD);

  const mustEscalate =
    intent === 'escalation_request' ||
    confidence < CONFIDENCE_THRESHOLD ||
    recentLowConfidenceStreak >= REPEATED_FAILURE_LIMIT;

  if (mustEscalate) {
    const reason =
      intent === 'escalation_request'
        ? ESCALATION_REASONS.EXPLICIT_REQUEST
        : recentLowConfidenceStreak >= REPEATED_FAILURE_LIMIT
        ? ESCALATION_REASONS.REPEATED_FAILURE
        : ESCALATION_REASONS.LOW_CONFIDENCE;

    const escalation = await createEscalation({ conversationId: conversation.id, reason });
    const reply =
      "I'm connecting you with a human advisor who can help with this — they'll be with you shortly. " +
      "In the meantime, is there anything else I can note for them?";

    await logMessage({ conversationId: conversation.id, sender: 'assistant', content: reply, intent, confidence });

    return { conversationId: conversation.id, reply, intent, confidence, escalated: true, escalation };
  }

  const data = await fetchDataForIntent(intent, entities, message);
  const reply = await generateReply({ intent, userMessage: message, data });

  await logMessage({ conversationId: conversation.id, sender: 'assistant', content: reply, intent, confidence });

  return { conversationId: conversation.id, reply, intent, confidence, escalated: false, data };
}

/** Dispatch to the correct domain service based on classified intent. */
async function fetchDataForIntent(intent, entities, message) {
  switch (intent) {
    case 'course_info':
      return searchCourses(entities.course_code || message);
    case 'timetable_enquiry':
      return getTimetable({ courseCode: entities.course_code, dayOfWeek: entities.day_of_week });
    case 'library_hours':
      return getLibraryHours(entities.day_of_week);
    case 'it_support':
      return createItSupportRequest({
        category: entities.category || 'general',
        description: message,
      });
    case 'room_booking':
      return bookRoom({
        roomName: entities.room_name || 'Study Room 3B',
        date: entities.date || new Date().toISOString().slice(0, 10),
        startTime: '10:00',
        endTime: '11:00',
      });
    case 'fee_enquiry':
      return getFeeSchedule({ programme: message, studentType: entities.student_type });
    case 'general_faq':
      return searchFaqs(message);
    default:
      return null;
  }
}

function countTrailingLowConfidence(history, threshold) {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const msg = history[i];
    if (msg.sender !== 'assistant') continue;
    if (msg.confidence != null && msg.confidence < threshold) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
