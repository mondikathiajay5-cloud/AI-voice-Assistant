import type { ChatMessage } from '../types';

const INTENT_LABELS: Record<string, string> = {
  course_info: 'Course info',
  timetable_enquiry: 'Timetable',
  library_hours: 'Library hours',
  it_support: 'IT support',
  room_booking: 'Room booking',
  fee_enquiry: 'Tuition fees',
  general_faq: 'FAQ',
  escalation_request: 'Escalated',
  chitchat: 'General',
};

function parseStructuredData(content: string) {
  const match = content.match(/([\s\S]*?)(\[[\s\S]*\]|\{[\s\S]*\})$/);
  if (!match) return null;

  try {
    return {
      summary: match[1].trim().replace(/[:\s]*$/, ''),
      data: JSON.parse(match[2]),
    };
  } catch {
    return null;
  }
}

function renderStructuredData(data: unknown) {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const headers = Object.keys(data[0] as Record<string, unknown>);
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-campus-slate/15 bg-campus-mist text-sm shadow-sm">
        <div className="grid grid-cols-[1fr_1fr] gap-0 border-b border-campus-slate/15 bg-campus-blue/5 px-4 py-3 text-xs uppercase tracking-[0.12em] text-campus-slate">
          {headers.map((header) => (
            <span key={header}>{header.replace(/([A-Z])/g, ' $1').trim()}</span>
          ))}
        </div>
        <div className="divide-y divide-campus-slate/15 bg-white">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[1fr_1fr] gap-0 px-4 py-3 text-xs text-campus-navy">
              {headers.map((header) => (
                <div key={header} className="py-1 pr-4">
                  <span className="font-semibold text-campus-slate/80">{String(header)}:</span>{' '}
                  <span>{String((row as Record<string, unknown>)[header] ?? '')}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <ul className="mt-3 space-y-2 rounded-2xl border border-campus-slate/15 bg-campus-mist p-4 text-sm text-campus-navy shadow-sm">
        {data.map((item, index) => (
          <li key={index} className="list-disc pl-4 text-sm">
            {String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === 'object' && data !== null) {
    return (
      <div className="mt-3 space-y-2 rounded-2xl border border-campus-slate/15 bg-campus-mist p-4 text-sm shadow-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4 text-xs text-campus-navy">
            <span className="font-semibold text-campus-slate/80">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-right">{String(value ?? '-')}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function Message({ message }: { message: ChatMessage }) {
  const isStudent = message.sender === 'student';
  const structured = parseStructuredData(message.content);
  const displayText = structured?.summary ?? message.content;

  return (
    <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm transition-all duration-200 ${
          isStudent
            ? 'bg-campus-navy text-white rounded-br-[8px] rounded-tl-[24px] rounded-tr-[24px]'
            : 'bg-white text-campus-navy border border-campus-slate/15 rounded-bl-[8px] rounded-tr-[24px] rounded-tl-[24px]'
        }`}
      >
        <p className="whitespace-pre-wrap">{displayText}</p>
        {structured?.data && renderStructuredData(structured.data)}
        {!isStudent && message.intent && message.intent !== 'chitchat' && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-campus-slate/70">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                message.escalated ? 'bg-assistant-listening' : 'bg-assistant-speaking'
              }`}
            />
            {message.escalated ? 'Escalated to advisor' : INTENT_LABELS[message.intent] || message.intent}
            {typeof message.confidence === 'number' && (
              <span className="text-campus-slate/50">· {(message.confidence * 100).toFixed(0)}% confidence</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
