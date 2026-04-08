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
  sessions: number;
  responseTime: string;
  yearsOfExperience: number;
  /** When set, public profile merges LinkedIn from this `User` in the store (settings stay in sync). */
  userId?: string;
  /** Fallback when no store user; browse / public profile link. */
  linkedin?: string;
}

