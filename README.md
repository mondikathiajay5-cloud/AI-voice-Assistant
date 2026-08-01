# HelloBack — AI Voice Assistant for UEL Student Services

Internship Assessment submission — University of East London.

A working scaffold of an AI voice assistant that answers common student
enquiries (courses, timetables, library hours, IT support, room booking,
tuition fees, FAQs) and escalates to a human advisor when it can't help,
logging every conversation turn along the way.

## Quick start (zero external accounts needed)

The app is designed to run **out of the box** with no API keys — it falls
back to an in-memory data store and a keyword-based intent classifier — so
a reviewer can clone and run it in minutes. Adding a free Gemini key or a
free OpenRouter key, plus an optional Supabase project, upgrades it to real
AI classification and persistence without touching the code.

```bash
# 1. Backend
cd backend
cp .env.example .env      # optional: fill in GEMINI_API_KEY or OPENROUTER_API_KEY, plus Supabase creds
npm install
npm run dev                # http://localhost:4000

# 2. Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

If using OpenRouter, set `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL`
(default: `meta-llama/llama-3.3-70b-instruct:freeY`).

Open http://localhost:5173, type or tap the mic and speak (Chrome/Edge
required for voice input — Web Speech API isn't implemented in Firefox).

## Why this architecture

**The LLM classifies and phrases; it never invents facts.** A university
assistant answering "what's my tuition fee" cannot be allowed to hallucinate
a number. So Gemini is used narrowly: (1) classify the student's intent and
extract entities, (2) paraphrase real data pulled from Postgres into a
natural spoken sentence. All factual data comes from the domain services
(`backend/src/services/*Service.js`), which query real tables. This also
means the fallback (no Gemini key) can use a keyword classifier and a
template-based reply generator with **zero loss of correctness** — only
naturalness of phrasing is reduced.

**Escalation is a first-class citizen, not an afterthought.** Every
classification returns a confidence score. `intentRouter.js` escalates when:
- the student explicitly asks for a human (`escalation_request` intent),
- confidence is below a configurable threshold (`.env`:
  `ESCALATION_CONFIDENCE_THRESHOLD`), or
- the last two assistant turns were both low-confidence (`REPEATED_FAILURE`)
  — this catches the case where the bot is "confidently wrong" turn after
  turn on a topic it keeps misreading, not just a single bad guess.

Sensitive topics (mental health, complaints, financial hardship) are
instructed to route to `escalation_request` directly in the classifier
prompt, so they skip straight to a human rather than getting a
best-effort automated answer.

**Conversation logging is structural, not bolted on.** Every turn — student
and assistant — is written via `conversationService.js` with its detected
intent and confidence attached. That serves three purposes: an audit trail
for advisors picking up an escalated case, data to evaluate classifier
accuracy over time, and the "repeated failure" escalation check above, which
reads directly from this log.

**The frontend holds no business logic.** `ChatWindow.tsx` sends text to
`/api/chat` and renders whatever the backend decides. Voice is *input/output
modality only* (Web Speech API for STT, SpeechSynthesis for TTS) — a voice
turn and a typed turn hit the exact same backend endpoint and are handled
identically, which keeps the assistant's behaviour consistent across
channels and avoids duplicating routing logic in the client.

**Every domain area is its own service**, so a reviewer (or a teammate)
can extend one function requirement (e.g. room booking) without touching
timetable or fee logic, and so each maps directly to a requirement in the
brief for easy grading.

## Project structure

```
helloback-voice-assistant/
├── database/
│   └── schema.sql              # Postgres/Supabase schema + seed data
├── backend/
│   └── src/
│       ├── server.js            # Express app entry point
│       ├── config/supabase.js   # DB client (falls back to in-memory if unset)
│       ├── data/mockData.js     # In-memory fallback data
│       ├── services/
│       │   ├── geminiService.js     # AI: intent classification + reply generation
│       │   ├── intentRouter.js      # Orchestration: classify → route → escalate → log
│       │   ├── conversationService.js  # Conversation logging
│       │   ├── escalationService.js    # Escalation to human advisor
│       │   ├── coursesService.js
│       │   ├── timetableService.js
│       │   ├── libraryService.js
│       │   ├── roomBookingService.js
│       │   ├── feesService.js
│       │   ├── itSupportService.js
│       │   └── faqService.js
│       └── routes/              # One REST route file per service above
└── frontend/
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── ChatWindow.tsx    # Conversation state + orchestration
        │   ├── VoiceControls.tsx # Mic button, TTS toggle
        │   ├── Message.tsx       # Message bubble w/ intent + confidence badge
        │   └── EscalationBanner.tsx
        ├── hooks/
        │   ├── useSpeechRecognition.ts  # STT wrapper (Web Speech API)
        │   └── useSpeechSynthesis.ts    # TTS wrapper (SpeechSynthesis API)
        └── services/api.ts       # Talks to the Express backend
```

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/chat` | Main conversational endpoint (used by frontend) |
| GET | `/api/courses?query=` | Search courses |
| GET | `/api/timetable?courseCode=&dayOfWeek=` | Timetable lookup |
| GET | `/api/library?day=` | Library opening hours |
| GET | `/api/rooms` | List bookable rooms |
| POST | `/api/rooms/book` | Book a room |
| GET | `/api/fees?programme=&studentType=` | Tuition fee lookup |
| POST | `/api/it-support` | Log an IT support request |
| GET | `/api/faq?query=` | Search FAQs |
| GET | `/api/escalations` | Open escalation queue (advisor dashboard) |
| GET | `/api/escalations/:conversationId/history` | Full transcript for an advisor |
| GET | `/api/health` | Reports whether DB/AI are configured |

## What's deliberately out of scope (and why)

This is a **foundation**, per the brief, not a production system. Explicitly
not built, with reasoning:

- **Authentication** — Supabase/Firebase Auth would wrap `studentId` around
  every request; omitted so the reviewer can test every intent without
  creating accounts. The schema already has a `students` table ready for it.
- **Advisor-facing dashboard UI** — the API (`/api/escalations`) exists;
  the UI doesn't, since the brief's core ask is the student-facing assistant.
- **Vector search over FAQs/courses** — a small curated dataset doesn't need
  embeddings; keyword/ILIKE search is faster to reason about and audit for
  this scale, and the architecture doesn't preclude adding it later.
- **Multi-turn slot filling** (e.g. asking "which day?" if the student
  omits it) — each turn currently re-classifies from scratch. Noted as the
  clearest next iteration in this design.

## Team division suggestion

Given the service-per-file structure, the natural split is:
1. **Backend/domain services** (courses, timetable, library, rooms, fees,
   IT, FAQ) — independent files, easy to parallelize across teammates.
2. **AI/routing** (`geminiService.js`, `intentRouter.js`, escalation logic)
   — one owner, since it's the architectural core others build against.
3. **Frontend** (chat UI + voice hooks) — one or two owners; only depends
   on the `/api/chat` contract, so can be built in parallel against a
   stubbed response before the backend is finished.
4. **Database schema + seed data** — whoever starts first, since everyone
   else's services depend on it.
