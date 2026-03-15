import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import {
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated,
  selectAuthUser,
} from '../store/auth.selectors';
import { login } from '../store/auth.actions';
import type { LoginFormValue } from '../ui/login-form.component';
import { LoginFormComponent } from '../ui/login-form.component';
import { MentorApprovalStatus, UserRole } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';

@Component({
  selector: 'mc-login-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-background">
      <div class="w-full max-w-md">
        <mc-login-form
        [value]="formValue"
        [loading]="(loading$ | async) || false"
        [error]="(error$ | async) || null"
        (valueChange)="onFormValueChange($event)"
        (submitted)="onSubmitted($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);

  readonly loading$: Observable<boolean> = this.store.select(selectAuthLoading);
  readonly error$: Observable<string | null> = this.store.select(selectAuthError);
  private readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  private readonly user$ = this.store.select(selectAuthUser);

  formValue: LoginFormValue = {
    email: '',
    password: '',
  };

  ngOnInit(): void {
    this.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
      if (isAuth) {
        this.user$.pipe(take(1)).subscribe((user) => {
          if (user) {
            this.redirectToDashboard(user);
          }
        });
      }
    });
  }

  onFormValueChange(value: LoginFormValue): void {
    this.formValue = value;
  }

  onSubmitted(value: LoginFormValue): void {
    this.store.dispatch(
      login({
        payload: {
          email: value.email.trim(),
          password: value.password,
        },
      }),
    );
  }

  private redirectToDashboard(user: { role: UserRole; mentorApprovalStatus?: MentorApprovalStatus }): void {
    if (user.role === UserRole.Admin) {
      void this.router.navigate([ROUTES.admin.dashboard]);
    } else if (user.role === UserRole.Mentor) {
      const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Approved;
      if (status === MentorApprovalStatus.Pending) void this.router.navigate([ROUTES.mentor.pending]);
      else if (status === MentorApprovalStatus.Rejected) void this.router.navigate([ROUTES.mentor.rejected]);
      else void this.router.navigate([ROUTES.mentor.dashboard]);
    } else {
      void this.router.navigate([ROUTES.mentee.dashboard]);
    }
  }
}
