export interface PlatformConfig {
  samplePrice: number;
  satisfactionRate: number;
  countries: number;
  defaultCardExpiry?: string;
  avgSessionRating?: string;
  // General
  platformName?: string;
  tagline?: string;
  logoUrl?: string;
  adminWhatsapp?: string;
  currency?: string;
  // Financial
  platformFeePercent?: number;
  escrowDays?: number;
  minSubscriptionPrice?: number;
  maxSubscriptionPrice?: number;
  refundWindowDays?: number;
  // Limits
  mentorCapacityLimit?: number;
  paymentTimeoutHours?: number;
  requestExpiryDays?: number;
  reportDeadlineDays?: number;
  reportReminderDays?: number;
  maxAttachmentSizeMb?: number;
  // Security
  resetLinkExpiryMinutes?: number;
  resetLinkCooldownMinutes?: number;
  // Content
  priceRangeFilters?: { min: number; max: number; label: string }[];
  // Danger
  maintenanceMode?: boolean;
}

export interface PlatformState {
  config: PlatformConfig;
}

export const platformInitialState: PlatformState = {
  config: {
    samplePrice: 150,
    satisfactionRate: 98,
    countries: 50,
    defaultCardExpiry: '12/27',
    avgSessionRating: '4.8',
    // General
    platformName: 'MentorChief',
    tagline: '',
    adminWhatsapp: '',
    currency: 'USD',
    // Financial
    platformFeePercent: 10,
    escrowDays: 30,
    minSubscriptionPrice: 50,
    maxSubscriptionPrice: 1000,
    refundWindowDays: 3,
    // Limits
    mentorCapacityLimit: 5,
    paymentTimeoutHours: 24,
    requestExpiryDays: 5,
    reportDeadlineDays: 7,
    reportReminderDays: 3,
    maxAttachmentSizeMb: 30,
    // Security
    resetLinkExpiryMinutes: 10,
    resetLinkCooldownMinutes: 2,
  },
};
