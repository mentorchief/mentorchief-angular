import { PlatformFacade } from '../../../core/facades/platform.facade';
import { ReportsFacade } from '../../../core/facades/reports.facade';
import { UsersFacade } from '../../../core/facades/users.facade';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs';
import { UserRole, MentorApprovalStatus } from '../../../core/models/user.model';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MentorCardComponent } from '../../../shared/components/mentor-card.component';
import { TESTIMONIALS } from '../../../core/data/testimonials.data';
import type { Mentor } from '../../../core/models/mentor.model';
import type { Testimonial } from '../../../core/models/testimonial.model';
import { DEFAULT_SAMPLE_PRICE } from '../../../core/constants';
import { selectApprovedMentorProfiles } from '../../../store/data-flow.selectors';

@Component({
  selector: 'mc-landing-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, MentorCardComponent],
  template: `
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-b from-primary/[0.04] via-white to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-secondary-foreground text-sm mb-6">
              <fa-icon [icon]="['fas', 'shield-halved']" class="w-4 h-4" />
              Payments secured until mentorship completes
            </div>
            <h1 class="text-4xl lg:text-5xl xl:text-6xl text-foreground !leading-tight">
              Find Your Perfect
              <span class="text-primary block">Mentor</span>
            </h1>
            <p class="mt-5 text-muted-foreground text-lg max-w-lg">
              Connect with industry-leading mentors through secure monthly subscriptions.
              Your payment is held safely until the mentorship period is complete.
            </p>
            <div class="flex flex-col sm:flex-row gap-3 mt-8">
              <a
                routerLink="/browse"
                class="px-7 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity no-underline text-center inline-flex items-center justify-center gap-2"
              >
                Browse Mentors
                <span>→</span>
              </a>
              <a
                routerLink="/signup"
                class="px-7 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors no-underline text-center"
              >
                Become a Mentor
              </a>
            </div>

            <!-- Stats -->
            @if (platformData$ | async; as data) {
              <div class="flex gap-8 mt-10 pt-8 border-t border-border">
                <div>
                  <div class="text-2xl text-foreground font-serif">{{ data.total }}+</div>
                  <div class="text-muted-foreground text-sm">Active Users</div>
                </div>
                <div>
                  <div class="text-2xl text-foreground font-serif">{{ data.mentors }}+</div>
                  <div class="text-muted-foreground text-sm">Expert Mentors</div>
                </div>
                <div>
                  <div class="text-2xl text-foreground font-serif">{{ data.satisfactionRate }}%</div>
                  <div class="text-muted-foreground text-sm">Satisfaction Rate</div>
                </div>
              </div>
            }
          </div>

          <div class="hidden lg:block relative">
            <div class="relative rounded-xl overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src="https://images.unsplash.com/photo-1589639293663-f9399bb41721?w=800"
                alt="Mentoring session"
                class="w-full h-[420px] object-cover"
              />
            </div>
            <!-- Floating card -->
            <div class="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 border border-border">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <fa-icon [icon]="['fas', 'check']" class="text-green-600 w-5 h-5" />
                </div>
                <div>
                  <div class="text-foreground text-sm">Payment Secured</div>
                  <div class="text-muted-foreground text-xs">Released on completion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-20 lg:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl lg:text-4xl text-foreground">How Mentorchief Works</h2>
          <p class="text-muted-foreground mt-3 max-w-2xl mx-auto">
            A simple, secure process designed to protect both mentors and mentees.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (item of howItWorksSteps; track item.step) {
            <div class="relative p-6 rounded-lg bg-muted/50 border border-border hover:border-primary/20 transition-colors group">
              <div class="absolute top-4 right-4 text-4xl text-primary/10 group-hover:text-primary/20 transition-colors font-serif">
                {{ item.step }}
              </div>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary text-xl">
                <fa-icon [icon]="item.icon" class="w-6 h-6" />
              </div>
              <h3 class="text-foreground mb-2">{{ item.title }}</h3>
              <p class="text-muted-foreground text-sm">{{ item.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Featured Mentors -->
    <section class="py-20 lg:py-24 bg-muted/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-10">
          <div>
            <h2 class="text-3xl lg:text-4xl text-foreground">Featured Mentors</h2>
            <p class="text-muted-foreground mt-2">Top-rated mentors ready to help you grow</p>
          </div>
          <a routerLink="/browse" class="hidden sm:inline-flex items-center gap-1 text-primary hover:underline no-underline">
            View all mentors
            <fa-icon [icon]="['fas', 'chevron-right']" class="w-4 h-4" />
          </a>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (mentor of featuredMentors; track mentor.id) {
            <mc-mentor-card
              [mentor]="mentor"
              [reviewCount]="(reviewCountByMentorId$ | async)?.[mentor.id] ?? 0"
            />
          }
        </div>

        <div class="sm:hidden text-center mt-8">
          <a routerLink="/browse" class="inline-flex items-center gap-1 text-primary no-underline">
            View all mentors
            <fa-icon [icon]="['fas', 'chevron-right']" class="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>

    <!-- Trust / Escrow Section -->
    <section class="py-20 lg:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <h2 class="text-3xl lg:text-4xl text-foreground">
              Your Payment, <span class="text-primary">Protected</span>
            </h2>
            <p class="text-muted-foreground mt-4 text-lg">
              We hold your subscription payment in escrow throughout the mentorship period.
              Funds are only released to the mentor once the commitment is fulfilled.
            </p>

            <div class="mt-8 space-y-5">
              <div class="flex gap-4">
                <div class="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center shrink-0 text-primary">
                  <fa-icon [icon]="['fas', 'shield-halved']" class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="text-foreground">Escrow Protection</h4>
                  <p class="text-muted-foreground text-sm">Payments held securely until mentorship completes</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center shrink-0 text-primary">
                  <fa-icon [icon]="['fas', 'users']" class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="text-foreground">Dispute Resolution</h4>
                  <p class="text-muted-foreground text-sm">Fair resolution process if expectations aren't met</p>
                </div>
              </div>
            </div>
          </div>

          <div class="relative">
            <div class="bg-gradient-to-br from-primary/5 to-secondary/50 rounded-xl p-8 lg:p-10">
              <div class="bg-white rounded-lg p-6 shadow-sm border border-border mb-4">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-muted-foreground text-sm">Monthly Subscription</span>
                  <span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-xs">In Escrow</span>
                </div>
                <div class="text-3xl text-foreground font-serif">\${{ (platformData$ | async)?.samplePrice ?? defaultSamplePrice }}.00</div>
                <div class="text-muted-foreground text-sm mt-1">Payment held securely</div>
                <div class="mt-2 text-xs text-muted-foreground">
                  Release date: Apr 1, 2026
                </div>
              </div>

              <div class="bg-white rounded-lg p-6 shadow-sm border border-border">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-muted-foreground text-sm">Previous Period</span>
                  <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs">Released</span>
                </div>
                <div class="text-2xl text-foreground font-serif">\${{ (platformData$ | async)?.samplePrice ?? defaultSamplePrice }}.00</div>
                <div class="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <fa-icon [icon]="['fas', 'check']" class="w-4 h-4" /> Successfully paid to mentor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-20 lg:py-24 bg-muted/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl lg:text-4xl text-foreground">Loved by Professionals</h2>
          <p class="text-muted-foreground mt-3">See what our community has to say</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          @for (t of testimonials; track t.name) {
            <div class="bg-white rounded-lg p-6 border border-border">
              <div class="flex gap-0.5 mb-4">
                @for (star of getStars(t.rating); track $index) {
                  <fa-icon [icon]="['fas', 'star']" class="text-amber-400 w-4 h-4" />
                }
              </div>
              <p class="text-foreground text-sm mb-5 leading-relaxed">"{{ t.text }}"</p>
              <div>
                <div class="text-foreground text-sm font-medium">{{ t.name }}</div>
                <div class="text-muted-foreground text-xs">{{ t.role }}</div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 lg:py-24 bg-primary">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl lg:text-4xl text-white">Ready to Accelerate Your Growth?</h2>
        <p class="text-white/70 mt-4 text-lg">
          Join thousands of professionals who've transformed their careers with Mentorchief.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <a routerLink="/browse" class="px-8 py-3 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors no-underline font-medium">
            Find a Mentor
          </a>
          <a routerLink="/signup" class="px-8 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors no-underline">
            Apply as Mentor
          </a>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly platformSvc = inject(PlatformFacade);
  private readonly reportsSvc = inject(ReportsFacade);
  private readonly userSvc = inject(UsersFacade);
  private readonly store = inject(Store);
  readonly defaultSamplePrice = DEFAULT_SAMPLE_PRICE;
  readonly platformData$ = combineLatest([this.platformSvc.config$, this.userSvc.users$]).pipe(
    map(([config, users]) => ({
      ...config,
      total: users.length,
      mentors: users.filter((u) => u.role === UserRole.Mentor && u.mentorApprovalStatus !== MentorApprovalStatus.Rejected).length,
    })),
  );
  readonly reviewCountByMentorId$ = new BehaviorSubject<Record<string,number>>(this.reportsSvc.getReviewCountByMentorId());
  featuredMentors: Mentor[] = [];
  readonly testimonials: Testimonial[] = TESTIMONIALS;

  constructor() {
    this.store.select(selectApprovedMentorProfiles).subscribe((mentors) => {
      this.featuredMentors = mentors.slice(0, 3);
    });
  }

  readonly howItWorksSteps = [
    { icon: ['fas', 'magnifying-glass'] as [string, string], title: 'Find Your Mentor', desc: 'Browse our curated network of verified mentors. Filter by expertise, industry, and price.', step: '01' },
    { icon: ['fas', 'dollar-sign'] as [string, string], title: 'Subscribe Securely', desc: 'Pay a monthly subscription. Your payment is held in escrow by the platform until the mentorship period completes.', step: '02' },
    { icon: ['fas', 'check'] as [string, string], title: 'Grow & Complete', desc: 'Engage in structured mentorship sessions and communicate through our platform.', step: '03' },
    { icon: ['fas', 'file-lines'] as [string, string], title: 'Get Your Report', desc: 'Receive a detailed performance report from your mentor highlighting your strengths and areas for improvement.', step: '04' },
  ];

  getStars(rating: number): number[] {
    return Array.from({ length: rating });
  }
}
