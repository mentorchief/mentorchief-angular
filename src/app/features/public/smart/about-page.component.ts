import { PlatformFacade } from '../../../core/facades/platform.facade';
import { UsersFacade } from '../../../core/facades/users.facade';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs';
import { UserRole, MentorApprovalStatus } from '../../../core/models/user.model';

@Component({
  selector: 'mc-about-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-primary/[0.04] to-white py-20 lg:py-28">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl lg:text-5xl text-foreground">About Mentorchief</h1>
        <p class="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
          We're on a mission to democratize access to world-class mentorship and help professionals reach their full potential.
        </p>
      </div>
    </section>

    <!-- Our Story -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl text-foreground mb-6">Our Story</h2>
            <div class="space-y-4 text-muted-foreground">
              <p>
                Mentorchief was born from a simple observation: the most successful professionals all had one thing in common—great mentors who guided them along the way.
              </p>
              <p>
                Yet finding quality mentorship remained difficult. Either you knew the right people, or you didn't. We set out to change that by creating a platform where anyone can connect with industry-leading mentors.
              </p>
              <p>
                Our escrow-based payment system ensures both parties are protected, making mentorship accessible, affordable, and trustworthy.
              </p>
            </div>
          </div>
          <div class="relative">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600"
              alt="Team collaboration"
              class="rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="py-20 bg-muted/30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl text-foreground">Our Values</h2>
          <p class="text-muted-foreground mt-3">The principles that guide everything we do</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          @for (value of values; track value.title) {
            <div class="bg-card rounded-lg border border-border p-6">
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <fa-icon [icon]="value.icon" class="text-2xl w-6 h-6" />
              </div>
              <h3 class="text-foreground font-medium mb-2">{{ value.title }}</h3>
              <p class="text-muted-foreground text-sm">{{ value.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        @if (platformData$ | async; as data) {
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div class="text-4xl lg:text-5xl text-primary font-serif">{{ data.total }}+</div>
              <div class="text-muted-foreground mt-2">Active Users</div>
            </div>
            <div>
              <div class="text-4xl lg:text-5xl text-primary font-serif">{{ data.mentors }}+</div>
              <div class="text-muted-foreground mt-2">Expert Mentors</div>
            </div>
            <div>
              <div class="text-4xl lg:text-5xl text-primary font-serif">{{ data.satisfactionRate }}%</div>
              <div class="text-muted-foreground mt-2">Satisfaction Rate</div>
            </div>
            <div>
              <div class="text-4xl lg:text-5xl text-primary font-serif">{{ data.countries }}+</div>
              <div class="text-muted-foreground mt-2">Countries</div>
            </div>
          </div>
        }
      </div>
    </section>

    <!-- Team -->
    <section class="py-20 bg-muted/30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl text-foreground">Our Team</h2>
          <p class="text-muted-foreground mt-3">The people building the future of mentorship</p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (member of team; track member.name) {
            <div class="bg-card rounded-lg border border-border p-6 text-center">
              <div class="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-secondary-foreground text-xl font-medium">{{ getInitials(member.name) }}</span>
              </div>
              <h4 class="text-foreground font-medium">{{ member.name }}</h4>
              <p class="text-muted-foreground text-sm">{{ member.role }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 bg-primary">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl text-white">Join Our Community</h2>
        <p class="text-white/70 mt-4">Be part of something bigger. Start your mentorship journey today.</p>
        <div class="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <a routerLink="/signup" class="px-8 py-3 bg-white text-primary rounded-lg hover:bg-white/90 no-underline font-medium">
            Get Started
          </a>
          <a routerLink="/browse" class="px-8 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 no-underline">
            Browse Mentors
          </a>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  private readonly platformSvc = inject(PlatformFacade);
  private readonly userSvc = inject(UsersFacade);
  readonly platformData$ = combineLatest([this.platformSvc.config$, this.userSvc.users$]).pipe(
    map(([config, users]) => ({
      ...config,
      total: users.length,
      mentors: users.filter((u) => u.role === UserRole.Mentor && u.mentorApprovalStatus !== MentorApprovalStatus.Rejected).length,
    })),
  );
  readonly values = [
    { icon: ['fas', 'handshake'] as [string, string], title: 'Trust & Transparency', description: 'We build trust through transparent processes and escrow protection for all transactions.' },
    { icon: ['fas', 'bullseye'] as [string, string], title: 'Quality First', description: 'We verify all mentors to ensure only the best professionals join our platform.' },
    { icon: ['fas', 'globe'] as [string, string], title: 'Accessibility', description: 'Great mentorship should be available to everyone, regardless of their network.' },
  ];

  readonly team = [
    { name: 'Sarah Chen', role: 'CEO & Co-founder' },
    { name: 'Alex Rivera', role: 'CTO & Co-founder' },
    { name: 'Jordan Williams', role: 'Head of Product' },
    { name: 'Emma Thompson', role: 'Head of Operations' },
  ];

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
