export enum UserRole {
  Mentee = 'mentee',
  Mentor = 'mentor',
  Admin = 'admin',
}

/** Display labels for roles (single source for UI strings). */
export const ROLE_DISPLAY_LABELS: Record<UserRole, string> = {
  [UserRole.Mentee]: 'Mentee',
  [UserRole.Mentor]: 'Mentor',
  [UserRole.Admin]: 'Admin',
};

export enum MentorApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export type MentorPlanDuration = 'monthly' | 'quarterly' | '6months';

export interface MentorPlan {
  id: string;
  duration: MentorPlanDuration;
  price: string;
}

export interface UserExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  registered?: boolean;
  phone?: string;
  location?: string;
  gender?: string;
  jobTitle?: string;
  company?: string;
  yearsOfExperience?: string;
  bio?: string;
  skills?: string[];
  tools?: string[];
  portfolioUrl?: string;
  linkedin?: string;
  experiences?: UserExperience[];
  subscriptionCost?: string;
  mentorPlans?: MentorPlan[];
  availability?: string[];
  menteeCapacity?: string;
  /** For mentors: application under admin review. Omitted or 'approved' = can use dashboard. */
  mentorApprovalStatus?: MentorApprovalStatus;
  /** Platform-level status (admin suspend/activate). Default 'active'. */
  status?: 'active' | 'suspended' | 'pending';
  /** Display join date (e.g. 'Jan 15, 2026'). */
  joinDate?: string;
  /** For mentors: whether they are accepting new mentees. */
  acceptingMentees?: boolean;
  /** For mentors: payout account details. */
  payoutAccount?: { type: 'bank' | 'instapay'; bankName?: string; accountNumber?: string; instapayNumber?: string };
  /** Notification preferences — stored as JSON array in profiles table. */
  notificationSettings?: { id: string; enabled: boolean }[];
  /** Rejection reason (set by admin when rejecting a mentor). */
  rejectionReason?: string;
  /** Whether mentor is featured on landing page (admin-set). */
  featured?: boolean;
  /** Primary expertise category (from admin-managed list). */
  expertiseCategory?: string;
  /** Soft-delete timestamp (null if not deleted). */
  deletedAt?: string;
}

