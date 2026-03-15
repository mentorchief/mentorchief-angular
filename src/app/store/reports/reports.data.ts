import type { MenteeReport, MentorProfileReview } from '../../core/models/dashboard.model';

export const initialMenteeReports: MenteeReport[] = [
  {
    id: 1,
    menteeId: 1,
    mentorId: 2,
    mentorName: 'David Lee',
    createdAt: '2025-12-15T14:00:00.000Z',
    summary: 'Strong progress over our six-month mentorship. The mentee showed clear growth in product thinking and stakeholder communication. Happy to recommend for PM roles.',
    rating: 4,
    behaviour: 'Professional and responsive throughout. Always on time for sessions, prepared questions in advance, and applied feedback promptly. Communicated clearly when needing to reschedule.',
    strengths: ['Curiosity and eagerness to learn', 'Strong follow-through on feedback', 'Willingness to iterate and revise work', 'Good written communication in PRDs and docs'],
    weaknesses: ['Initial difficulty saying no to scope creep', 'Stakeholder prioritization under pressure could improve'],
    areasToDevelop: ['Prioritization frameworks (e.g. RICE, value vs effort)', 'Cross-functional influence without authority', 'Handling ambiguous or conflicting inputs from multiple stakeholders'],
    recommendations: 'Recommend continuing with a mentor focused on senior PM behaviours (influence, strategy) and/or a technical PM track if they want to go deeper on execution with engineering.',
  },
  {
    id: 2,
    menteeId: 1,
    mentorId: 3,
    mentorName: 'Priya Sharma',
    createdAt: '2025-08-20T10:30:00.000Z',
    summary: 'Completed a focused UX/portfolio mentorship. The mentee improved their portfolio structure and presentation significantly. They are ready to apply to mid-level design roles.',
    rating: 5,
    behaviour: 'Very engaged and proactive. Brought real project work to sessions and was open to constructive critique. Great at iterating on visual and narrative feedback.',
    strengths: ['Visual design and layout sense', 'Ability to articulate design decisions', 'Portfolio storytelling improved markedly'],
    weaknesses: ['Research sections in case studies were initially thin', 'Time management when balancing multiple case studies'],
    areasToDevelop: ['End-to-end case studies that show research → concept → validation', 'Quantifying impact in portfolio (metrics, before/after)', 'Presentation and facilitation skills for design reviews'],
    recommendations: 'Suggested they continue building 2–3 case studies that show end-to-end impact. Consider a mentor focused on research or design systems next.',
  },
  {
    id: 3,
    menteeId: 2,
    mentorId: 1,
    mentorName: 'Sarah Chen',
    createdAt: '2026-01-10T12:00:00.000Z',
    summary: 'Emma made great progress on senior role preparation. Strong analytical skills and clear communication. Recommended next: practice executive-level storytelling and conflict resolution.',
    rating: 4,
    behaviour: 'Reliable and thoughtful. Asked clarifying questions and took notes. Sometimes needed a nudge to challenge assumptions out loud.',
    strengths: ['Analytical and data-driven', 'Clear written and verbal communication', 'Good at breaking down complex problems'],
    weaknesses: ['Executive presence in high-stakes meetings could be stronger', 'Tendency to over-prepare instead of thinking on feet'],
    areasToDevelop: ['Executive-level storytelling and framing', 'Conflict resolution and difficult conversations', 'Influence and persuasion with senior stakeholders'],
    recommendations: 'Practice executive-level storytelling and conflict resolution scenarios. A mentor with C-level exposure would help next.',
  },
];

const profileReviewTemplates: Omit<MentorProfileReview, 'mentorId'>[] = [
  { name: 'Alex M.', rating: 5, text: 'An incredible mentor. Insights into product strategy helped me land my dream PM role at a top tech company.' },
  { name: 'Jordan K.', rating: 5, text: 'The best investment in my career. Provides actionable feedback and genuinely cares about my growth.' },
  { name: 'Taylor R.', rating: 4, text: 'Great mentor with deep industry knowledge. Very responsive and always prepared for our sessions.' },
];

const mentorIds = ['1', '2', '3', '4', '5', '6'];
export const initialMentorProfileReviews: MentorProfileReview[] = mentorIds.flatMap((mentorId) =>
  profileReviewTemplates.map((t) => ({ ...t, mentorId })),
);
