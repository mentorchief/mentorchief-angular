import type { UserExperience, UserRole } from './user.model';

export type MentorPlanDuration = 'monthly' | 'quarterly' | '6months';

export interface MentorPlan {
  id: string;
  duration: MentorPlanDuration;
  /** Stored as string during registration; convert to number where needed. */
  price: string;
}

export type RegistrationRole = UserRole.Mentee | UserRole.Mentor | null;

export interface RegistrationData {
  role: RegistrationRole;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  gender: string;
  photo: string | null;
  jobTitle: string;
  company: string;
  yearsOfExperience: string;
  experiences: UserExperience[];
  bio: string;
  skills: string[];
  tools: string[];
  portfolioUrl: string;
  subscriptionCost: string;
  mentorPlans: MentorPlan[];
  menteeCapacity: string;
}

export interface RegistrationState {
  data: RegistrationData;
  currentStep: number;
  totalSteps: number;
}

