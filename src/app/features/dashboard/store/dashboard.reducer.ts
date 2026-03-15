import { createReducer, on } from '@ngrx/store';
import type {
  DashboardState,
  MenteeDashboardState,
  MentorDashboardState,
  AdminDashboardState,
  AdminReportsState,
  ActiveMenteeSummary,
  ActiveMentorSummary,
  PastMentorSummary,
  MenteeListItem,
  MentorReview,
  MentorProfileReview,
  MenteeReport,
  AdminPayment,
} from '../../../core/models/dashboard.model';
import type { User } from '../../../core/models/user.model';
import {
  acceptMenteeRequest,
  acceptMentorshipRequest,
  addMenteeReport,
  addUser,
  cancelMenteeSubscription,
  declineMentorshipRequest,
  initializeDashboardForRole,
  removeMenteeFromList,
  resetDashboard,
  setMentorPendingRequests,
  setMentorApprovalStatus,
  submitMentorReview,
  updateUserProfile,
  updateUserStatus,
} from './dashboard.actions';

const emptyMentee: MenteeDashboardState = {
  activeMentorship: null,
  subscription: null,
  payments: [],
};

const emptyMentor: MentorDashboardState = {
  stats: [],
  pendingRequests: [],
  activeMentees: [],
  earnings: [],
};

const emptyAdmin: AdminDashboardState = {
  stats: [],
  pendingActions: [],
  recentActivities: [],
};

const emptyAdminReports: AdminReportsState = {
  metrics: [],
  revenueData: [],
  userGrowth: [],
  topMentors: [],
  recentActivity: [],
};

const emptyMyMentors: { active: ActiveMentorSummary[]; past: PastMentorSummary[] } = {
  active: [],
  past: [],
};

const initialMentee: MenteeDashboardState = {
  activeMentorship: {
    mentorId: '1',
    mentorName: 'Sarah Chen',
    mentorTitle: 'Senior PM',
    mentorCompany: 'Google',
    mentorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    monthsActive: 2,
    progress: 50,
  },
  subscription: {
    planName: 'Monthly Subscription',
    amount: 150,
    currency: 'USD',
    nextBillingDate: 'April 1, 2026',
    status: 'active',
    startedAt: '2026-03-10', // Demo: 2 days ago so 3-day cancel is available
  },
  payments: [
    { id: '1', month: 'March 2026', amount: 150, status: 'in_escrow', releaseDate: 'Apr 1, 2026', paidToMentor: false },
    { id: '2', month: 'February 2026', amount: 150, status: 'released', paidToMentor: true },
  ],
};

const initialMentor: MentorDashboardState = {
  stats: [
    { label: 'Active Mentees', value: '12', icon: ['fas', 'users'], bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { label: 'Monthly Revenue', value: '$1,800', icon: ['fas', 'dollar-sign'], bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { label: 'Total Earned', value: '$4,850', icon: ['fas', 'wallet'], bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { label: 'Avg. Rating', value: '4.9', icon: ['fas', 'star'], bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  ],
  pendingRequests: [
    { id: 1, name: 'Jordan Patel', goal: 'First PM Role', message: 'I want to transition into product management from software engineering...', rating: 4.3 },
    { id: 2, name: 'Emma Wilson', goal: 'Senior Role Prep', message: 'Looking for guidance on getting promoted to senior PM...', rating: null },
  ],
  activeMentees: [
    { id: 1, name: 'Alex Thompson', goal: 'PM Career Transition', progress: 75, monthsActive: 2 },
    { id: 2, name: 'Maya Johnson', goal: 'Product Strategy Skills', progress: 45, monthsActive: 1 },
    { id: 3, name: 'Chris Lee', goal: 'Senior PM Promotion', progress: 90, monthsActive: 3 },
  ],
  earnings: [
    { month: 'March 2026', amount: 1800, status: 'In Escrow', mentees: 12 },
    { month: 'February 2026', amount: 1650, status: 'Released', mentees: 11 },
    { month: 'January 2026', amount: 1400, status: 'Released', mentees: 10 },
  ],
};

const initialAdmin: AdminDashboardState = {
  stats: [
    { label: 'Total Users', value: '2,847', change: '+12.5%', icon: ['fas', 'users'], color: 'text-blue-600' },
    { label: 'Active Mentors', value: '342', change: '+8.2%', icon: ['fas', 'check'], color: 'text-green-600' },
    { label: 'Active Mentees', value: '1,856', change: '+15.3%', icon: ['fas', 'users'], color: 'text-indigo-600' },
    { label: 'Monthly Revenue', value: '$48,325', change: '+22.1%', icon: ['fas', 'dollar-sign'], color: 'text-emerald-600' },
    { label: 'Active Sessions', value: '1,023', change: '+9.7%', icon: ['fas', 'file-lines'], color: 'text-purple-600' },
    { label: 'Platform Growth', value: '+18.4%', change: 'This month', icon: ['fas', 'chart-line'], color: 'text-amber-600' },
  ],
  pendingActions: [
    { title: 'Mentor Applications', count: 12, priority: 'high', path: '/dashboard/admin/mentor-applications' },
    { title: 'Reported Issues', count: 3, priority: 'high', path: '/dashboard/admin/reports' },
    { title: 'Feature Requests', count: 24, priority: 'low', path: '/dashboard/admin/settings' },
  ],
  recentActivities: [
    { type: 'New Mentor', name: 'Emma Wilson', detail: 'Software Engineering', time: '2 hours ago' },
    { type: 'New Mentee', name: 'John Davis', detail: 'Product Management', time: '3 hours ago' },
    { type: 'Payment', name: 'Subscription paid', detail: '$150 from Alex Johnson', time: '5 hours ago' },
    { type: 'Report', name: 'Monthly Report', detail: 'Submitted by Sarah Chen', time: '6 hours ago' },
    { type: 'Review', name: '5-star review', detail: 'From Michael Thompson', time: '8 hours ago' },
  ],
};

const initialAdminReports: AdminReportsState = {
  metrics: [
    { label: 'Total Users', value: '1,247', trend: 12 },
    { label: 'Active Mentorships', value: '342', trend: 8 },
    { label: 'Monthly Revenue', value: '$48,500', trend: 15 },
    { label: 'Avg. Session Rating', value: '4.8', trend: 2 },
  ],
  revenueData: [
    { month: 'Sep', value: 32000 },
    { month: 'Oct', value: 35000 },
    { month: 'Nov', value: 38000 },
    { month: 'Dec', value: 42000 },
    { month: 'Jan', value: 45000 },
    { month: 'Feb', value: 48500 },
  ],
  userGrowth: [
    { label: 'Mentees', count: 892, color: 'bg-blue-500' },
    { label: 'Mentors', count: 342, color: 'bg-purple-500' },
    { label: 'Admins', count: 13, color: 'bg-primary' },
  ],
  topMentors: [
    { name: 'Sarah Chen', mentees: 12, earnings: 4500 },
    { name: 'David Lee', mentees: 10, earnings: 3800 },
    { name: 'James Wilson', mentees: 8, earnings: 3200 },
  ],
  recentActivity: [
    { id: 1, icon: ['fas', 'user'], iconBg: 'bg-blue-100', text: 'New user registration: Emma Wilson', time: '2 hours ago' },
    { id: 2, icon: ['fas', 'dollar-sign'], iconBg: 'bg-green-100', text: 'Payment completed: $150 from Alex Johnson', time: '4 hours ago' },
    { id: 3, icon: ['fas', 'triangle-exclamation'], iconBg: 'bg-amber-100', text: 'Dispute opened: TXN004', time: '1 day ago' },
    { id: 4, icon: ['fas', 'check'], iconBg: 'bg-green-100', text: 'Mentor approved: James Wilson', time: '2 days ago' },
  ],
};

const initialMyMentors: { active: ActiveMentorSummary[]; past: PastMentorSummary[] } = {
  active: [
    {
      id: 1,
      name: 'Sarah Chen',
      title: 'Senior PM',
      company: 'Google',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      startDate: 'Feb 1, 2026',
      price: 150,
      progress: 65,
    },
  ],
  past: [
    {
      id: 2,
      name: 'David Lee',
      title: 'Lead PM',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      startDate: 'Jun 1, 2025',
      endDate: 'Dec 15, 2025',
    },
  ],
};

const initialMyMentees: MenteeListItem[] = [
  { id: 1, name: 'Alex Johnson', avatar: '', email: 'alex@example.com', plan: 'Monthly', startDate: 'Jan 15, 2026', progress: 75, status: 'active' },
  { id: 2, name: 'Emma Wilson', avatar: '', email: 'emma@example.com', plan: 'Quarterly', startDate: 'Feb 1, 2026', progress: 45, status: 'active' },
  { id: 3, name: 'Michael Brown', avatar: '', email: 'michael@example.com', plan: 'Monthly', startDate: 'Mar 1, 2026', progress: 10, status: 'active' },
  { id: 4, name: 'Sophie Lee', avatar: '', email: 'sophie@example.com', plan: 'Monthly', startDate: '-', progress: 0, status: 'pending' },
];

const initialMenteeReports: MenteeReport[] = [
  {
    id: 1,
    menteeId: 1,
    mentorId: 2,
    mentorName: 'David Lee',
    createdAt: '2025-12-15T14:00:00.000Z',
    summary:
      'Strong progress over our six-month mentorship. The mentee showed clear growth in product thinking and stakeholder communication. Happy to recommend for PM roles.',
    rating: 4,
    behaviour:
      'Professional and responsive throughout. Always on time for sessions, prepared questions in advance, and applied feedback promptly. Communicated clearly when needing to reschedule.',
    strengths: [
      'Curiosity and eagerness to learn',
      'Strong follow-through on feedback',
      'Willingness to iterate and revise work',
      'Good written communication in PRDs and docs',
    ],
    weaknesses: [
      'Initial difficulty saying no to scope creep',
      'Stakeholder prioritization under pressure could improve',
    ],
    areasToDevelop: [
      'Prioritization frameworks (e.g. RICE, value vs effort)',
      'Cross-functional influence without authority',
      'Handling ambiguous or conflicting inputs from multiple stakeholders',
    ],
    recommendations:
      'Recommend continuing with a mentor focused on senior PM behaviours (influence, strategy) and/or a technical PM track if they want to go deeper on execution with engineering.',
  },
  {
    id: 2,
    menteeId: 1,
    mentorId: 3,
    mentorName: 'Priya Sharma',
    createdAt: '2025-08-20T10:30:00.000Z',
    summary:
      'Completed a focused UX/portfolio mentorship. The mentee improved their portfolio structure and presentation significantly. They are ready to apply to mid-level design roles.',
    rating: 5,
    behaviour:
      'Very engaged and proactive. Brought real project work to sessions and was open to constructive critique. Great at iterating on visual and narrative feedback.',
    strengths: [
      'Visual design and layout sense',
      'Ability to articulate design decisions',
      'Portfolio storytelling improved markedly',
    ],
    weaknesses: [
      'Research sections in case studies were initially thin',
      'Time management when balancing multiple case studies',
    ],
    areasToDevelop: [
      'End-to-end case studies that show research → concept → validation',
      'Quantifying impact in portfolio (metrics, before/after)',
      'Presentation and facilitation skills for design reviews',
    ],
    recommendations:
      'Suggested they continue building 2–3 case studies that show end-to-end impact. Consider a mentor focused on research or design systems next.',
  },
  {
    id: 3,
    menteeId: 2,
    mentorId: 1,
    mentorName: 'Sarah Chen',
    createdAt: '2026-01-10T12:00:00.000Z',
    summary:
      'Emma made great progress on senior role preparation. Strong analytical skills and clear communication. Recommended next: practice executive-level storytelling and conflict resolution.',
    rating: 4,
    behaviour:
      'Reliable and thoughtful. Asked clarifying questions and took notes. Sometimes needed a nudge to challenge assumptions out loud.',
    strengths: [
      'Analytical and data-driven',
      'Clear written and verbal communication',
      'Good at breaking down complex problems',
    ],
    weaknesses: [
      'Executive presence in high-stakes meetings could be stronger',
      'Tendency to over-prepare instead of thinking on feet',
    ],
    areasToDevelop: [
      'Executive-level storytelling and framing',
      'Conflict resolution and difficult conversations',
      'Influence and persuasion with senior stakeholders',
    ],
    recommendations:
      'Practice executive-level storytelling and conflict resolution scenarios. A mentor with C-level exposure would help next.',
  },
];

/** Single source of truth for all platform users (auth + admin). Same list used for login and admin users page. */
const initialPlatformUsers: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'mentee@demo.com',
    password: 'password123',
    role: 'mentee',
    avatar: 'AJ',
    registered: true,
    status: 'active',
    joinDate: 'Feb 1, 2026',
    phone: '15551234568',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'mentor@demo.com',
    password: 'password123',
    role: 'mentor',
    avatar: 'SC',
    registered: true,
    mentorApprovalStatus: 'approved',
    status: 'active',
    joinDate: 'Jan 15, 2026',
    phone: '15551234567',
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@mentorchief.com',
    password: 'admin2026',
    role: 'admin',
    avatar: 'AD',
    registered: true,
    status: 'active',
    joinDate: 'Jan 1, 2026',
  },
  {
    id: '4',
    name: 'Marcus Williams',
    email: 'marcus.williams@example.com',
    password: 'password123',
    role: 'mentor',
    avatar: 'MW',
    registered: true,
    mentorApprovalStatus: 'pending',
    status: 'active',
    joinDate: 'Mar 10, 2026',
    jobTitle: 'Senior Product Manager',
    company: 'TechCorp',
    bio: '10+ years in product management. Led product teams at 3 startups. Passionate about helping early-career PMs navigate ambiguity and ship with impact.',
    yearsOfExperience: '10',
    skills: ['Product Strategy', 'Roadmapping', 'Stakeholder Management'],
    linkedin: 'https://linkedin.com/in/marcuswilliams',
    phone: '+1 555 123 4567',
    location: 'San Francisco, CA',
  },
  {
    id: '5',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    password: 'password123',
    role: 'mentor',
    avatar: 'PS',
    registered: true,
    mentorApprovalStatus: 'pending',
    status: 'active',
    joinDate: 'Mar 12, 2026',
    jobTitle: 'Engineering Lead',
    company: 'StartupXYZ',
    bio: 'Former FAANG engineer turned startup lead. Specializing in system design and career growth for engineers.',
    yearsOfExperience: '8',
    skills: ['System Design', 'Backend', 'Leadership'],
    portfolioUrl: 'https://priyasharma.dev',
    phone: '+1 555 987 6543',
    location: 'New York, NY',
  },
  {
    id: '6',
    name: 'David Kim',
    email: 'david.kim@example.com',
    password: 'password123',
    role: 'mentor',
    avatar: 'DK',
    registered: true,
    mentorApprovalStatus: 'pending',
    status: 'active',
    joinDate: 'Mar 14, 2026',
    jobTitle: 'UX Design Director',
    company: 'Design Studio',
    bio: 'Design leader with 12 years of experience. Focused on helping designers build portfolios and transition into leadership roles.',
    yearsOfExperience: '12',
    skills: ['UX Research', 'Design Systems', 'User Testing'],
    linkedin: 'https://linkedin.com/in/davidkimux',
    portfolioUrl: 'https://davidkim.design',
    location: 'Austin, TX',
  },
];

const initialAdminPayments: AdminPayment[] = [
  { id: 'TXN001', date: 'Mar 1, 2026', mentee: 'Alex Johnson', mentor: 'Sarah Chen', amount: 150, status: 'in_escrow' },
  { id: 'TXN002', date: 'Mar 1, 2026', mentee: 'Emma Wilson', mentor: 'Sarah Chen', amount: 400, status: 'in_escrow' },
  { id: 'TXN003', date: 'Feb 28, 2026', mentee: 'Michael Brown', mentor: 'David Lee', amount: 200, status: 'completed' },
  { id: 'TXN004', date: 'Feb 15, 2026', mentee: 'Sophie Lee', mentor: 'James Wilson', amount: 150, status: 'disputed' },
  { id: 'TXN005', date: 'Feb 1, 2026', mentee: 'Alex Johnson', mentor: 'Sarah Chen', amount: 150, status: 'completed' },
];

const profileReviewTemplates: Omit<MentorProfileReview, 'mentorId'>[] = [
  { name: 'Alex M.', rating: 5, text: 'An incredible mentor. Insights into product strategy helped me land my dream PM role at a top tech company.' },
  { name: 'Jordan K.', rating: 5, text: 'The best investment in my career. Provides actionable feedback and genuinely cares about my growth.' },
  { name: 'Taylor R.', rating: 4, text: 'Great mentor with deep industry knowledge. Very responsive and always prepared for our sessions.' },
];

const mentorIds = ['1', '2', '3', '4', '5', '6'];
const initialMentorProfileReviews: MentorProfileReview[] = mentorIds.flatMap((mentorId) =>
  profileReviewTemplates.map((t) => ({ ...t, mentorId })),
);

const initialState: DashboardState = {
  mentee: initialMentee,
  mentor: initialMentor,
  admin: initialAdmin,
  adminReports: initialAdminReports,
  platformUsers: initialPlatformUsers,
  adminPayments: initialAdminPayments,
  myMentors: initialMyMentors,
  myMentees: initialMyMentees,
  menteeReviews: [],
  menteeReports: initialMenteeReports,
  mentorProfileReviews: initialMentorProfileReviews,
  platformConfig: { samplePrice: 150, satisfactionRate: 98, countries: 50, defaultCardExpiry: '12/27', avgSessionRating: '4.8' },
};

function buildStateForRole(role: 'mentee' | 'mentor' | 'admin', platformUsers: User[] = initialPlatformUsers): DashboardState {
  const shared = {
    platformUsers,
    platformConfig: { samplePrice: 150, satisfactionRate: 98, countries: 50, defaultCardExpiry: '12/27', avgSessionRating: '4.8' as const },
    mentorProfileReviews: initialMentorProfileReviews,
    menteeReviews: [] as MentorReview[],
    menteeReports: initialMenteeReports,
  };
  switch (role) {
    case 'mentee':
      return {
        ...shared,
        mentee: initialMentee,
        myMentors: initialMyMentors,
        mentor: emptyMentor,
        admin: emptyAdmin,
        adminReports: emptyAdminReports,
        adminPayments: [],
        myMentees: [],
      };
    case 'mentor':
      return {
        ...shared,
        mentor: initialMentor,
        myMentees: initialMyMentees,
        mentee: emptyMentee,
        admin: emptyAdmin,
        adminReports: emptyAdminReports,
        adminPayments: [],
        myMentors: emptyMyMentors,
      };
    case 'admin':
      return {
        ...shared,
        admin: initialAdmin,
        adminReports: initialAdminReports,
        adminPayments: initialAdminPayments,
        mentee: emptyMentee,
        mentor: emptyMentor,
        myMentors: emptyMyMentors,
        myMentees: [],
      };
  }
}

export const dashboardReducer = createReducer(
  initialState,
  on(initializeDashboardForRole, (state, { role }) => buildStateForRole(role, state.platformUsers)),
  on(resetDashboard, (state) => ({ ...initialState, platformUsers: state.platformUsers })),
  on(declineMentorshipRequest, (state, { requestId: id }) => ({
    ...state,
    mentor: {
      ...state.mentor,
      pendingRequests: state.mentor.pendingRequests.filter((r) => r.id !== id),
    },
  })),
  on(acceptMentorshipRequest, (state, { request }) => {
    const newMentee: ActiveMenteeSummary = {
      id: request.id,
      name: request.name,
      goal: request.goal,
      progress: 0,
      monthsActive: 0,
    };
    return {
      ...state,
      mentor: {
        ...state.mentor,
        pendingRequests: state.mentor.pendingRequests.filter((r) => r.id !== request.id),
        activeMentees: [...state.mentor.activeMentees, newMentee],
      },
    };
  }),
  on(setMentorPendingRequests, (state, { requests }) => ({
    ...state,
    mentor: {
      ...state.mentor,
      pendingRequests: requests,
    },
  })),
  on(removeMenteeFromList, (state, { menteeId }) => ({
    ...state,
    myMentees: state.myMentees.filter((m) => m.id !== menteeId),
  })),
  on(acceptMenteeRequest, (state, { menteeId }) => ({
    ...state,
    myMentees: state.myMentees.map((m) =>
      m.id === menteeId ? { ...m, status: 'active' as const, startDate: m.startDate === '-' ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : m.startDate } : m,
    ),
  })),
  on(submitMentorReview, (state, { mentorId, rating, comment }) => {
    const submittedAt = new Date().toISOString();
    const newReview: MentorReview = { mentorId, rating, comment, submittedAt };
    const filtered = state.menteeReviews.filter((r) => r.mentorId !== mentorId);
    return {
      ...state,
      menteeReviews: [...filtered, newReview],
    };
  }),
  on(addMenteeReport, (state, payload) => {
    const { menteeId, mentorId, mentorName, summary } = payload;
    const newReport: MenteeReport = {
      id: state.menteeReports.length ? Math.max(...state.menteeReports.map((r) => r.id)) + 1 : 1,
      menteeId,
      mentorId,
      mentorName,
      createdAt: new Date().toISOString(),
      summary,
      rating: payload.rating,
      behaviour: payload.behaviour,
      strengths: payload.strengths,
      weaknesses: payload.weaknesses,
      areasToDevelop: payload.areasToDevelop,
      recommendations: payload.recommendations,
    };
    return {
      ...state,
      myMentees: state.myMentees.map((m) =>
        m.id === menteeId ? { ...m, status: 'completed' as const } : m,
      ),
      menteeReports: [...state.menteeReports, newReport],
    };
  }),
  on(cancelMenteeSubscription, (state) => {
    const sub = state.mentee.subscription;
    if (!sub || sub.status !== 'active') return state;
    return {
      ...state,
      mentee: {
        ...state.mentee,
        activeMentorship: null,
        subscription: { ...sub, status: 'cancelled' as const },
        payments: state.mentee.payments.map((p) =>
          p.status === 'in_escrow' ? { ...p, status: 'refunded' as const, paidToMentor: false } : p,
        ),
      },
    };
  }),
  on(addUser, (state, { user }) => ({
    ...state,
    platformUsers: [...state.platformUsers, { ...user, status: user.status ?? 'active', joinDate: user.joinDate ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }],
  })),
  on(updateUserStatus, (state, { userId, status }) => ({
    ...state,
    platformUsers: state.platformUsers.map((u) =>
      u.id === userId ? { ...u, status } : u,
    ),
  })),
  on(setMentorApprovalStatus, (state, { userId, mentorApprovalStatus }) => ({
    ...state,
    platformUsers: state.platformUsers.map((u) =>
      u.id === userId ? { ...u, mentorApprovalStatus } : u,
    ),
  })),
  on(updateUserProfile, (state, { userId, updates }) => ({
    ...state,
    platformUsers: state.platformUsers.map((u) =>
      u.id === userId ? { ...u, ...updates } : u,
    ),
  })),
);
