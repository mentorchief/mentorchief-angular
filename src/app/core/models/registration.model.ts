export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export type MentorPlanDuration = 'monthly' | 'quarterly' | '6months';

export interface MentorPlan {
  id: string;
  duration: MentorPlanDuration;
  /** Stored as string during registration; convert to number where needed. */
  price: string;
}

import type { UserRole } from './user.model';

export type RegistrationRole = UserRole.Mentee | UserRole.Mentor | null;

export interface PayoutAccount {
  type: 'bank' | 'instapay';
  bankName?: string;
  accountNumber?: string;
  instapayNumber?: string;
}

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
  experiences: Experience[];
  bio: string;
  skills: string[];
  tools: string[];
  portfolioUrl: string;
  expertiseCategory: string;
  subscriptionCost: string;
  mentorPlans: MentorPlan[];
  availability: string[];
  menteeCapacity: string;
  payoutAccount: PayoutAccount | null;
}

export interface RegistrationState {
  data: RegistrationData;
  currentStep: number;
  totalSteps: number;
}

