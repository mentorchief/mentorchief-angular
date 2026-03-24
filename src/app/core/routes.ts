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
  suspended: '/suspended',
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
    settings: '/dashboard/mentee/settings',
  },

  /** Mentor dashboard */
  mentor: {
    dashboard: '/dashboard/mentor/home',
    pending: '/dashboard/mentor/pending',
    rejected: '/dashboard/mentor/rejected',
    myMentees: '/dashboard/mentor/my-mentees',
    messages: '/dashboard/mentor/messages',
    earnings: '/dashboard/mentor/earnings',
    reports: '/dashboard/mentor/reports',
    reviews: '/dashboard/mentor/reviews',
    settings: '/dashboard/mentor/settings',
    report: (menteeId: string) => `/dashboard/mentor/report/${menteeId}`,
    reportView: (reportId: number) => `/dashboard/mentor/report-view/${reportId}`,
    menteeReports: (menteeUuid: string, menteeName: string) => `/dashboard/mentor/mentee-reports/${menteeUuid}?name=${encodeURIComponent(menteeName)}`,
  },

  /** Shared notifications center (all roles) */
  notifications: '/dashboard/notifications',

  /** Admin dashboard */
  admin: {
    dashboard: '/dashboard/admin',
    users: '/dashboard/admin/users',
    mentorApplications: '/dashboard/admin/mentor-applications',
    payments: '/dashboard/admin/payments',
    messages: '/dashboard/admin/messages',
    reports: '/dashboard/admin/reports',
    mentorshipReports: '/dashboard/admin/mentorship-reports',
    settings: '/dashboard/admin/settings',
  },
} as const;
