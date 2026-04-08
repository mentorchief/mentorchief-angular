import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../../../core/facades/auth.facade';
import type { LoginFormValue } from '../ui/login-form.component';
import { LoginFormComponent } from '../ui/login-form.component';

@Component({
  selector: 'mc-login-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-background">
      <div class="w-full max-w-md">
        <mc-login-form
          [value]="formValue"
          [loading]="(auth.loading$ | async) || false"
          [error]="(auth.error$ | async) || null"
          (valueChange)="onFormValueChange($event)"
          (submitted)="onSubmitted($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  readonly auth = inject(AuthFacade);

  formValue: LoginFormValue = { email: '', password: '' };

  ngOnInit(): void {
    this.auth.ensureGuestOrRedirectForLogin();
  }

  onFormValueChange(value: LoginFormValue): void {
    this.formValue = value;
  }

  onSubmitted(value: LoginFormValue): void {
    this.auth.login({ email: value.email.trim(), password: value.password });
  }
}
