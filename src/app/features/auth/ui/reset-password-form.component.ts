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

export interface PasswordRequirements {
  label: string;
  met: boolean;
}

@Component({
  selector: 'mc-reset-password-form',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="bg-card rounded-lg border border-border p-6 shadow-sm">
      @if (submitted) {
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-green-600"><fa-icon [icon]="['fas', 'check']" class="w-8 h-8" /></div>
          <p class="text-foreground text-sm mb-6">
            Your password has been successfully reset.
          </p>
          <a
            routerLink="/login"
            class="inline-block w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity no-underline text-center"
          >
            Sign In
          </a>
        </div>
      } @else {
        <form (submit)="onSubmit($event)" class="space-y-4">
          <div>
            <label class="block text-sm text-foreground mb-1.5">New Password</label>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [value]="password"
                (input)="passwordChange.emit(getInputValue($event))"
                placeholder="Enter new password"
                required
                class="w-full pl-4 pr-10 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          @if (password.length > 0 && requirements.length) {
            <div class="space-y-1.5">
              @for (req of requirements; track req.label) {
                <div class="flex items-center gap-2">
                  @if (req.met) {
                    <fa-icon [icon]="['fas', 'check']" class="text-green-600 w-3.5 h-3.5" />
                  } @else {
                    <fa-icon [icon]="['fas', 'circle']" class="text-muted-foreground w-3 h-3" />
                  }
                  <span [class]="req.met ? 'text-green-700 text-xs' : 'text-muted-foreground text-xs'">
                    {{ req.label }}
                  </span>
                </div>
              }
            </div>
          }

          <div>
            <label class="block text-sm text-foreground mb-1.5">Confirm Password</label>
            <div class="relative">
              <input
                [type]="showConfirm ? 'text' : 'password'"
                [value]="confirmPassword"
                (input)="confirmPasswordChange.emit(getInputValue($event))"
                placeholder="Confirm new password"
                required
                class="w-full pl-4 pr-10 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="button"
                (click)="showConfirm = !showConfirm"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {{ showConfirm ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          @if (error) {
            <div class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-red-700 text-sm">{{ error }}</p>
            </div>
          }

          <button
            type="submit"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Reset Password
          </button>
        </form>
      }
    </div>

    @if (!submitted) {
      <div class="text-center mt-6">
        <a
          routerLink="/login"
          class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground no-underline transition-colors"
        >
          Back to sign in
        </a>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordFormComponent {
  @Input() password = '';
  @Input() confirmPassword = '';
  @Input() requirements: PasswordRequirements[] = [];
  @Input() error: string | null = null;
  @Input() submitted = false;

  showPassword = false;
  showConfirm = false;

  @Output() passwordChange = new EventEmitter<string>();
  @Output() confirmPasswordChange = new EventEmitter<string>();
  @Output() submitRequest = new EventEmitter<void>();

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement)?.value ?? '';
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitRequest.emit();
  }
}
