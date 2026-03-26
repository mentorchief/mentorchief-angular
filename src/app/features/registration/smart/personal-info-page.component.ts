import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import type { AppState } from '../../../store/app.state';
import { selectRegistrationData } from '../store/registration.selectors';
import { updateData, setCurrentStep } from '../store/registration.actions';
import { selectAuthUserId } from '../../auth/store/auth.selectors';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ROUTES } from '../../../core/routes';

interface PersonalFormData {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  gender: string;
  photo: string | null;
}

@Component({
  selector: 'mc-personal-info-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">Personal Information</h2>
        <p class="text-sm text-muted-foreground mt-1">Tell us about yourself</p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Profile Photo -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">Profile Photo</label>
          <div class="flex items-center gap-4">
            @if (photoPreview) {
              <img [src]="photoPreview" alt="Preview" class="w-20 h-20 rounded-lg object-cover shrink-0" />
            } @else {
              <div class="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <span class="text-muted-foreground text-sm">No photo</span>
              </div>
            }
            <div>
              <label
                class="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm cursor-pointer hover:opacity-90 transition-opacity">
                {{ uploading ? 'Uploading...' : 'Choose Photo' }}
                <input type="file" accept="image/jpeg,image/png" (change)="onPhotoSelected($event)" class="hidden" [disabled]="uploading" />
              </label>
              <p class="text-xs text-muted-foreground mt-1">JPG or PNG, max 10 MB</p>
              @if (photoError) {
                <p class="text-sm text-destructive mt-1">{{ photoError }}</p>
              }
            </div>
          </div>
        </div>

        <!-- Name Fields -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="firstName" class="block text-sm font-medium text-foreground">
              First Name <span class="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              autocomplete="given-name"
              [(ngModel)]="formData.firstName"
              placeholder="John"
              [class.border-destructive]="errors['firstName']"
              class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            />
            @if (errors['firstName']) {
              <p class="text-sm text-destructive">{{ errors['firstName'] }}</p>
            }
          </div>
          <div class="space-y-2">
            <label for="lastName" class="block text-sm font-medium text-foreground">
              Last Name <span class="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              autocomplete="family-name"
              [(ngModel)]="formData.lastName"
              placeholder="Doe"
              [class.border-destructive]="errors['lastName']"
              class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            />
            @if (errors['lastName']) {
              <p class="text-sm text-destructive">{{ errors['lastName'] }}</p>
            }
          </div>
        </div>

        <!-- Phone -->
        <div class="space-y-2">
          <label for="phone" class="block text-sm font-medium text-foreground">
            Phone Number <span class="text-destructive">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            autocomplete="tel"
            [(ngModel)]="formData.phone"
            placeholder="+1 (555) 000-0000"
            [class.border-destructive]="errors['phone']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
          @if (errors['phone']) {
            <p class="text-sm text-destructive">{{ errors['phone'] }}</p>
          }
        </div>

        <!-- Location -->
        <div class="space-y-2">
          <label for="location" class="block text-sm font-medium text-foreground">
            Country <span class="text-destructive">*</span>
          </label>
          <select
            id="location"
            name="location"
            autocomplete="country-name"
            [(ngModel)]="formData.location"
            [class.border-destructive]="errors['location']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          >
            <option value="">Select country</option>
            @for (country of countries; track country) {
              <option [value]="country">{{ country }}</option>
            }
          </select>
          @if (errors['location']) {
            <p class="text-sm text-destructive">{{ errors['location'] }}</p>
          }
        </div>

        <!-- Gender -->
        <div class="space-y-2">
          <label for="gender" class="block text-sm font-medium text-foreground">
            Gender <span class="text-destructive">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            [(ngModel)]="formData.gender"
            [class.border-destructive]="errors['gender']"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
          @if (errors['gender']) {
            <p class="text-sm text-destructive">{{ errors['gender'] }}</p>
          }
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between pt-4">
          <button
            type="button"
            (click)="onBack()"
            class="py-2.5 px-5 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            (click)="onNext()"
            class="py-2.5 px-5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfoPageComponent {
  private readonly store = inject(Store<AppState>);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  formData: PersonalFormData = {
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    gender: '',
    photo: null,
  };

  errors: Record<string, string> = {};
  photoPreview: string | null = null;
  photoError = '';
  uploading = false;
  private userId: string | null = null;

  readonly countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'India', 'Japan', 'Brazil', 'Netherlands', 'Singapore',
    'Sweden', 'Switzerland', 'Spain', 'Italy', 'South Korea', 'China',
    'Mexico', 'Indonesia', 'Poland', 'Turkey', 'Nigeria', 'Egypt',
    'South Africa', 'Kenya', 'Argentina', 'Chile', 'Colombia', 'Other'
  ];

  constructor() {
    this.store.select(selectAuthUserId).pipe(take(1)).subscribe((id) => {
      this.userId = id;
    });
    this.store.select(selectRegistrationData).pipe(take(1)).subscribe((data) => {
      this.formData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        location: data.location,
        gender: data.gender,
        photo: data.photo,
      };
      if (this.formData.photo) {
        this.photoPreview = this.formData.photo;
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoError = '';

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.photoError = 'Only JPG and PNG files are allowed.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.photoError = 'File must be under 10 MB.';
      return;
    }
    if (!this.userId) {
      this.photoError = 'User not found. Please try again.';
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    this.uploading = true;
    this.authApi.uploadProfilePhoto(this.userId, file).pipe(take(1)).subscribe({
      next: (url) => {
        this.formData.photo = url;
        this.store.dispatch(updateData({ updates: { photo: url } }));
        this.uploading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.photoError = 'Upload failed. Please try again.';
        this.uploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.formData.firstName.trim()) this.errors['firstName'] = 'First name is required';
    if (!this.formData.lastName.trim()) this.errors['lastName'] = 'Last name is required';
    if (!this.formData.phone.trim()) this.errors['phone'] = 'Phone number is required';
    if (!this.formData.location) this.errors['location'] = 'Location is required';
    if (!this.formData.gender) this.errors['gender'] = 'Gender is required';
    return Object.keys(this.errors).length === 0;
  }

  onBack(): void {
    this.store.dispatch(updateData({ updates: this.formData }));
    this.store.dispatch(setCurrentStep({ step: 1 }));
    void this.router.navigate([ROUTES.registration.roleInfo]);
  }

  onNext(): void {
    if (this.validate()) {
      this.store.dispatch(updateData({ updates: this.formData }));
      this.store.dispatch(setCurrentStep({ step: 3 }));
      void this.router.navigate([ROUTES.registration.careerInfo]);
    }
  }
}
