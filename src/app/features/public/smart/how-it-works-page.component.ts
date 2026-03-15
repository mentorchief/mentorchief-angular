import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mc-how-it-works-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-primary/[0.04] to-white py-20 lg:py-28">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl lg:text-5xl text-foreground">How Mentorchief Works</h1>
        <p class="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
          A simple, secure process designed to protect both mentors and mentees while delivering exceptional mentorship experiences.
        </p>
      </div>
    </section>

    <!-- For Mentees -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">For Mentees</span>
          <h2 class="text-3xl text-foreground mt-4">Find Your Perfect Mentor</h2>
        </div>

        <div class="grid md:grid-cols-4 gap-8">
          @for (step of menteeSteps; track step.number) {
            <div class="text-center">
              <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <fa-icon [icon]="step.icon" class="text-2xl w-8 h-8" />
              </div>
              <div class="text-4xl text-primary/20 font-serif mb-2">{{ step.number }}</div>
              <h3 class="text-foreground font-medium mb-2">{{ step.title }}</h3>
              <p class="text-muted-foreground text-sm">{{ step.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- For Mentors -->
    <section class="py-20 bg-muted/30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm">For Mentors</span>
          <h2 class="text-3xl text-foreground mt-4">Share Your Expertise</h2>
        </div>

        <div class="grid md:grid-cols-4 gap-8">
          @for (step of mentorSteps; track step.number) {
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <fa-icon [icon]="step.icon" class="text-2xl w-8 h-8" />
              </div>
              <div class="text-4xl text-purple-200 font-serif mb-2">{{ step.number }}</div>
              <h3 class="text-foreground font-medium mb-2">{{ step.title }}</h3>
              <p class="text-muted-foreground text-sm">{{ step.description }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Escrow Protection -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">Secure Payments</span>
            <h2 class="text-3xl text-foreground mt-4 mb-6">Protected by Escrow</h2>
            <div class="space-y-4">
              @for (feature of escrowFeatures; track feature.title) {
                <div class="flex gap-4">
                  <div class="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center shrink-0">
                    <fa-icon [icon]="feature.icon" class="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <h4 class="text-foreground font-medium">{{ feature.title }}</h4>
                    <p class="text-muted-foreground text-sm">{{ feature.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-primary/5 rounded-xl p-8">
            <div class="bg-white rounded-lg p-6 shadow-sm border border-border">
              <div class="flex items-center justify-between mb-4">
                <span class="text-muted-foreground">Payment Flow</span>
                <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Secure</span>
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">1</div>
                  <span class="text-foreground text-sm">Mentee pays subscription</span>
                </div>
                <div class="w-0.5 h-4 bg-border ml-4"></div>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm">2</div>
                  <span class="text-foreground text-sm">Funds held in escrow</span>
                </div>
                <div class="w-0.5 h-4 bg-border ml-4"></div>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">3</div>
                  <span class="text-foreground text-sm">Released to mentor on completion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 bg-primary">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl text-white">Ready to Get Started?</h2>
        <p class="text-white/70 mt-4">Join thousands of professionals growing with Mentorchief.</p>
        <div class="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <a routerLink="/browse" class="px-8 py-3 bg-white text-primary rounded-lg hover:bg-white/90 no-underline font-medium">
            Find a Mentor
          </a>
          <a routerLink="/signup" class="px-8 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 no-underline">
            Become a Mentor
          </a>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksPageComponent {
  readonly menteeSteps = [
    { number: '01', icon: ['fas', 'magnifying-glass'] as [string, string], title: 'Browse Mentors', description: 'Explore our network of verified industry experts' },
    { number: '02', icon: ['fas', 'dollar-sign'] as [string, string], title: 'Subscribe Securely', description: 'Pay monthly with funds held in escrow protection' },
    { number: '03', icon: ['fas', 'book'] as [string, string], title: 'Learn & Grow', description: 'Engage in structured sessions with your mentor' },
    { number: '04', icon: ['fas', 'file-lines'] as [string, string], title: 'Get Results', description: 'Receive detailed reports and recommendations from your mentor' },
  ];

  readonly mentorSteps = [
    { number: '01', icon: ['fas', 'pen-to-square'] as [string, string], title: 'Create Profile', description: 'Set up your expertise areas and pricing plans' },
    { number: '02', icon: ['fas', 'check'] as [string, string], title: 'Get Verified', description: 'Complete our verification process' },
    { number: '03', icon: ['fas', 'users'] as [string, string], title: 'Accept Mentees', description: 'Review and accept mentorship requests' },
    { number: '04', icon: ['fas', 'wallet'] as [string, string], title: 'Earn Securely', description: 'Get paid when mentorship periods complete' },
  ];

  readonly escrowFeatures = [
    { icon: ['fas', 'shield-halved'] as [string, string], title: 'Payment Protection', description: 'All payments held securely until mentorship completes' },
    { icon: ['fas', 'scale-balanced'] as [string, string], title: 'Fair Dispute Resolution', description: 'Neutral mediation if expectations aren\'t met' },
    { icon: ['fas', 'hand-holding-dollar'] as [string, string], title: 'Easy Refunds', description: 'Cancel within 3 days for a full refund' },
    { icon: ['fas', 'lock'] as [string, string], title: 'Bank-Level Security', description: 'PCI-compliant payment processing' },
  ];
}
