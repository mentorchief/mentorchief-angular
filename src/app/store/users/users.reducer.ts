import { createReducer, on } from '@ngrx/store';
import { usersAdapter } from './users.state';
import {
  addUser,
  loadUsers,
  resetUsers,
  setMentorApprovalStatus,
  updateUserProfile,
  updateUserStatus,
} from './users.actions';
import { usersInitialState } from './users.state';
import { MentorApprovalStatus, UserRole, type User } from '../../core/models/user.model';

const initialUsers: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'mentee@demo.com', password: 'password123', role: UserRole.Mentee, avatar: 'AJ', registered: true, status: 'active', joinDate: 'Feb 1, 2026', phone: '15551234568' },
  { id: '2', name: 'Sarah Chen', email: 'mentor@demo.com', password: 'password123', role: UserRole.Mentor, avatar: 'SC', registered: true, mentorApprovalStatus: MentorApprovalStatus.Approved, status: 'active', joinDate: 'Jan 15, 2026', phone: '15551234567' },
  { id: '3', name: 'Admin User', email: 'admin@mentorchief.com', password: 'admin2026', role: UserRole.Admin, avatar: 'AD', registered: true, status: 'active', joinDate: 'Jan 1, 2026' },
  { id: '4', name: 'Marcus Williams', email: 'marcus.williams@example.com', password: 'password123', role: UserRole.Mentor, avatar: 'MW', registered: true, mentorApprovalStatus: MentorApprovalStatus.Pending, status: 'active', joinDate: 'Mar 10, 2026', jobTitle: 'Senior Product Manager', company: 'TechCorp', bio: '10+ years in product management.', yearsOfExperience: '10', skills: ['Product Strategy', 'Roadmapping', 'Stakeholder Management'], linkedin: 'https://linkedin.com/in/marcuswilliams', phone: '+1 555 123 4567', location: 'San Francisco, CA' },
  { id: '5', name: 'Priya Sharma', email: 'priya.sharma@example.com', password: 'password123', role: UserRole.Mentor, avatar: 'PS', registered: true, mentorApprovalStatus: MentorApprovalStatus.Pending, status: 'active', joinDate: 'Mar 12, 2026', jobTitle: 'Engineering Lead', company: 'StartupXYZ', bio: 'Former FAANG engineer turned startup lead.', yearsOfExperience: '8', skills: ['System Design', 'Backend', 'Leadership'], portfolioUrl: 'https://priyasharma.dev', phone: '+1 555 987 6543', location: 'New York, NY' },
  { id: '6', name: 'David Kim', email: 'david.kim@example.com', password: 'password123', role: UserRole.Mentor, avatar: 'DK', registered: true, mentorApprovalStatus: MentorApprovalStatus.Pending, status: 'active', joinDate: 'Mar 14, 2026', jobTitle: 'UX Design Director', company: 'Design Studio', bio: 'Design leader with 12 years of experience.', yearsOfExperience: '12', skills: ['UX Research', 'Design Systems', 'User Testing'], linkedin: 'https://linkedin.com/in/davidkimux', portfolioUrl: 'https://davidkim.design', location: 'Austin, TX' },
  { id: '7', name: 'Emma Wilson', email: 'emma@example.com', password: 'password123', role: UserRole.Mentee, avatar: 'EW', registered: true, status: 'active', joinDate: 'Jan 15, 2026' },
  { id: '8', name: 'Michael Brown', email: 'michael@example.com', password: 'password123', role: UserRole.Mentee, avatar: 'MB', registered: true, status: 'active', joinDate: 'Mar 1, 2026' },
  { id: '9', name: 'David Lee', email: 'david.lee@example.com', password: 'password123', role: UserRole.Mentor, avatar: 'DL', registered: true, mentorApprovalStatus: MentorApprovalStatus.Approved, status: 'active', joinDate: 'Jan 10, 2026' },
  { id: '10', name: 'Sophie Lee', email: 'sophie@example.com', password: 'password123', role: UserRole.Mentee, avatar: 'SL', registered: true, status: 'active', joinDate: 'Dec 1, 2025' },
];

const initialState = usersAdapter.addMany(initialUsers, usersInitialState);

export const usersReducer = createReducer(
  initialState,
  on(loadUsers, (state, { users }) => usersAdapter.setAll(users, usersInitialState)),
  on(addUser, (state, { user }) =>
    usersAdapter.addOne(
      { ...user, status: user.status ?? 'active', joinDate: user.joinDate ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
      state,
    ),
  ),
  on(updateUserStatus, (state, { userId, status }) =>
    usersAdapter.updateOne({ id: userId, changes: { status } }, state),
  ),
  on(setMentorApprovalStatus, (state, { userId, mentorApprovalStatus }) =>
    usersAdapter.updateOne({ id: userId, changes: { mentorApprovalStatus } }, state),
  ),
  on(updateUserProfile, (state, { userId, updates }) =>
    usersAdapter.updateOne({ id: userId, changes: updates }, state),
  ),
  on(resetUsers, () => initialState),
);
