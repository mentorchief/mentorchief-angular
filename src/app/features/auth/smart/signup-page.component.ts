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
import { signup } from '../store/auth.actions';
import type { SignupFormValue } from '../ui/signup-form.component';
import { SignupFormComponent } from '../ui/signup-form.component';

@Component({
  selector: 'mc-signup-page',
  standalone: true,
  imports: [CommonModule, SignupFormComponent],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-background">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span class="text-primary-foreground text-2xl font-bold">M</span>
          </div>
          <h1 class="text-2xl lg:text-3xl text-foreground">Create your account</h1>
          <p class="text-muted-foreground mt-2">Join Mentorchief and start growing</p>
        </div>

        <mc-signup-form
          [value]="formValue"
          [loading]="(loading$ | async) ?? false"
          [error]="(error$ | async) ?? null"
          (valueChange)="onFormValueChange($event)"
          (submitted)="onSubmitted($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupPageComponent implements OnInit {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);

  readonly loading$: Observable<boolean> = this.store.select(selectAuthLoading);
  readonly error$: Observable<string | null> = this.store.select(selectAuthError);
  private readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  private readonly user$ = this.store.select(selectAuthUser);

  formValue: SignupFormValue = {
    name: '',
    email: '',
    password: '',
    agreed: false,
  };

  ngOnInit(): void {
    this.isAuthenticated$.pipe(take(1)).subscribe((isAuth) => {
      if (isAuth) {
        this.user$.pipe(take(1)).subscribe((user) => {
          if (user) {
            if (!user.registered) {
              void this.router.navigate(['/auth/registration-steps/role-info']);
            } else {
              this.redirectToDashboard(user);
            }
          }
        });
      }
    });
  }

  onFormValueChange(value: SignupFormValue): void {
    this.formValue = value;
  }

  onSubmitted(value: SignupFormValue): void {
    this.store.dispatch(
      signup({
        payload: {
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
          role: 'mentee',
        },
      }),
    );
  }

  private redirectToDashboard(user: { role: string; mentorApprovalStatus?: string }): void {
    if (user.role === 'admin') {
      void this.router.navigate(['/dashboard/admin']);
    } else if (user.role === 'mentor') {
      const status = user.mentorApprovalStatus ?? 'approved';
      if (status === 'pending') void this.router.navigate(['/dashboard/mentor/pending']);
      else if (status === 'rejected') void this.router.navigate(['/dashboard/mentor/rejected']);
      else void this.router.navigate(['/dashboard/mentor']);
    } else {
      void this.router.navigate(['/dashboard/mentee']);
    }
  }
}
