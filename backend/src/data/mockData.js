// In-memory fallback data mirroring database/schema.sql seed data.
// Used automatically when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not
// configured, so the project is runnable and demoable out of the box.
// Domain services check `isDatabaseConfigured` and fall back to this module.

export const courses = [
  {
    id: 'c1',
    code: 'CN7000',
    title: 'Cloud Computing',
    department: 'Computer Science',
    level: 'Postgraduate',
    credits: 20,
    description: 'Covers distributed systems, containers, and cloud-native architecture.',
  },
  {
    id: 'c2',
    code: 'CN7001',
    title: 'Artificial Intelligence',
    department: 'Computer Science',
    level: 'Postgraduate',
    credits: 20,
    description: 'Foundations of AI including search, ML, and NLP.',
  },
  {
    id: 'c3',
    code: 'BU4002',
    title: 'Business Analytics',
    department: 'Business School',
    level: 'Undergraduate',
    credits: 15,
    description: 'Introductory data analytics for business decision-making.',
  },
];

export const timetableEntries = [
  { id: 't1', courseCode: 'CN7000', dayOfWeek: 'Monday', startTime: '10:00', endTime: '12:00', room: 'ED.2.15', sessionType: 'Lecture' },
  { id: 't2', courseCode: 'CN7000', dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '16:00', room: 'ED.1.04', sessionType: 'Lab' },
  { id: 't3', courseCode: 'CN7001', dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '11:00', room: 'ED.3.01', sessionType: 'Lecture' },
  { id: 't4', courseCode: 'BU4002', dayOfWeek: 'Thursday', startTime: '13:00', endTime: '15:00', room: 'US.1.10', sessionType: 'Seminar' },
];

export const libraryHours = [
  { dayOfWeek: 'Monday', opensAt: '08:00', closesAt: '22:00', is24Hours: false },
  { dayOfWeek: 'Tuesday', opensAt: '08:00', closesAt: '22:00', is24Hours: false },
  { dayOfWeek: 'Wednesday', opensAt: '08:00', closesAt: '22:00', is24Hours: false },
  { dayOfWeek: 'Thursday', opensAt: '08:00', closesAt: '22:00', is24Hours: false },
  { dayOfWeek: 'Friday', opensAt: '08:00', closesAt: '20:00', is24Hours: false },
  { dayOfWeek: 'Saturday', opensAt: '10:00', closesAt: '18:00', is24Hours: false },
  { dayOfWeek: 'Sunday', opensAt: '10:00', closesAt: '18:00', is24Hours: false },
];

export const rooms = [
  { id: 'r1', name: 'Study Room 3B', building: 'Docklands Library', capacity: 6 },
  { id: 'r2', name: 'Study Room 4A', building: 'Docklands Library', capacity: 4 },
  { id: 'r3', name: 'Group Pod 1', building: 'University Square', capacity: 8 },
];

// Mutable in-memory booking list (demo-only persistence for the session)
export const roomBookings = [];

export const feeSchedules = [
  { programme: 'Computer Science MSc', level: 'Postgraduate', studentType: 'Home', academicYear: '2026/27', annualFeeGbp: 10500.0, paymentPlanInfo: 'Payable in 3 instalments via the student portal.' },
  { programme: 'Computer Science MSc', level: 'Postgraduate', studentType: 'International', academicYear: '2026/27', annualFeeGbp: 17500.0, paymentPlanInfo: 'Payable in 3 instalments; deposit required at enrolment.' },
  { programme: 'Business Analytics BSc', level: 'Undergraduate', studentType: 'Home', academicYear: '2026/27', annualFeeGbp: 9250.0, paymentPlanInfo: 'Covered by Student Finance for eligible UK students.' },
];

export const faqs = [
  { id: 'f1', category: 'General', question: 'How do I reset my student password?', answer: 'Go to the IT Self-Service Portal and select "Reset Password". You will need your student number and registered personal email.', keywords: ['password', 'reset', 'login'] },
  { id: 'f2', category: 'General', question: 'How do I apply for an extension on an assignment?', answer: 'Submit an Extenuating Circumstances form via the student portal before the deadline, with supporting evidence.', keywords: ['extension', 'deadline', 'assignment'] },
  { id: 'f3', category: 'General', question: 'Where do I get my student ID card?', answer: 'Student ID cards are issued at the Student Hub on the ground floor of University House during enrolment week.', keywords: ['id card', 'student card'] },
];

// In-memory conversation/message/escalation logs (demo-only persistence)
export const conversations = new Map();
export const escalations = [];
export const itSupportRequests = [];
