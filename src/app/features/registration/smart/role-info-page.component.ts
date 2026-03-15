import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import {
  selectRegistrationData,
  selectRegistrationCurrentStep,
} from '../store/registration.selectors';
import { updateData, setCurrentStep } from '../store/registration.actions';
import type { RegistrationData } from '../../../core/models/registration.model';
import { UserRole } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';
import { RoleInfoFormComponent } from '../ui/role-info-form.component';

@Component({
  selector: 'mc-role-info-page',
  standalone: true,
  imports: [CommonModule, RoleInfoFormComponent],
  template: `
    <mc-role-info-form
      [selectedRole]="(data$ | async)?.role ?? null"
      (roleChange)="onRoleChange($event)"
      (next)="onNext()"
    ></mc-role-info-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleInfoPageComponent {
  readonly data$: Observable<RegistrationData>;
  readonly currentStep$: Observable<number>;

  private selectedRole: UserRole.Mentee | UserRole.Mentor | null = null;

  constructor(
    private readonly store: Store<AppState>,
    private readonly router: Router,
  ) {
    this.data$ = this.store.select(selectRegistrationData);
    this.currentStep$ = this.store.select(selectRegistrationCurrentStep);
  }

  onRoleChange(role: UserRole.Mentee | UserRole.Mentor): void {
    this.selectedRole = role;
    this.store.dispatch(updateData({ updates: { role } }));
  }

  onNext(): void {
    if (this.selectedRole) {
      this.store.dispatch(setCurrentStep({ step: 2 }));
      void this.router.navigate([ROUTES.registration.personalInfo]);
    }
  }
}
