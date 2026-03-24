export interface PlatformConfig {
  samplePrice: number;
  satisfactionRate: number;
  countries: number;
  defaultCardExpiry?: string;
  avgSessionRating?: string;
  platformFeePercent?: number;
  escrowDays?: number;
  minSubscriptionPrice?: number;
  maxSubscriptionPrice?: number;
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
    platformFeePercent: 10,
    escrowDays: 30,
    minSubscriptionPrice: 50,
    maxSubscriptionPrice: 1000,
  },
};
