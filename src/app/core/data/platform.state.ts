import type { PlatformPaymentConfig } from '../models/dashboard.model';

export interface PlatformConfig {
  samplePrice: number;
  satisfactionRate: number;
  countries: number;
  defaultCardExpiry?: string;
  avgSessionRating?: string;
  payment: PlatformPaymentConfig;
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
    payment: {
      whatsappNumber: '201234567890',
      instapayId: 'mentorchief@instapay',
      bankName: 'CIB',
      bankAccountNumber: '1234567890123',
      bankAccountHolder: 'MentorChief Inc.',
    },
  },
};
