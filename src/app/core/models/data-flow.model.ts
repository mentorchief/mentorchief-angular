export type SubscriptionStatus =
  | 'pending_request'
  | 'active'
  | 'report_submitted'
  | 'admin_approved'
  | 'completed'
  | 'cancelled';

export type AdminApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationPersonalInfoRow {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  gender?: string;
}

export interface RegistrationCareerInfoRow {
  id: string;
  userId: string;
  jobTitle?: string;
  company?: string;
  yearsOfExperience?: string;
}

export interface RegistrationBiographyRow {
  id: string;
  userId: string;
  bio?: string;
  linkedin?: string;
}

export interface RegistrationExperienceRow {
  id: string;
  userId: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface MentorApplicationRow {
  id: string;
  userId: string;
  adminApprovalStatus: AdminApprovalStatus;
  approvalDate?: string;
}

export interface ReportRow {
  id: number;
  subscriptionId: string;
  mentorId: string;
  menteeId: string;
  overallRate?: number;
  adminApprovalStatus: AdminApprovalStatus;
  submittedAt: string;
  adminReviewedAt?: string;
  adminReviewerId?: string;
  adminReviewNote?: string;
}

export interface PaymentRow {
  id: string;
  subscriptionId: string;
  price: number;
  escrowed: boolean;
  status: 'in_escrow' | 'released' | 'refunded';
}

