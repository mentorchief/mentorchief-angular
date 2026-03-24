import type { MentorPlan } from './user.model';

export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  rating: number;
  reviews: number;
  price: number;
  bio: string;
  image: string;
  availability: string;
  sessions: number;
  responseTime: string;
  yearsOfExperience: number;
  mentorPlans: MentorPlan[];
}

