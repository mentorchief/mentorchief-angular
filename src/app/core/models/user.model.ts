export type UserRole = 'mentee' | 'mentor' | 'admin';

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
  password: string;
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
  mentorApprovalStatus?: 'pending' | 'approved' | 'rejected';
  /** Platform-level status (admin suspend/activate). Default 'active'. */
  status?: 'active' | 'suspended' | 'pending';
  /** Display join date (e.g. 'Jan 15, 2026'). */
  joinDate?: string;
}

