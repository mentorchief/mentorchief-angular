export interface PlatformConfig {
  samplePrice: number;
  satisfactionRate: number;
  countries: number;
  defaultCardExpiry?: string;
  avgSessionRating?: string;
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
  },
};
