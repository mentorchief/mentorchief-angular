import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mc-forgot-password-form',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="bg-card rounded-lg border border-border p-6 shadow-sm">
      @if (submitted) {
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-green-600"><fa-icon [icon]="['fas', 'check']" class="w-8 h-8" /></div>
          <p class="text-foreground text-sm mb-1">Reset link sent to</p>
          <p class="text-primary text-sm mb-6">{{ email }}</p>
          <div class="space-y-3">
            <p class="text-muted-foreground text-xs">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button
              type="button"
              (click)="sendAgain.emit()"
              class="text-sm text-primary hover:underline"
            >
              Send again
            </button>
          </div>
        </div>
      } @else {
        <form (submit)="onSubmit($event)" class="space-y-4">
          <div>
            <label class="block text-sm text-foreground mb-1.5">Email address</label>
            <input
              type="email"
              [value]="email"
              (input)="emailChange.emit(getInputValue($event))"
              placeholder="you@example.com"
              required
              class="w-full pl-4 pr-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Send Reset Link
          </button>
        </form>
      }
    </div>

    <div class="text-center mt-6">
      <a
        routerLink="/login"
        class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground no-underline transition-colors"
      >
        Back to sign in
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordFormComponent {
  @Input() email = '';
  @Input() submitted = false;

  @Output() emailChange = new EventEmitter<string>();
  @Output() submitRequest = new EventEmitter<string>();
  @Output() sendAgain = new EventEmitter<void>();

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement)?.value ?? '';
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitRequest.emit(this.email);
  }
}
