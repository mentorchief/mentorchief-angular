/** Derived view type for displaying an approved mentor on public pages. Built from User by selectApprovedMentorProfiles. */
export interface MentorProfile {
  id: string;
  name: string;
  /** From User.jobTitle */
  title: string;
  company: string;
  /** From User.skills */
  expertise: string[];
  /** Computed from store reviews */
  rating: number;
  /** Count of reviews from store */
  reviews: number;
  /** From User.mentorPlans[monthly].price */
  price: number;
  bio: string;
  /** From User.photoUrl */
  photoUrl: string;
  availability: string;
  sessions: number;
  responseTime: string;
  yearsOfExperience: number;
}
