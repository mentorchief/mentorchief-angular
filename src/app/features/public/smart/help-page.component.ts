import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HELP_CATEGORIES } from '../../../core/data/help-categories.data';

@Component({
  selector: 'mc-help-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl lg:text-4xl text-foreground">Help Center</h1>
        <p class="text-muted-foreground mt-3">Find answers to common questions</p>
        <div class="mt-6 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search for help..."
            class="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      <!-- Categories -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        @for (category of helpCategories; track category.title) {
          <button type="button" class="p-6 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors text-left">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <fa-icon [icon]="category.icon" class="text-2xl w-6 h-6" />
            </div>
            <h3 class="text-foreground font-medium">{{ category.title }}</h3>
            <p class="text-muted-foreground text-sm mt-1">{{ category.count }} articles</p>
          </button>
        }
      </div>

      <!-- FAQs -->
      <div class="mb-12">
        <h2 class="text-2xl text-foreground mb-6">Frequently Asked Questions</h2>
        <div class="space-y-4">
          @for (faq of faqs; track faq.question) {
            <div class="bg-card rounded-lg border border-border overflow-hidden">
              <button
                (click)="faq.open = !faq.open"
                class="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span class="text-foreground font-medium">{{ faq.question }}</span>
                <fa-icon [icon]="['fas', 'chevron-down']" class="text-muted-foreground transition-transform w-4 h-4" [class.rotate-180]="faq.open" />
              </button>
              @if (faq.open) {
                <div class="px-6 pb-4">
                  <p class="text-muted-foreground">{{ faq.answer }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Contact -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-card rounded-lg border border-border p-6">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <fa-icon [icon]="['fas', 'message']" class="text-2xl w-6 h-6" />
          </div>
          <h3 class="text-foreground font-medium mb-2">Chat with Us</h3>
          <p class="text-muted-foreground text-sm mb-4">
            Get instant help from our support team. Available Mon-Fri, 9am-6pm EST.
          </p>
          <a href="mailto:support@mentorchief.com" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 inline-block no-underline">
            Start Chat
          </a>
        </div>
        <div class="bg-card rounded-lg border border-border p-6">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <fa-icon [icon]="['fas', 'envelope']" class="text-2xl w-6 h-6" />
          </div>
          <h3 class="text-foreground font-medium mb-2">Email Support</h3>
          <p class="text-muted-foreground text-sm mb-4">
            Send us an email and we'll respond within 24 hours.
          </p>
          <a href="mailto:support@mentorchief.com" class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted inline-block no-underline">
            support&#64;mentorchief.com
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPageComponent {
  readonly helpCategories = HELP_CATEGORIES;

  faqs = [
    {
      question: 'How does the escrow payment system work?',
      answer: 'When you subscribe to a mentor, your payment is held securely in escrow. The funds are only released to the mentor after the mentorship period is complete, ensuring both parties are protected.',
      open: false,
    },
    {
      question: 'Can I get a refund?',
      answer: 'Yes, you can request a full refund within the first 3 days of starting a new mentorship. After that, refunds are handled on a case-by-case basis through our dispute resolution process.',
      open: false,
    },
    {
      question: 'How do I become a mentor?',
      answer: 'Sign up for an account and select "Mentor" as your role during registration. You\'ll need to complete your profile, set your pricing, and go through our verification process.',
      open: false,
    },
    {
      question: 'What happens if I have a dispute with my mentor/mentee?',
      answer: 'You can open a dispute through your dashboard. Our support team will review the case and mediate between both parties. If necessary, we\'ll make a final decision regarding payment.',
      open: false,
    },
    {
      question: 'How are mentors verified?',
      answer: 'We verify mentors through LinkedIn profile verification, professional credential checks, and a brief interview process to ensure quality.',
      open: false,
    },
  ];
}
