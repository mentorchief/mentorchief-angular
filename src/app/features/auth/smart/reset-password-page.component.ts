import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { PasswordRequirements } from '../ui/reset-password-form.component';
import { ResetPasswordFormComponent } from '../ui/reset-password-form.component';

@Component({
  selector: 'mc-reset-password-page',
  standalone: true,
  imports: [CommonModule, ResetPasswordFormComponent],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 text-white text-2xl">M</div>
          <h1 class="text-2xl text-foreground">
            {{ submitted ? 'Password reset' : 'Set a new password' }}
          </h1>
          <p class="text-muted-foreground mt-1 max-w-sm mx-auto">
            {{ submitted
              ? 'Your password has been successfully updated. You can now sign in with your new password.'
              : 'Your new password must be different from previously used passwords.' }}
          </p>
        </div>

        <mc-reset-password-form
          [password]="password"
          [confirmPassword]="confirmPassword"
          [requirements]="passwordRequirements"
          [error]="error"
          [submitted]="submitted"
          (passwordChange)="password = $event; error = null"
          (confirmPasswordChange)="confirmPassword = $event; error = null"
          (submitRequest)="onSubmit()"
        ></mc-reset-password-form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent {
  password = '';
  confirmPassword = '';
  error: string | null = null;
  submitted = false;

  get passwordRequirements(): PasswordRequirements[] {
    return [
      { label: 'At least 8 characters', met: this.password.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(this.password) },
      { label: 'One lowercase letter', met: /[a-z]/.test(this.password) },
      { label: 'One number', met: /\d/.test(this.password) },
    ];
  }

  get allMet(): boolean {
    return this.passwordRequirements.every((r) => r.met);
  }

  onSubmit(): void {
    this.error = null;
    if (!this.allMet) {
      this.error = 'Please meet all password requirements.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.submitted = true;
  }
}
