-- ============================================================================
-- HelloBack Voice Assistant — Database Schema
-- Target: PostgreSQL 14+ / Supabase
-- ============================================================================
-- Design notes:
-- - "conversations" groups turns into a session (voice call or chat session).
-- - "messages" logs every single turn (student + assistant) with the detected
--   intent + confidence, so advisors can audit why the bot answered/escalated
--   a given way, and so we can measure intent-classification accuracy later.
-- - "escalations" is separate from messages: an escalation is a *case* an
--   advisor must act on, which may span several messages and has its own
--   lifecycle (open -> assigned -> resolved).
-- - Domain tables (courses, timetables, library_hours, fees, faqs) are the
--   "ground truth" the assistant is allowed to speak from. The LLM is never
--   the source of facts — it only paraphrases rows returned from these tables.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Students (kept minimal; in production this maps to Supabase Auth users)
-- ---------------------------------------------------------------------------
create table if not exists students (
    id              uuid primary key default uuid_generate_v4(),
    student_number  text unique,
    full_name       text not null,
    email           text unique not null,
    programme       text,
    year_of_study   int,
    created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Conversations & Messages (conversation logging requirement)
-- ---------------------------------------------------------------------------
create table if not exists conversations (
    id              uuid primary key default uuid_generate_v4(),
    student_id      uuid references students(id) on delete set null,
    channel         text not null check (channel in ('voice', 'chat')) default 'chat',
    started_at      timestamptz not null default now(),
    ended_at        timestamptz,
    status          text not null check (status in ('active', 'closed', 'escalated')) default 'active'
);

create table if not exists messages (
    id              uuid primary key default uuid_generate_v4(),
    conversation_id uuid not null references conversations(id) on delete cascade,
    sender          text not null check (sender in ('student', 'assistant', 'advisor')),
    content         text not null,
    intent          text,               -- e.g. 'timetable_enquiry', 'fee_enquiry'
    confidence      numeric(4,3),       -- 0.000 - 1.000, from the intent classifier
    created_at      timestamptz not null default now()
);

create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_messages_intent on messages(intent);

-- ---------------------------------------------------------------------------
-- Escalations (escalation to a human advisor requirement)
-- ---------------------------------------------------------------------------
create table if not exists escalations (
    id              uuid primary key default uuid_generate_v4(),
    conversation_id uuid not null references conversations(id) on delete cascade,
    reason          text not null,      -- e.g. 'low_confidence', 'explicit_request', 'sensitive_topic'
    priority        text not null check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',
    status          text not null check (status in ('open', 'assigned', 'resolved')) default 'open',
    assigned_advisor text,
    created_at      timestamptz not null default now(),
    resolved_at     timestamptz
);

create index if not exists idx_escalations_status on escalations(status);

-- ---------------------------------------------------------------------------
-- Domain data: Courses
-- ---------------------------------------------------------------------------
create table if not exists courses (
    id              uuid primary key default uuid_generate_v4(),
    code            text unique not null,      -- e.g. 'CN7000'
    title           text not null,
    department      text not null,
    level           text,                      -- 'Undergraduate' / 'Postgraduate'
    credits         int,
    description     text
);

-- ---------------------------------------------------------------------------
-- Domain data: Timetable
-- ---------------------------------------------------------------------------
create table if not exists timetable_entries (
    id              uuid primary key default uuid_generate_v4(),
    course_id       uuid references courses(id) on delete cascade,
    day_of_week     text not null check (day_of_week in
                        ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time      time not null,
    end_time        time not null,
    room            text,
    session_type    text check (session_type in ('Lecture','Seminar','Lab','Workshop'))
);

-- ---------------------------------------------------------------------------
-- Domain data: Library hours
-- ---------------------------------------------------------------------------
create table if not exists library_hours (
    id              uuid primary key default uuid_generate_v4(),
    site_name       text not null,             -- e.g. 'Docklands Library'
    day_of_week     text not null check (day_of_week in
                        ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    opens_at        time,
    closes_at       time,
    is_24_hours     boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Domain data: Rooms & bookings
-- ---------------------------------------------------------------------------
create table if not exists rooms (
    id              uuid primary key default uuid_generate_v4(),
    name            text unique not null,      -- e.g. 'Study Room 3B'
    building        text not null,
    capacity        int not null
);

create table if not exists room_bookings (
    id              uuid primary key default uuid_generate_v4(),
    room_id         uuid references rooms(id) on delete cascade,
    student_id      uuid references students(id) on delete set null,
    booking_date    date not null,
    start_time      time not null,
    end_time        time not null,
    status          text not null check (status in ('confirmed','cancelled')) default 'confirmed',
    created_at      timestamptz not null default now(),
    unique (room_id, booking_date, start_time)  -- prevents double-booking
);

-- ---------------------------------------------------------------------------
-- Domain data: Tuition fees
-- ---------------------------------------------------------------------------
create table if not exists fee_schedules (
    id              uuid primary key default uuid_generate_v4(),
    programme       text not null,
    level           text not null,
    student_type    text not null check (student_type in ('Home','International')),
    academic_year   text not null,             -- e.g. '2026/27'
    annual_fee_gbp  numeric(10,2) not null,
    payment_plan_info text
);

-- ---------------------------------------------------------------------------
-- Domain data: IT support ticket categories (routes to real ticketing system
-- in production; here we log a request row)
-- ---------------------------------------------------------------------------
create table if not exists it_support_requests (
    id              uuid primary key default uuid_generate_v4(),
    student_id      uuid references students(id) on delete set null,
    category        text not null,             -- 'wifi','password_reset','vpn','software','hardware'
    description     text not null,
    status          text not null check (status in ('open','in_progress','resolved')) default 'open',
    created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Domain data: FAQs (general knowledge base, retrieved then paraphrased)
-- ---------------------------------------------------------------------------
create table if not exists faqs (
    id              uuid primary key default uuid_generate_v4(),
    category        text not null,
    question        text not null,
    answer          text not null,
    keywords        text[]                     -- used for lightweight keyword search fallback
);

-- ============================================================================
-- Seed data (small, representative — enough to demo every service)
-- ============================================================================

insert into courses (code, title, department, level, credits, description) values
 ('CN7000', 'Cloud Computing', 'Computer Science', 'Postgraduate', 20, 'Covers distributed systems, containers, and cloud-native architecture.'),
 ('CN7001', 'Artificial Intelligence', 'Computer Science', 'Postgraduate', 20, 'Foundations of AI including search, ML, and NLP.'),
 ('BU4002', 'Business Analytics', 'Business School', 'Undergraduate', 15, 'Introductory data analytics for business decision-making.')
on conflict (code) do nothing;

insert into library_hours (site_name, day_of_week, opens_at, closes_at, is_24_hours) values
 ('Docklands Library', 'Monday', '08:00', '22:00', false),
 ('Docklands Library', 'Tuesday', '08:00', '22:00', false),
 ('Docklands Library', 'Wednesday', '08:00', '22:00', false),
 ('Docklands Library', 'Thursday', '08:00', '22:00', false),
 ('Docklands Library', 'Friday', '08:00', '20:00', false),
 ('Docklands Library', 'Saturday', '10:00', '18:00', false),
 ('Docklands Library', 'Sunday', '10:00', '18:00', false)
on conflict do nothing;

insert into rooms (name, building, capacity) values
 ('Study Room 3B', 'Docklands Library', 6),
 ('Study Room 4A', 'Docklands Library', 4),
 ('Group Pod 1', 'University Square', 8)
on conflict (name) do nothing;

insert into fee_schedules (programme, level, student_type, academic_year, annual_fee_gbp, payment_plan_info) values
 ('Computer Science MSc', 'Postgraduate', 'Home', '2026/27', 10500.00, 'Payable in 3 instalments via the student portal.'),
 ('Computer Science MSc', 'Postgraduate', 'International', '2026/27', 17500.00, 'Payable in 3 instalments; deposit required at enrolment.'),
 ('Business Analytics BSc', 'Undergraduate', 'Home', '2026/27', 9250.00, 'Covered by Student Finance for eligible UK students.')
on conflict do nothing;

insert into faqs (category, question, answer, keywords) values
 ('General', 'How do I reset my student password?', 'Go to the IT Self-Service Portal and select "Reset Password". You will need your student number and registered personal email.', array['password','reset','login']),
 ('General', 'How do I apply for an extension on an assignment?', 'Submit an Extenuating Circumstances form via the student portal before the deadline, with supporting evidence.', array['extension','deadline','assignment']),
 ('General', 'Where do I get my student ID card?', 'Student ID cards are issued at the Student Hub on the ground floor of University House during enrolment week.', array['id card','student card'])
on conflict do nothing;
