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
  selector: 'mc-verify-email-form',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="bg-card rounded-lg border border-border p-6 shadow-sm">
      @if (verified) {
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-green-600"><fa-icon [icon]="['fas', 'check']" class="w-8 h-8" /></div>
          <p class="text-foreground text-sm mb-6">
            Welcome to Mentorchief! Your account is now active.
          </p>
          <a
            routerLink="/login"
            class="inline-block w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity no-underline text-center"
          >
            Continue to Sign In
          </a>
        </div>
      } @else {
        <div class="flex items-center gap-2 p-3 bg-muted/50 rounded-md mb-6">
          <span class="text-sm text-foreground truncate">{{ email }}</span>
        </div>

        <div class="flex justify-center gap-2.5 mb-6" (paste)="onPaste($event)">
          @for (digit of code; track $index; let i = $index) {
            <input
              #inputRef
              type="text"
              inputmode="numeric"
              maxlength="1"
              [value]="digit"
              (input)="onDigitInput(i, getInputValue($event))"
              (keydown)="onKeyDown(i, $event)"
              [class.border-red-300]="error"
              class="w-12 h-14 text-center text-xl bg-input-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all border-border"
            />
          }
        </div>

        @if (error) {
          <div class="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <p class="text-red-700 text-sm text-center">{{ error }}</p>
          </div>
        }

        <div class="text-center">
          <p class="text-muted-foreground text-sm mb-2">Didn't receive the code?</p>
          <button
            type="button"
            (click)="resend.emit()"
            [disabled]="resent || resendCooldown > 0"
            [class]="resent || resendCooldown > 0 ? 'text-green-600 cursor-default' : 'text-primary hover:underline'"
            class="inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            {{ resent ? 'Code resent' : (resendCooldown > 0 ? 'Resend in ' + resendCooldown + 's' : 'Resend code') }}
          </button>
        </div>
      }
    </div>

    @if (!verified) {
      <div class="text-center mt-6">
        <p class="text-muted-foreground text-xs">
          Having trouble? <span class="text-primary cursor-pointer hover:underline">Contact support</span>
        </p>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailFormComponent {
  @Input() code: readonly string[] = ['', '', '', '', '', ''];
  @Input() email = 'user@example.com';
  @Input() error: string | null = null;
  @Input() verified = false;
  @Input() resent = false;
  @Input() resendCooldown = 0;

  @Output() codeChange = new EventEmitter<string[]>();
  @Output() resend = new EventEmitter<void>();
  @Output() verifiedChange = new EventEmitter<void>();

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement)?.value ?? '';
  }

  onDigitInput(index: number, value: string): void {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...this.code];
    newCode[index] = value.slice(-1);
    this.codeChange.emit(newCode);
    if (value && index < 5) {
      this.focusInput(index + 1);
    }
    if (newCode.every((d) => d !== '')) {
      this.verifiedChange.emit();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.code[index] && index > 0) {
      this.focusInput(index - 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = [...this.code];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newCode[i] = pasted[i];
    }
    this.codeChange.emit(newCode);
    if (newCode.every((d) => d !== '')) {
      this.verifiedChange.emit();
    }
  }

  private focusInput(index: number): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('mc-verify-email-form input[type="text"]');
    const el = inputs[index];
    el?.focus();
  }
}
