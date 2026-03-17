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
  price: number;
}

import type { UserRole } from './user.model';

export type RegistrationRole = UserRole.Mentee | UserRole.Mentor | null;

export interface RegistrationData {
  role: RegistrationRole;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  gender: string;
  photoUrl: string | null;
  jobTitle: string;
  company: string;
  yearsOfExperience: string;
  experiences: Experience[];
  bio: string;
  skills: string[];
  tools: string[];
  portfolioUrl: string;
  subscriptionCost: number;
  mentorPlans: MentorPlan[];
  availability: string[];
  menteeCapacity: string;
}

export interface RegistrationState {
  data: RegistrationData;
  currentStep: number;
  totalSteps: number;
}

