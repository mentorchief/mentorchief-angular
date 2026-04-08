import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistrationFacade } from '../../../core/facades/registration.facade';
import { UserRole } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';
import { RoleInfoFormComponent } from '../ui/role-info-form.component';

@Component({
  selector: 'mc-role-info-page',
  standalone: true,
  imports: [CommonModule, RoleInfoFormComponent],
  template: `
    <mc-role-info-form
      [selectedRole]="reg.data.role"
      (roleChange)="onRoleChange($event)"
      (next)="onNext()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleInfoPageComponent {
  readonly reg = inject(RegistrationFacade);
  private readonly router = inject(Router);

  onRoleChange(role: UserRole.Mentee | UserRole.Mentor): void {
    this.reg.update({ role });
  }

  onNext(): void {
    if (this.reg.data.role) {
      this.reg.setStep(2);
      void this.router.navigate([ROUTES.registration.personalInfo]);
    }
  }
}
