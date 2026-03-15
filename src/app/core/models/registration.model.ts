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

export interface RegistrationData {
  role: 'mentee' | 'mentor' | null;
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
  subscriptionCost: string;
  mentorPlans: MentorPlan[];
  availability: string[];
  menteeCapacity: string;
}

export interface RegistrationState {
  data: RegistrationData;
  currentStep: number;
  totalSteps: number;
}

