/**
 * UI presentation config — never stored in NgRx state.
 * Maps domain data keys to icons, colors, CSS classes.
 */

export const MENTOR_STAT_DISPLAY: Record<string, { icon: [string, string]; bgColor: string; textColor: string }> = {
  'Active Mentees': { icon: ['fas', 'users'], bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'Monthly Revenue': { icon: ['fas', 'dollar-sign'], bgColor: 'bg-green-50', textColor: 'text-green-600' },
  'Total Earned': { icon: ['fas', 'wallet'], bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'Avg. Rating': { icon: ['fas', 'star'], bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
};

export const ADMIN_STAT_DISPLAY: Record<string, { icon: [string, string]; color: string }> = {
  'Total Users': { icon: ['fas', 'users'], color: 'text-blue-600' },
  'Active Mentors': { icon: ['fas', 'check'], color: 'text-green-600' },
  'Active Mentees': { icon: ['fas', 'users'], color: 'text-indigo-600' },
  'Monthly Revenue': { icon: ['fas', 'dollar-sign'], color: 'text-emerald-600' },
  'Active Sessions': { icon: ['fas', 'file-lines'], color: 'text-purple-600' },
  'Platform Growth': { icon: ['fas', 'chart-line'], color: 'text-amber-600' },
};

export const USER_GROWTH_COLORS: Record<string, string> = {
  Mentees: 'bg-blue-500',
  Mentors: 'bg-purple-500',
  Admins: 'bg-primary',
};

export const REPORT_ACTIVITY_DISPLAY: Record<number, { icon: [string, string]; iconBg: string }> = {
  1: { icon: ['fas', 'user'], iconBg: 'bg-blue-100' },
  2: { icon: ['fas', 'dollar-sign'], iconBg: 'bg-green-100' },
  3: { icon: ['fas', 'triangle-exclamation'], iconBg: 'bg-amber-100' },
  4: { icon: ['fas', 'check'], iconBg: 'bg-green-100' },
};
