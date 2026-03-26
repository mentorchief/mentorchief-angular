import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import type { SignupFormValue } from '../ui/signup-form.component';
import { SignupFormComponent } from '../ui/signup-form.component';
import { UserRole } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';

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
          [loading]="(auth.loading$ | async) ?? false"
          [error]="(auth.error$ | async) ?? null"
          (valueChange)="onFormValueChange($event)"
          (submitted)="onSubmitted($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  formValue: SignupFormValue = { name: '', email: '', password: '', agreed: false };

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      if (!user.registered) void this.router.navigate([ROUTES.registration.roleInfo]);
      else this.auth['redirectAfterLogin'](user);
    }
  }

  onFormValueChange(value: SignupFormValue): void {
    this.formValue = value;
  }

  onSubmitted(value: SignupFormValue): void {
    this.auth.signup({
      name: value.name.trim(),
      email: value.email.trim(),
      password: value.password,
      role: UserRole.Mentee,
    }).subscribe({
      next: (user) => this.auth.signupSuccess(user),
      error: (err: Error) => this.auth.signupFailure(err.message),
    });
  }
}
