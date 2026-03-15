/** Help center categories with article counts. Single source for help page. */
export interface HelpCategory {
  icon: [string, string];
  title: string;
  count: number;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { icon: ['fas', 'graduation-cap'], title: 'Getting Started', count: 12 },
  { icon: ['fas', 'dollar-sign'], title: 'Payments & Billing', count: 8 },
  { icon: ['fas', 'users'], title: 'Mentorship', count: 15 },
  { icon: ['fas', 'gear'], title: 'Account Settings', count: 6 },
];
