import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

export interface LoginFormValue {
  email: string;
  password: string;
}

@Component({
  selector: 'mc-login-form',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="w-full max-w-md mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-2xl lg:text-3xl text-foreground">Welcome back</h1>
        <p class="text-muted-foreground mt-2">Sign in to your Mentorchief account</p>
      </div>

      <form (submit)="onSubmitInternal($event)" class="space-y-5">
        <div class="space-y-2">
          <label for="login-email" class="block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            id="login-email"
            name="email"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            [value]="value.email"
            (input)="onEmailInput($event)"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div class="space-y-2">
          <label for="login-password" class="block text-sm font-medium text-foreground">Password</label>
          <input
            type="password"
            id="login-password"
            name="password"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            [value]="value.password"
            (input)="onPasswordInput($event)"
            autocomplete="current-password"
            placeholder="Enter your password"
          />
        </div>

        @if (error) {
          <div class="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {{ error }}
          </div>
        }

        <button
          type="submit"
          class="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          [disabled]="loading"
        >
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="px-3 bg-background text-muted-foreground text-sm">or continue with</span>
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

        <p class="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?
          <a routerLink="/signup" class="text-primary hover:underline no-underline">Sign up</a>
        </p>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  @Input() value: LoginFormValue = {
    email: '',
    password: '',
  };

  @Input() error: string | null = null;
  @Input() loading = false;

  @Output() submitted = new EventEmitter<LoginFormValue>();
  @Output() valueChange = new EventEmitter<LoginFormValue>();

  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.onFieldChange('email', value);
  }

  onPasswordInput(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.onFieldChange('password', value);
  }

  private onFieldChange<K extends keyof LoginFormValue>(key: K, fieldValue: LoginFormValue[K]): void {
    const next: LoginFormValue = {
      ...this.value,
      [key]: fieldValue,
    };
    this.valueChange.emit(next);
  }

  onSubmitInternal(event: Event): void {
    event.preventDefault();
    this.submitted.emit(this.value);
  }
}
