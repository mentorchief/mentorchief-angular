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

export interface SignupFormValue {
  name: string;
  email: string;
  password: string;
  agreed: boolean;
}

@Component({
  selector: 'mc-signup-form',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="bg-card rounded-lg border border-border p-6 shadow-sm">
      <form (submit)="onSubmitInternal($event)" class="space-y-5">
        <div class="space-y-2">
          <label for="signup-name" class="block text-sm font-medium text-foreground">Full Name</label>
          <input
            type="text"
            id="signup-name"
            name="name"
            autocomplete="name"
            [value]="value.name"
            (input)="onFieldChange('name', getInputValue($event))"
            placeholder="John Doe"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label for="signup-email" class="block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            id="signup-email"
            name="email"
            autocomplete="email"
            [value]="value.email"
            (input)="onFieldChange('email', getInputValue($event))"
            placeholder="you@example.com"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label for="signup-password" class="block text-sm font-medium text-foreground">Password</label>
          <div class="relative">
            <input
              [type]="showPassword ? 'text' : 'password'"
              id="signup-password"
              name="password"
              autocomplete="new-password"
              [value]="value.password"
              (input)="onFieldChange('password', getInputValue($event))"
              placeholder="Min. 8 characters"
              class="w-full px-4 py-2.5 pr-16 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            />
            <button
              type="button"
              (click)="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground">
            Must be at least 8 characters with 1 uppercase and 1 number
          </p>
        </div>

        <label for="signup-agreed" class="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            id="signup-agreed"
            name="agreed"
            class="w-4 h-4 accent-primary rounded mt-0.5 border-border"
            [checked]="value.agreed"
            (change)="onFieldChange('agreed', agreedCheckbox($event))"
          />
          <span class="text-sm text-muted-foreground leading-snug">
            I agree to the
            <a routerLink="/terms" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline no-underline">Terms of Service</a>
            and
            <a routerLink="/privacy" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline no-underline">Privacy Policy</a>
          </span>
        </label>

        @if (error) {
          <div class="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {{ error }}
          </div>
        }

        <button
          type="submit"
          class="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          [disabled]="loading || !isFormValid()"
        >
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="px-3 bg-card text-muted-foreground text-sm">or continue with</span>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <button type="button" class="w-full py-2.5 border border-border rounded-md text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium">
          <fa-icon [icon]="['fab', 'google']" class="w-5 h-5" />
          Continue with Google
        </button>
        <button type="button" class="w-full py-2.5 bg-[#0A66C2] text-white rounded-md hover:bg-[#004182] transition-colors flex items-center justify-center gap-2 font-medium">
          <fa-icon [icon]="['fab', 'linkedin']" class="w-5 h-5" />
          Continue with LinkedIn
        </button>
      </div>
    </div>

    <p class="text-center text-muted-foreground text-sm mt-6">
      Already have an account?
      <a routerLink="/login" class="text-primary no-underline hover:underline">Sign in</a>
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupFormComponent {
  @Input() value: SignupFormValue = {
    name: '',
    email: '',
    password: '',
    agreed: false,
  };

  @Input() error: string | null = null;
  @Input() loading = false;

  showPassword = false;

  @Output() submitted = new EventEmitter<SignupFormValue>();
  @Output() valueChange = new EventEmitter<SignupFormValue>();

  getInputValue(event: Event): string {
    const el = event.target as HTMLInputElement;
    return el?.value ?? '';
  }

  agreedCheckbox(event: Event): boolean {
    const el = event.target as HTMLInputElement;
    return el?.checked ?? false;
  }

  onFieldChange<K extends keyof SignupFormValue>(
    key: K,
    fieldValue: SignupFormValue[K],
  ): void {
    const next: SignupFormValue = {
      ...this.value,
      [key]: fieldValue,
    };
    this.valueChange.emit(next);
  }

  isFormValid(): boolean {
    return (
      this.value.name.trim().length >= 2 &&
      this.value.email.includes('@') &&
      this.value.password.length >= 8 &&
      this.value.agreed
    );
  }

  onSubmitInternal(event: Event): void {
    event.preventDefault();
    if (this.isFormValid()) {
      this.submitted.emit(this.value);
    }
  }
}
