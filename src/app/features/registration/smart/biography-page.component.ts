import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { RegistrationFacade } from '../../../core/facades/registration.facade';
import { UserRole } from '../../../core/models/user.model';
import { ROUTES } from '../../../core/routes';

@Component({
  selector: 'mc-biography-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="bg-card border border-primary/20 rounded-lg overflow-hidden">
      <div class="p-6 border-b border-border">
        <h2 class="text-lg text-foreground">{{ isMentor ? 'Biography & Expertise' : 'About You' }}</h2>
        <p class="text-sm text-muted-foreground mt-1">{{ isMentor ? 'Share your professional story and areas of expertise' : 'Tell us about yourself and what you want to learn' }}</p>
      </div>
      <div class="p-6 space-y-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">{{ isMentor ? 'Professional Biography' : 'About Me' }} <span class="text-destructive">*</span></label>
          <textarea [(ngModel)]="bio" rows="6" [placeholder]="isMentor ? 'Tell us about your professional journey...' : 'Tell us about yourself and your goals...'" [class.border-destructive]="errors['bio']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"></textarea>
          <div class="flex justify-between items-center">
            <p class="text-xs text-muted-foreground">{{ bio.length }} / 500 characters (minimum 50)</p>
            @if (errors['bio']) { <p class="text-sm text-destructive">{{ errors['bio'] }}</p> }
          </div>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">{{ isMentor ? 'Skills' : 'Skills & Interests' }} <span class="text-destructive">*</span></label>
          <p class="text-xs text-muted-foreground">Press Enter to add skills</p>
          <input type="text" [(ngModel)]="skillInput" (keydown.enter)="addSkill($event)" placeholder="Type a skill and press Enter" [class.border-destructive]="errors['skills']" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          @if (errors['skills']) { <p class="text-sm text-destructive">{{ errors['skills'] }}</p> }
          @if (skills.length > 0) {
            <div class="flex flex-wrap gap-2 mt-3">
              @for (skill of skills; track skill) {
                <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm">{{ skill }}<button type="button" (click)="removeSkill(skill)" class="hover:text-primary"><fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /></button></span>
              }
            </div>
          }
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">{{ isMentor ? 'Tools & Technologies' : 'Tools & Technologies (Optional)' }}</label>
          <input type="text" [(ngModel)]="toolInput" (keydown.enter)="addTool($event)" placeholder="Type a tool and press Enter" class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          @if (tools.length > 0) {
            <div class="flex flex-wrap gap-2 mt-3">
              @for (tool of tools; track tool) {
                <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-sm">{{ tool }}<button type="button" (click)="removeTool(tool)" class="hover:text-foreground"><fa-icon [icon]="['fas', 'xmark']" class="w-3.5 h-3.5" /></button></span>
              }
            </div>
          }
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">LinkedIn profile <span class="text-muted-foreground font-normal">(optional)</span></label>
          @if (isMentor) {
            <p class="text-xs text-muted-foreground">Shown on your public mentor profile. Use your full LinkedIn profile URL.</p>
          } @else {
            <p class="text-xs text-muted-foreground">Optional. Use your full LinkedIn profile URL when you want it visible to mentors.</p>
          }
          <input
            type="url"
            [(ngModel)]="portfolioUrl"
            placeholder="https://www.linkedin.com/in/your-profile"
            class="w-full px-4 py-2.5 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
          />
        </div>
        <div class="flex justify-between pt-4">
          <button type="button" (click)="onBack()" class="py-2.5 px-5 border border-border text-foreground rounded-md hover:bg-muted transition-colors">Back</button>
          <button type="button" (click)="onNext()" class="py-2.5 px-5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">Next</button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiographyPageComponent {
  private readonly reg = inject(RegistrationFacade);
  private readonly router = inject(Router);

  isMentor = this.reg.data.role === UserRole.Mentor;
  bio = this.reg.data.bio;
  skills = [...this.reg.data.skills];
  tools = [...this.reg.data.tools];
  portfolioUrl = this.reg.data.portfolioUrl;
  skillInput = '';
  toolInput = '';
  errors: Record<string, string> = {};

  addSkill(event: Event): void {
    event.preventDefault();
    const v = this.skillInput.trim();
    if (v && !this.skills.some((s) => s.toLowerCase() === v.toLowerCase())) this.skills = [...this.skills, v];
    this.skillInput = '';
  }

  removeSkill(skill: string): void { this.skills = this.skills.filter((s) => s !== skill); }

  addTool(event: Event): void {
    event.preventDefault();
    const v = this.toolInput.trim();
    if (v && !this.tools.some((t) => t.toLowerCase() === v.toLowerCase())) this.tools = [...this.tools, v];
    this.toolInput = '';
  }

  removeTool(tool: string): void { this.tools = this.tools.filter((t) => t !== tool); }

  validate(): boolean {
    this.errors = {};
    if (!this.bio.trim()) this.errors['bio'] = 'Biography is required';
    else if (this.bio.trim().length < 50) this.errors['bio'] = 'Biography must be at least 50 characters';
    if (this.skills.length === 0) this.errors['skills'] = 'Add at least one skill';
    return Object.keys(this.errors).length === 0;
  }

  onBack(): void {
    this.reg.update({ bio: this.bio, skills: this.skills, tools: this.tools, portfolioUrl: this.portfolioUrl });
    this.reg.setStep(3);
    void this.router.navigate([ROUTES.registration.careerInfo]);
  }

  onNext(): void {
    if (this.validate()) {
      this.reg.update({ bio: this.bio, skills: this.skills, tools: this.tools, portfolioUrl: this.portfolioUrl });
      this.reg.setStep(5);
      void this.router.navigate([this.isMentor ? ROUTES.registration.preference : ROUTES.registration.preview]);
    }
  }
}
