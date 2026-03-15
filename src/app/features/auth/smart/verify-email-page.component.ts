import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerifyEmailFormComponent } from '../ui/verify-email-form.component';

@Component({
  selector: 'mc-verify-email-page',
  standalone: true,
  imports: [CommonModule, VerifyEmailFormComponent],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 text-white text-2xl">M</div>
          <h1 class="text-2xl text-foreground">
            {{ verified ? 'Email verified' : 'Verify your email' }}
          </h1>
          <p class="text-muted-foreground mt-1 max-w-sm mx-auto">
            {{ verified
              ? 'Your email address has been successfully verified. You can now access your Mentorchief account.'
              : "We've sent a 6-digit verification code to your email address. Enter the code below to verify your account." }}
          </p>
        </div>

        <mc-verify-email-form
          [code]="code"
          [email]="mockEmail"
          [error]="error"
          [verified]="verified"
          [resent]="resent"
          (codeChange)="code = $event; error = null"
          (resend)="onResend()"
          (verifiedChange)="onVerified()"
        ></mc-verify-email-form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPageComponent {
  code: string[] = ['', '', '', '', '', ''];
  readonly mockEmail = 'user@example.com';
  error: string | null = null;
  verified = false;
  resent = false;

  onResend(): void {
    this.resent = true;
    this.code = ['', '', '', '', '', ''];
    this.error = null;
    setTimeout(() => (this.resent = false), 3000);
  }

  onVerified(): void {
    this.verified = true;
  }
}
