import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForgotPasswordFormComponent } from '../ui/forgot-password-form.component';

@Component({
  selector: 'mc-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ForgotPasswordFormComponent],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 text-white text-2xl">M</div>
          <h1 class="text-2xl text-foreground">
            {{ submitted ? 'Check your email' : 'Forgot your password?' }}
          </h1>
          <p class="text-muted-foreground mt-1 max-w-sm mx-auto">
            {{ submitted
              ? "We've sent a password reset link to your email address. Please check your inbox."
              : "Enter the email address associated with your account and we'll send you a link to reset your password." }}
          </p>
        </div>

        <mc-forgot-password-form
          [email]="email"
          [submitted]="submitted"
          (emailChange)="email = $event"
          (submitRequest)="onSubmit($event)"
          (sendAgain)="submitted = false"
        ></mc-forgot-password-form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent {
  email = '';
  submitted = false;

  onSubmit(value: string): void {
    if (value.trim()) {
      this.email = value.trim();
      this.submitted = true;
    }
  }
}
