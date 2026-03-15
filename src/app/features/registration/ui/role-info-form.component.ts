import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import type { RegistrationRole } from '../../../core/models/registration.model';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'mc-role-info-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="border border-primary/20 rounded-lg overflow-hidden">
        <div class="p-6 border-b border-border">
          <h2 class="text-lg font-semibold text-foreground">Choose Your Role</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Select whether you want to be a mentor or mentee on Mentorchief
          </p>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              (click)="roleChange.emit(UserRole.Mentee)"
              [class]="selectedRole === UserRole.Mentee
                ? 'border-primary bg-accent'
                : 'border-border bg-card'"
              class="p-6 rounded-lg border-2 transition-all text-left hover:border-primary/50"
            >
              <div class="flex flex-col items-center text-center space-y-3">
                <div
                  [class]="selectedRole === UserRole.Mentee
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'"
                  class="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                >
                  G
                </div>
                <div>
                  <h3 class="mb-2 font-medium">I'm a Mentee</h3>
                  <p class="text-sm text-muted-foreground">
                    Looking for guidance and mentorship to grow my career and skills
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              (click)="roleChange.emit(UserRole.Mentor)"
              [class]="selectedRole === UserRole.Mentor
                ? 'border-primary bg-accent'
                : 'border-border bg-card'"
              class="p-6 rounded-lg border-2 transition-all text-left hover:border-primary/50"
            >
              <div class="flex flex-col items-center text-center space-y-3">
                <div
                  [class]="selectedRole === UserRole.Mentor
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'"
                  class="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                >
                  M
                </div>
                <div>
                  <h3 class="mb-2 font-medium">I'm a Mentor</h3>
                  <p class="text-sm text-muted-foreground">
                    Ready to share my expertise and help others succeed in their careers
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div class="pt-4 flex justify-end">
            <button
              type="button"
              (click)="next.emit()"
              [disabled]="!selectedRole"
              class="min-w-32 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleInfoFormComponent {
  readonly UserRole = UserRole;
  @Input() selectedRole: RegistrationRole = null;

  @Output() roleChange = new EventEmitter<UserRole.Mentee | UserRole.Mentor>();
  @Output() next = new EventEmitter<void>();
}
