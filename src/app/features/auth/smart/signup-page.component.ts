import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../../../core/facades/auth.facade';
import type { SignupFormValue } from '../ui/signup-form.component';
import { SignupFormComponent } from '../ui/signup-form.component';
import { UserRole } from '../../../core/models/user.model';
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
  readonly auth = inject(AuthFacade);

  formValue: SignupFormValue = { name: '', email: '', password: '', agreed: false };

  ngOnInit(): void {
    this.auth.ensureGuestOrRedirectForSignup();
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
    });
  }
}
