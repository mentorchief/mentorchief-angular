import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MentorApprovalStatus, UserRole, type User } from '../models/user.model';
import { UsersActions } from '../../store/users/users.actions';
import {
  selectAllUsers,
  selectApprovedMentors,
  selectPendingMentors,
  selectUserById,
} from '../../store/users/users.selectors';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private readonly store = inject(Store);

  readonly users$ = this.store.select(selectAllUsers);
  readonly pendingMentors$ = this.store.select(selectPendingMentors);
  readonly approvedMentors$ = this.store.select(selectApprovedMentors);

  getAll(): User[] {
    let list: User[] = [];
    this.store.select(selectAllUsers).subscribe((u) => (list = u)).unsubscribe();
    return list;
  }

  getById(id: string): User | null {
    let user: User | null = null;
    this.store
      .select(selectUserById(id))
      .subscribe((u) => (user = u))
      .unsubscribe();
    return user;
  }

  getByEmail(email: string): User | null {
    const lower = email.toLowerCase();
    return this.getAll().find((u) => u.email.toLowerCase() === lower) ?? null;
  }

  getByRole(role: UserRole): User[] {
    return this.getAll().filter((u) => u.role === role);
  }

  getApprovedMentors(): User[] {
    return this.getAll().filter(
      (u) =>
        u.role === UserRole.Mentor &&
        u.mentorApprovalStatus === MentorApprovalStatus.Approved &&
        u.status !== 'suspended',
    );
  }

  getPendingMentors(): User[] {
    return this.getAll().filter(
      (u) => u.role === UserRole.Mentor && u.mentorApprovalStatus === MentorApprovalStatus.Pending,
    );
  }

  addUser(user: User): void {
    this.store.dispatch(UsersActions.addUser({ user }));
  }

  /** Alias for admin UI that adds a user. */
  add(user: User): void {
    this.addUser(user);
  }

  updateUser(id: string, changes: Partial<User>): void {
    this.store.dispatch(UsersActions.updateUser({ id, changes }));
  }

  setStatus(id: string, status: 'active' | 'suspended'): void {
    this.store.dispatch(UsersActions.setStatus({ id, status }));
  }

  approveMentorRequest(userId: string): void {
    this.store.dispatch(UsersActions.approveMentorRequest({ userId }));
  }

  rejectMentorRequest(userId: string): void {
    this.store.dispatch(UsersActions.rejectMentorRequest({ userId }));
  }
}
