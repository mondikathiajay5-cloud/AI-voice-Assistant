import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:freeY';
const OPENROUTER_URL = 'https://api.openrouter.ai/v1/chat/completions';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const usingOpenRouter = !genAI && Boolean(OPENROUTER_API_KEY);

export const INTENTS = [
  'course_info',
  'timetable_enquiry',
  'library_hours',
  'it_support',
  'room_booking',
  'fee_enquiry',
  'general_faq',
  'escalation_request',
  'chitchat',
];

const CLASSIFIER_SYSTEM_PROMPT = `You are an intent classifier for a university student services voice assistant.
Classify the student's message into exactly one of these intents:
${INTENTS.join(', ')}

Rules:
- "escalation_request" = student explicitly asks for a human/advisor, or expresses frustration/distress, or the topic is sensitive (mental health, complaints, financial hardship, harassment).
- If genuinely ambiguous between two intents, pick the more specific one.
- Extract any useful entities you can find (course_code, day_of_week, room_name, date, student_type, category).

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"intent": "<one of the intents above>", "confidence": <number 0 to 1>, "entities": {"course_code": null, "day_of_week": null, "room_name": null, "date": null, "student_type": null, "category": null}}`;

/**
 * Classify a student message into an intent + confidence + entities.
 * Falls back to a simple keyword classifier if no AI key is configured,
 * so the project remains runnable/demoable without an API key.
 */
export async function classifyIntent(message) {
  if (!genAI && !usingOpenRouter) return keywordFallbackClassifier(message);

  try {
    const responseText = await runLLM([
      { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
      { role: 'user', content: `Student message: "${message}"` },
    ]);

    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!INTENTS.includes(parsed.intent)) {
      return { intent: 'chitchat', confidence: 0.3, entities: {} };
    }
    return parsed;
  } catch (err) {
    console.error('[geminiService] classifyIntent failed, using fallback:', err.message);
    return keywordFallbackClassifier(message);
  }
}

/**
 * Turn structured domain data into a natural-language reply. The LLM only
 * paraphrases — it is given the real data and told not to invent facts.
 */
export async function generateReply({ intent, userMessage, data }) {
  if (!genAI && !usingOpenRouter) return templateFallbackReply(intent, data);

  try {
    const prompt = `You are HelloBack, a warm and concise university student services voice assistant.
The student asked: "${userMessage}"
Detected intent: ${intent}
Here is the ONLY factual data you may use to answer (do not invent anything beyond this):
${JSON.stringify(data, null, 2)}

Write a short, natural spoken-style reply (1-3 sentences, no markdown, no lists — this will be read aloud by text-to-speech). If the data is empty or null, say you couldn't find that information and offer to escalate to an advisor.`;

    const responseText = await runLLM([{ role: 'user', content: prompt }]);
    return responseText.trim();
  } catch (err) {
    console.error('[geminiService] generateReply failed, using fallback:', err.message);
    return templateFallbackReply(intent, data);
  }
}

async function runLLM(messages) {
  if (genAI) {
    return runGemini(messages);
  }

  if (usingOpenRouter) {
    return runOpenRouter(messages);
  }

  throw new Error('No AI provider configured.');
}

async function runGemini(messages) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const payload = messages.map((msg) => ({ text: msg.content ?? msg.text }));
  const result = await model.generateContent(payload);
  return result.response.text().trim();
}

async function runOpenRouter(messages) {
  const body = {
    model: OPENROUTER_MODEL,
    messages: messages.map((msg) => ({ role: msg.role || 'user', content: msg.content ?? msg.text })),
    temperature: 0.2,
    max_new_tokens: 1024,
  };

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || JSON.stringify(data));
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenRouter response missing generated text.');
  }
  return text;
}

// ---------------------------------------------------------------------------
// Fallbacks: keep the app functional with zero external API keys, useful for
// local demos and for grading without needing to distribute a Gemini key.
// ---------------------------------------------------------------------------

function keywordFallbackClassifier(message) {
  const m = message.toLowerCase();
  const rules = [
    { intent: 'escalation_request', words: ['human', 'advisor', 'person', 'agent', 'frustrated', 'angry', 'complaint'] },
    { intent: 'timetable_enquiry', words: ['timetable', 'schedule', 'when is', 'class time'] },
    { intent: 'library_hours', words: ['library', 'opening hours', 'open until'] },
    { intent: 'it_support', words: ['wifi', 'password', 'vpn', 'login', 'laptop', 'it support'] },
    { intent: 'room_booking', words: ['book a room', 'room booking', 'study room', 'reserve a room'] },
    { intent: 'fee_enquiry', words: ['fee', 'tuition', 'payment plan', 'cost of'] },
    { intent: 'course_info', words: ['course', 'module', 'programme', 'degree'] },
    { intent: 'general_faq', words: ['id card', 'extension', 'deadline'] },
  ];
  for (const rule of rules) {
    if (rule.words.some((w) => m.includes(w))) {
      return { intent: rule.intent, confidence: 0.6, entities: {} };
    }
  }
  return { intent: 'chitchat', confidence: 0.4, entities: {} };
}

function templateFallbackReply(intent, data) {
  const empty = !data || (Array.isArray(data) && data.length === 0);
  if (empty) {
    return "I couldn't find anything matching that. Would you like me to connect you with an advisor instead?";
  }
  switch (intent) {
    case 'course_info':
      return `Here's what I found: ${data.map((c) => `${c.code || c.title} - ${c.title}`).join('; ')}.`;
    case 'timetable_enquiry':
      return `Here are the sessions I found: ${JSON.stringify(data)}.`;
    case 'library_hours':
      return data.is24Hours
        ? 'The library is open 24 hours on that day.'
        : `The library is open from ${data.opensAt || data.opens_at} to ${data.closesAt || data.closes_at} that day.`;
    case 'fee_enquiry':
      return `The annual fee is £${data[0]?.annualFeeGbp ?? data[0]?.annual_fee_gbp}. ${data[0]?.paymentPlanInfo || ''}`;
    default:
      return 'Here is what I found based on your request.';
  }
}
