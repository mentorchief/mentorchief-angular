/**
 * Centralized route paths. Use these constants instead of hardcoded strings
 * for navigation, routerLink, and route guards.
 */
export const ROUTES = {
  /** Public */
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  browse: '/browse',
  howItWorks: '/how-it-works',
  about: '/about',
  help: '/help',
  terms: '/terms',
  privacy: '/privacy',
  blog: '/blog',

  /** Mentor profile (use with mentor id) */
  mentorProfile: (id: string) => `/mentor/${id}`,
  mentorReviews: (id: string) => `/mentor/${id}/reviews`,
  mentorRequest: (id: string) => `/mentor/${id}/request`,

  /** Registration steps */
  registration: {
    base: '/auth/registration-steps',
    roleInfo: '/auth/registration-steps/role-info',
    personalInfo: '/auth/registration-steps/personal-info',
    careerInfo: '/auth/registration-steps/career-info',
    biography: '/auth/registration-steps/biography',
    preference: '/auth/registration-steps/preference',
    preview: '/auth/registration-steps/preview',
  },

  /** Mentee dashboard */
  mentee: {
    dashboard: '/dashboard/mentee',
    myMentors: '/dashboard/mentee/my-mentors',
    messages: '/dashboard/mentee/messages',
    payments: '/dashboard/mentee/payments',
    reports: '/dashboard/mentee/reports',
    notifications: '/dashboard/mentee/notifications',
    settings: '/dashboard/mentee/settings',
  },

  /** Mentor dashboard */
  mentor: {
    dashboard: '/dashboard/mentor',
    pending: '/dashboard/mentor/pending',
    rejected: '/dashboard/mentor/rejected',
    myMentees: '/dashboard/mentor/my-mentees',
    messages: '/dashboard/mentor/messages',
    earnings: '/dashboard/mentor/earnings',
    reports: '/dashboard/mentor/reports',
    notifications: '/dashboard/mentor/notifications',
    settings: '/dashboard/mentor/settings',
    report: (menteeId: string) => `/dashboard/mentor/report/${menteeId}`,
    reportView: (reportId: number) => `/dashboard/mentor/report-view/${reportId}`,
  },

  /** Admin dashboard */
  admin: {
    dashboard: '/dashboard/admin',
    users: '/dashboard/admin/users',
    mentorApplications: '/dashboard/admin/mentor-applications',
    payments: '/dashboard/admin/payments',
    messages: '/dashboard/admin/messages',
    reports: '/dashboard/admin/reports',
    mentorshipReports: '/dashboard/admin/mentorship-reports',
    notifications: '/dashboard/admin/notifications',
    settings: '/dashboard/admin/settings',
  },
} as const;
